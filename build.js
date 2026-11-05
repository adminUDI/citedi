import { mkdirSync, copyFileSync, readFileSync, writeFileSync, readdirSync } from 'node:fs';
for (const directory of ['dist/server', 'dist/.openai']) mkdirSync(directory, {recursive: true});
const assets = Object.fromEntries(readdirSync('assets').map(name => [name,readFileSync('assets/' + name).toString('base64')]));
const worker = readFileSync('worker/index.js','utf8');
writeFileSync('dist/server/index.js',worker.replace('const bundledAssets = {};', () => 'const bundledAssets = ' + JSON.stringify(assets) + ';'));
copyFileSync('.openai/hosting.json', 'dist/.openai/hosting.json');
