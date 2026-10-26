import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { createHash } from 'node:crypto';

// Only stamp a built artifact. Never derive the release date in a visitor's browser.
const root = resolve(process.argv[2] || 'dist');
const page = resolve(root, 'thesis-library/purple/island/index.html');
const date = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'Asia/Taipei', year: 'numeric', month: '2-digit', day: '2-digit',
}).format(new Date());
const html = await readFile(page, 'utf8');
const marker = /<time id="release-date" datetime="[0-9-]+">[0-9-]+<\/time>/g;
if ([...html.matchAll(marker)].length !== 1) throw new Error('Expected exactly one research festival release date');
const stamped = html.replace(marker, `<time id="release-date" datetime="${date}">${date}</time>`);
await writeFile(page, stamped);
const manifestPath = resolve(root, 'thesis-library/purple/island/export-manifest.json');
const manifest = JSON.parse(await readFile(manifestPath, 'utf8'));
manifest.deploymentDate = date;
manifest.dateTimeZone = 'Asia/Taipei';
manifest.files['index.html'] = createHash('sha256').update(stamped).digest('hex');
await writeFile(manifestPath, JSON.stringify(manifest, null, 2) + '\n');
console.log(`Research festival release date: ${date} (Asia/Taipei)`);
