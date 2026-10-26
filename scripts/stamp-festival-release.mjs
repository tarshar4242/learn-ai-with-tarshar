import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

// Only stamp a built artifact. Never derive the release date in a visitor's browser.
const root = resolve(process.argv[2] || 'dist');
const page = resolve(root, 'thesis-library/purple/island/index.html');
const date = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'Asia/Taipei', year: 'numeric', month: '2-digit', day: '2-digit',
}).format(new Date());
const html = await readFile(page, 'utf8');
const marker = /<time id="release-date" datetime="[0-9-]+">[0-9-]+<\/time>/g;
if ([...html.matchAll(marker)].length !== 1) throw new Error('Expected exactly one research festival release date');
await writeFile(page, html.replace(marker, `<time id="release-date" datetime="${date}">${date}</time>`));
console.log(`Research festival release date: ${date} (Asia/Taipei)`);
