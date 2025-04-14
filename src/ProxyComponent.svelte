<svelte:options customElement={{
		tag: "proxy-component",
		shadow: 'none',}} />
<script lang="ts">
    import {onMount} from 'svelte';
    import StringComponent from './String.svelte'
    import FileComponent from './File.svelte'
    import ScriptComponent from './Script.svelte'

    onMount(() => {
        chrome.runtime.sendMessage(null,
            (rules) => {
                entries = [...rules ?? []]
            }
        );
    });

    let src: string = '';
    let entries: { src: string, dst: string | (() => void), active: boolean, id?: number }[] = [];
    let type = "string";
    let dst: string | (() => void) = '';
    let requests: { url: string, method: string, type: string }[] = []
    let fileInput: HTMLInputElement;
    let clipboardWrapper: HTMLTextAreaElement;

    chrome?.devtools?.network?.onRequestFinished?.addListener((request) => {
        const newList = [{
            url: request.request.url,
            method: request.method,
            type: request._resourceType,
            postData: request.request.postData,
            status: request.response.status
        }, ...requests]
        newList.length = Math.min(newList.length, 30)
        requests = newList
    });

    function toggle(element: any) {
        const index = entries.indexOf(element);

        element.active ??= true
        element.active = !element.active

        entries[index] = element

        chrome?.runtime?.sendMessage(
            {
                ...element,
                active: element.active,
                type: element.type
            }
        );

        entries = [...entries];
    }

    function remove(element: any) {
        entries = entries.filter(entry => entry !== element);

        chrome?.runtime?.sendMessage(
            {
                ...element,
                active: false,
                type: element.type
            }
        );
    }

    function handleSubmit(e: Event) {
        e.preventDefault();

        if (!src || !dst) return;

        const active = true;

        entries = [...entries, {src, dst, active}];

        chrome?.runtime?.sendMessage(
            {
                src,
                dst,
                active,
                type,
                methods
            },
            (rules) => {
                entries = [...rules ?? []]
            }
        );

        src = '';
        dst = '';
    }

    function update(e: Event) {
        dst = e?.detail;
    }

    function handleFileInput(event: Event) {
        const target = event.target as HTMLInputElement;
        const file = target.files?.[0];

        if (!file) {
            return;
        }
        const reader = new FileReader();
        reader.onload = () => {
            importRules(JSON.parse(reader.result as string));
        };
        reader.readAsText(file);
    }

    function toDataURL(payload) {
        return `data:application/json;charset=utf-8,${encodeURIComponent(JSON.stringify(payload))}`;
    }

    function exportRules() {
        const link = Object.assign(document.createElement('a'), {
            href: toDataURL(entries),
            download: "rules.json"
        });

        link.click();
    }

    function importRules(values: any[]) {
        chrome?.runtime?.sendMessage(values);
        entries = [...values];
    }

    function setSrc(request) {
        src = request.url;
        type = "string";

        switch (request.type) {
            case "image":
                methods = ["image"];
                break;
            case "document":
                methods = ["main_frame"];
                break;
            case "script":
                methods = ["script"];
                break;
            case "fetch":
            case "xhr":
                methods = ["xmlhttprequest"];
                break;
        }
    }

    let methods: string[];

    function toggleAll() {

    }


</script>

<div style="display: flex">
    <textarea
            bind:this={clipboardWrapper}
            style="position: absolute; left: -9999px; top: 0;"
            aria-hidden="true"
    ></textarea>
    <div style="flex: 1; border-right: 1px solid; padding: 0.5rem">
        <button aria-label="export" title="export" on:click={()=>exportRules()}><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><g fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" color="currentColor"><path d="M18.5 16c.506.491 2.5 1.8 2.5 2.5M18.5 21c.506-.491 2.5-1.8 2.5-2.5m0 0h-8M11 22h-.273c-3.26 0-4.892 0-6.024-.798a4.1 4.1 0 0 1-.855-.805C3 19.331 3 17.797 3 14.727v-2.545c0-2.963 0-4.445.469-5.628c.754-1.903 2.348-3.403 4.37-4.113C9.095 2 10.668 2 13.818 2c1.798 0 2.698 0 3.416.252c1.155.406 2.066 1.263 2.497 2.35C20 5.278 20 6.125 20 7.818V13"/><path d="M3 12a3.333 3.333 0 0 1 3.333-3.333c.666 0 1.451.116 2.098-.057A1.67 1.67 0 0 0 9.61 7.43c.173-.647.057-1.432.057-2.098A3.333 3.333 0 0 1 13 2"/></g></svg></button>
        <button aria-label="clipboard" title="clipboard" on:click={
        ()=>{
            clipboardWrapper.value = JSON.stringify(entries);
            clipboardWrapper.select();
            clipboardWrapper.setSelectionRange(0, clipboardWrapper.value.length); // For mobile

            try {
              document.execCommand("copy");
            } catch (err) {
              console.error("Copy failed", err);
            }
        }}><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><g fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" color="currentColor"><path d="M18 15v7m3.5-3.5h-7M7 16h4m-4-5h8M6.5 3.5c-1.556.047-2.483.22-3.125.862c-.879.88-.879 2.295-.879 5.126v6.506c0 2.832 0 4.247.879 5.127C4.253 22 5.668 22 8.496 22H11.5m3.992-18.5c1.556.047 2.484.22 3.125.862c.88.88.88 2.295.88 5.126V12"/><path d="M6.496 3.75c0-.966.784-1.75 1.75-1.75h5.5a1.75 1.75 0 1 1 0 3.5h-5.5a1.75 1.75 0 0 1-1.75-1.75"/></g></svg></button>
        <button aria-label="import" title="import" on:click={()=>fileInput.click()}><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><g fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" color="currentColor"><path d="M15.5 16c-.506.491-2.5 1.8-2.5 2.5m2.5 2.5c-.506-.491-2.5-1.8-2.5-2.5m0 0h8"/><path d="M11 22h-.273c-3.26 0-4.892 0-6.024-.798a4.1 4.1 0 0 1-.855-.805C3 19.331 3 17.797 3 14.727v-2.545c0-2.963 0-4.445.469-5.628c.754-1.903 2.348-3.403 4.37-4.113C9.095 2 10.668 2 13.818 2c1.798 0 2.698 0 3.416.252c1.155.406 2.066 1.263 2.497 2.35C20 5.278 20 6.125 20 7.818V13"/><path d="M3 12a3.333 3.333 0 0 1 3.333-3.333c.666 0 1.451.116 2.098-.057A1.67 1.67 0 0 0 9.61 7.43c.173-.647.057-1.432.057-2.098A3.333 3.333 0 0 1 13 2"/></g></svg></button>

        <input
                bind:this={fileInput}
                on:change={handleFileInput}
                style="display: none"
                type="file"
        />
        <form on:submit={handleSubmit}
              style="display: flex;
        gap: .5rem;
        padding-top: .5rem;
        padding-bottom: .5rem;
        margin-bottom: 1rem;flex-direction: column; position: sticky; top: 0; background-color: #fff; border-bottom: 1px solid;">
            <div style="flex-flow: wrap">
                <label><input bind:group={type} name="type" type="radio" value="string"/> URL</label>
                <label><input bind:group={type} name="type" type="radio" value="script"/> Script</label>
                <label><input bind:group={type} name="type" type="radio" value="file"/> File</label>
            </div>

            <div style="flex-flow: wrap">
                <label><input bind:group={methods} name="methods" type="checkbox" value="script"/> script</label>
                <label><input bind:group={methods} name="methods" type="checkbox" value="main_frame"/> main_frame</label>
                <label><input bind:group={methods} name="methods" type="checkbox" value="image"/> image</label>
                <label><input bind:group={methods} name="methods" type="checkbox" value="xmlhttprequest"/>xmlhttprequest</label>
            </div>
            <input bind:value={src} placeholder="Quelle"/>
                {#if type === 'string'}
                    <StringComponent bind:value={dst} on:change={update}/>
                {:else if type === 'script'}
                    <ScriptComponent bind:value={dst} on:change={update}/>
                {:else if type === 'file'}
                    <FileComponent on:change={update}/>
                {/if}
            <div>
                <button aria-label="add" title="add" type="submit"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 8v8m4-4H8m-5.5 0c0-4.478 0-6.718 1.391-8.109S7.521 2.5 12 2.5c4.478 0 6.718 0 8.109 1.391S21.5 7.521 21.5 12c0 4.478 0 6.718-1.391 8.109S16.479 21.5 12 21.5c-4.478 0-6.718 0-8.109-1.391S2.5 16.479 2.5 12" color="currentColor"/></svg></button>
            </div>
        </form>

        <table style="border-collapse: collapse;" class="entries-table">
            <thead>
            <tr>
                <th>Ursprung</th>
                <th>Quelle</th>
                <th>Ziel</th>
                <th>Typ</th>
                <th><button on:click={()=>toggleAll()}></button></th>
            </tr>
            </thead>

            <tbody>

            {#each entries as entry}
                <tr>
                    <td>{entry._responseType}</td>
                    <td>{entry.condition?.urlFilter}</td>
                    <td>{entry.action?.redirect?.url ?? entry.action?.requestHeaders?.join(",")}</td>
                    <td>{entry.condition?.resourceTypes?.join(", ")}</td>
                    <td>
                        <input type="checkbox" checked={entry.active === undefined ? true : entry.active}
                               on:click={()=>toggle(entry)}>
                    </td>
                    <td><button on:click={()=>remove(entry)}><svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24"><path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="m19.5 5.5l-.62 10.025c-.158 2.561-.237 3.842-.88 4.763a4 4 0 0 1-1.2 1.128c-.957.584-2.24.584-4.806.584c-2.57 0-3.855 0-4.814-.585a4 4 0 0 1-1.2-1.13c-.642-.922-.72-2.205-.874-4.77L4.5 5.5M3 5.5h18m-4.944 0l-.683-1.408c-.453-.936-.68-1.403-1.071-1.695a2 2 0 0 0-.275-.172C13.594 2 13.074 2 12.035 2c-1.066 0-1.599 0-2.04.234a2 2 0 0 0-.278.18c-.395.303-.616.788-1.058 1.757L8.053 5.5" color="currentColor"/></svg></button></td>
                </tr>
            {/each}
            </tbody>
        </table>
    </div>
    <div style="flex: 1; height: 100vh; overflow-y: auto; padding-left: 0.5rem; padding-right: 0.5rem;">
    <table style="border-collapse: collapse;">
        {#if requests?.length}
        <thead>
            <tr>
                <th>Status</th>
                <th>Quelle</th>
                <th>Methode</th>
                <th>Typ</th>
            </tr>
        </thead>
        {/if}
        <tbody>
        {#each requests as request, i}
            <tr>
                <td>{request.status}</td>
                <td><span role="button" title={request.url} on:click={()=>setSrc(request)} style="white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 100rem; display: block">{request.url}</span></td>
                <td>{request.method}</td>
                <td>{request.type}</td>
            </tr>
        {/each}
        </tbody>
    </table>
</div>
</div>

<style>
    input {
        padding: 0.5rem;
        flex: 1;
    }

    .entries-table {
        width: 100%;
        border-collapse: collapse;
    }

    .entries-table th, .entries-table td {
        padding: 0.5rem;
        border: 1px solid #ccc;
    }
</style>