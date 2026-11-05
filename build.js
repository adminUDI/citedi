import { mkdirSync, copyFileSync, readFileSync, readdirSync } from 'node:fs';
import {build} from 'esbuild';
import path from 'node:path';
for (const directory of ['dist/server', 'dist/.openai']) mkdirSync(directory, {recursive: true});
const assets = Object.fromEntries(readdirSync('assets').map(name => [name,readFileSync('assets/' + name).toString('base64')]));
const worker = readFileSync('worker/index.js','utf8');
await build({
  stdin:{contents:worker.replace('const bundledAssets = {};', () => 'const bundledAssets = ' + JSON.stringify(assets) + ';'),resolveDir:path.resolve('worker'),sourcefile:'index.js',loader:'js'},
  bundle:true,format:'esm',platform:'browser',target:'es2022',outfile:'dist/server/index.js'
});
copyFileSync('.openai/hosting.json', 'dist/.openai/hosting.json');
