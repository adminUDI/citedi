import { mkdirSync, copyFileSync } from 'node:fs';
for (const directory of ['dist/server', 'dist/.openai']) mkdirSync(directory, {recursive: true});
copyFileSync('worker/index.js', 'dist/server/index.js');
copyFileSync('.openai/hosting.json', 'dist/.openai/hosting.json');
