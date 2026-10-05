import { readFile, stat } from 'node:fs/promises';
import assert from 'node:assert/strict';
const root = new URL('../public/', import.meta.url);
const html = await readFile(new URL('index.html', root), 'utf8');
const css = await readFile(new URL('styles.css', root), 'utf8');
const js = await readFile(new URL('app.js', root), 'utf8');
// Catch broken packaged assets and fragment links before deploying.
const refs = new Set([...`${html}\n${css}\n${js}`.matchAll(/assets\/[\w.-]+/g)].map(m => m[0]));
for (const file of ['app.js', 'crunch.js', 'styles.css', 'assets/chip-a.mp3', 'assets/chip-b.mp3', ...refs]) {
  assert((await stat(new URL(file, root))).isFile(), `Missing site asset: ${file}`);
}
const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map(m => m[1]);
assert.equal(new Set(ids).size, ids.length, 'Duplicate HTML IDs');
for (const [, id] of html.matchAll(/href="#([^"]+)"/g)) assert(ids.includes(id), `Broken anchor: #${id}`);
for (const id of ['crunch', 'copper', 'mail', 'painting']) assert(ids.includes(id), `Missing discovery: ${id}`);
assert(!/<audio[^>]*\bautoplay\b/.test(html), 'Discovery audio must remain opt-in');
console.log(`Checked ${refs.size} asset references and all local anchors.`);
