import { copyFileSync } from 'fs';

function copy(filename: string) {
    copyFileSync(`${__dirname}/src/${filename}`, `${__dirname}/dist/${filename}`)
}

copy("manifest.json");
copy("devtools.html");