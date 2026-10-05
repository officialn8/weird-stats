import { readFile, stat, mkdir, copyFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import assert from 'node:assert/strict';
import { getTreatment } from '../src/treatments/registry.mjs';
import { root } from './content.mjs';
const shared=['app.js','discoveries.js','styles.css','assets/favicon.svg','assets/outfit.ttf','assets/OFL-Outfit.txt'];
const resolve = (value,entry) => typeof value==='function' ? value(entry) : value;
export function entryAssets(entry) {
  const definition=getTreatment(entry.treatment.kind);
  return [...new Set([...(resolve(definition.assets,entry)??[]),...(entry.assets??[]).map(a=>a.path)])];
}
export function entryScripts(entry) { return resolve(getTreatment(entry.treatment.kind).scripts,entry)??[]; }
export function ownedAssets(entries) { return [...new Set([...shared,...entries.flatMap(e=>[...entryAssets(e),...entryScripts(e)])])]; }
export async function assetDigests(entry) {
  return Object.fromEntries(await Promise.all(entryAssets(entry).map(async path=>[path,createHash('sha256').update(await readFile(new URL('public/'+path,root))).digest('hex')])));
}
export async function checkAssets(entries, html='') {
  const assets=ownedAssets(entries), owned=new Set(assets);
  for(const path of assets) {
    assert(/^[a-zA-Z0-9_./-]+$/.test(path) && !path.split('/').some(p=>p==='..'||p==='.'||!p),`Invalid asset path: ${path}`);
    try { assert((await stat(new URL('public/'+path,root))).isFile()); }
    catch { throw new Error(`Missing asset: ${path}`); }
  }
  const css=await readFile(new URL('public/styles.css',root),'utf8');
  for(const [,path] of `${html}\n${css}`.matchAll(/\b(assets\/[a-zA-Z0-9_./-]+)/g)) assert(owned.has(path),`Referenced asset has no eligible owner: ${path}`);
  return assets;
}
export async function copyAssets(assets,output) {
  for(const path of assets) {
    const destination=new URL(path,output);
    await mkdir(new URL('./',destination),{recursive:true});
    await copyFile(new URL('public/'+path,root),destination);
  }
}
export function sceneHead(entries,context) {
  const scripts=[...new Set(entries.flatMap(entryScripts))].map(path=>`<script src="${context.assetHref(path)}" defer></script>`).join('');
  const preload=entries[0]?.id==='crunch' ? `<link rel="preload" href="${context.assetHref('assets/chip.webp')}" as="image" fetchpriority="high" imagesrcset="${context.assetHref('assets/chip-small.webp')} 600w, ${context.assetHref('assets/chip.webp')} 800w" imagesizes="(max-width:767px) 300px, (max-width:1450px) 31vw, 440px">` : '';
  return preload+scripts;
}
