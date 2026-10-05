import { mkdir, rm, readFile, writeFile } from 'node:fs/promises';
import { root, loadEntries, selectRelease, renderEntry, csv, validate, createPageContext, contentDigest, esc } from './content.mjs';
import { getTreatment } from '../src/treatments/registry.mjs';
import { checkAssets, copyAssets, sceneHead, assetDigests } from './assets.mjs';
export async function build({drafts=false,now=new Date(),records,manifest,revisions=[],output=new URL(drafts?'review-dist/':'dist/',root)}={}) {
  // Inject records, release snapshots and an output directory for isolated tests.
  // Production manifest loading/migration is U7; legacy selection remains explicit here.
  const all=records === undefined ? await loadEntries() : records.map(validate);
  const selection=selectRelease(all,{manifest,revisions,drafts,now});
  const {entries,withdrawals}=selection;
  if(!entries.length && !withdrawals.length) throw new Error('No publishable entries');
  const context=createPageContext();
  for(const entry of entries) {
    const revision=selection.revisions.get(entry.id);
    if(!revision) continue;
    const fragment=entry.treatment.kind==='custom' ? await readFile(new URL(`src/exhibits/${entry.treatment.template}.html`,root),'utf8') : '';
    const digest=contentDigest(entry,{fragment,assetDigests:await assetDigests(entry)});
    if(digest!==revision.digest) throw new Error(`${entry.id}: working fragment or assets differ from released revision`);
  }
  const fragments=await Promise.all(entries.map((e,i)=>renderEntry(e,entries[i+1],now,context)));
  for(let i=0;i<fragments.length;i++) fragments[i]=fragments[i].replace(/<h[12](\s[^>]*)?>([\s\S]*?)<\/h[12]>/,(_,a='',body)=>`<h${i?2:1}${a}>${body}</h${i?2:1}>`);
  let html=await readFile(new URL('src/shell.html',root),'utf8');
  html=html.replace('{{entries}}',()=>fragments.join('\n')).replaceAll('{{firstId}}',entries[0]?.id??'withdrawals').replace('{{entryCount}}',String(entries.length)).replace('{{draftBanner}}',drafts?'<aside class="draft-banner">Editorial preview · includes unpublished drafts</aside>':'').replace('{{sceneHead}}',sceneHead(entries,context));
  if(withdrawals.length) html=html.replace('</main>',`<section id="withdrawals" aria-label="Withdrawn discoveries">${withdrawals.map(w=>`<article id="${esc(w.id)}"><h2>Discovery withdrawn</h2><p>${esc(w.reason)}</p></article>`).join('')}</section></main>`);
  if(drafts) html=html.replace('<head>','<head><meta name="robots" content="noindex,nofollow">');
  // Validate every dependency before touching the previous output.
  const assets=await checkAssets(entries,html);
  await rm(output,{recursive:true,force:true});
  await mkdir(output,{recursive:true});
  await copyAssets(assets,output);
  await writeFile(new URL('index.html',output),html);
  await mkdir(new URL('data/',output),{recursive:true});
  for(const e of entries.filter(e=>getTreatment(e.treatment.kind).exportsData)) await writeFile(new URL(`data/${e.id}.csv`,output),csv(e));
  await writeFile(new URL('feed.json',output),JSON.stringify({builtAt:now.toISOString(),entries:entries.map(e=>({id:e.id,title:e.title,topic:e.topic,publishedAt:e.publishedAt ?? null,dataAsOf:e.evidence.dataAsOf,checkedAt:e.evidence.checkedAt,reviewDue:e.evidence.reviewDue,url:'#'+e.id}))},null,2));
  console.log(`Built ${entries.length} discoveries → ${output.pathname}`);
  return {entries,withdrawals,selection,output,html,assets};
}
if(process.argv[1] && new URL(process.argv[1],'file:').href===import.meta.url) await build({drafts:process.argv.includes('--drafts')});
