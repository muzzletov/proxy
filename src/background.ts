const newRuleCallback = (values, {src: urlFilter, dst: url, methods}) => {
    const newRule = {
        id: values.reduce((max, rule) => Math.max(max, rule.id), 0) + 1,
        priority: 1,
        action: {
            type: 'redirect',
            redirect: {
                url
            }
        },
        condition: {
            urlFilter,
            resourceTypes: methods
        }
    };
    chrome.declarativeNetRequest.updateDynamicRules({
        addRules: [newRule as any],
        removeRuleIds: [newRule.id]
    }, () => {
        if (chrome.runtime.lastError) {
            console.error('Error adding dynamic rule:', chrome.runtime.lastError);
        }
    });

    values.push(newRule)
}

const toggleCallback = (values, rule) => {
    if (!rule.active) {
        removeDynamicRule(rule.id);
        return;
    }

    rule.id = values.reduce((max, rule) => Math.max(max, rule.id), 0) + 1;

    delete rule.active
    delete rule.type
    delete rule.methods

    chrome.declarativeNetRequest.updateDynamicRules({
        addRules: [rule as any]
    }, () => {
        if (chrome.runtime.lastError) {
            console.error('Error adding dynamic rule:', chrome.runtime.lastError);
        }
    });

    values.push(rule)
}

const importRulesCallback = (values, rules) => {
    values.push(...rules);

    chrome.declarativeNetRequest.getDynamicRules((values) => {
        chrome.declarativeNetRequest.updateDynamicRules({
            addRules: rules.filter(rule=>rule.active || rule.active === undefined).map(rule=>{
                rule = {...rule};
                delete rule.active;
                delete rule.type;
                return rule;
            }),
            removeRuleIds: values.map(rule=>rule.id)
        }, () => {
            if (chrome.runtime.lastError) {
                console.error('Error adding dynamic rule:', chrome.runtime.lastError);
            }
        });
    });
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
        let callback: (values: any[], rule: any) => void;
        if(Array.isArray(message)) {
            callback = importRulesCallback;
        } else if (message?.id) {
            callback = toggleCallback;
        } else if (message?.src && message?.dst) {
            callback = newRuleCallback;
        }

        chrome.declarativeNetRequest.getDynamicRules((values) => {
            values ??= [];
            callback?.(values, message);
            sendResponse(values);
        });

        return true;
    }
);

function removeDynamicRule(ruleId: number) {
    chrome.declarativeNetRequest.updateDynamicRules({
        removeRuleIds: [ruleId],
    }, () => {
        if (chrome.runtime.lastError) {
            console.error('Error removing dynamic rule:', chrome.runtime.lastError);
        }
    });
}
