import { readdir, readFile, access } from 'node:fs/promises';
import path from 'node:path';
async function allFiles(directory) {
  const output = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const file = path.join(directory, entry.name);
    if (entry.isDirectory()) output.push(...(await allFiles(file)));
    else output.push(file);
  }
  return output;
}
const files = await allFiles('dist');
let count = 0;
for (const file of files.filter((f) => f.endsWith('.html'))) {
  const content = await readFile(file, 'utf8');
  count++;
  for (const match of content.matchAll(/(?:href|src)="(\/afroatlas\/[^"#?]*)/g)) {
    const url = match[1];
    const local = path.join('dist', decodeURIComponent(url.slice('/afroatlas/'.length)));
    try {
      await access(url.endsWith('/') ? path.join(local, 'index.html') : local);
    } catch {
      throw new Error(`Broken local link ${url} from ${file}`);
    }
  }
}
console.log(
  `Checked local href/src paths in ${count} generated HTML pages, all valid under /afroatlas/.`,
);
