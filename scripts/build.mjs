import { mkdir, rm, readFile, writeFile } from 'node:fs/promises';
import { root, loadEntries, selectRelease, renderEntry, csv, validate, createPageContext, contentDigest, esc } from './content.mjs';
import { getTreatment } from '../src/treatments/registry.mjs';
import { checkAssets, copyAssets, sceneHead, assetDigests } from './assets.mjs';
import {shareCopy,validatePublicOrigin} from './share-copy.mjs';
import {renderShareImage} from './share-images.mjs';
const description='Unexpected discoveries, interactive comparisons, and sourced numbers about the world.';
function metadata({title,description,canonical,image,alt,drafts=false}) {
  return `<title>${esc(title)} | weird.stats</title><meta name="description" content="${esc(description)}"><link rel="canonical" href="${esc(canonical)}"><meta property="og:type" content="website"><meta property="og:site_name" content="weird.stats"><meta property="og:title" content="${esc(title)}"><meta property="og:description" content="${esc(description)}"><meta property="og:url" content="${esc(canonical)}">${image?`<meta property="og:image" content="${esc(image)}"><meta property="og:image:type" content="image/png"><meta property="og:image:width" content="1200"><meta property="og:image:height" content="630"><meta property="og:image:alt" content="${esc(alt)}"><meta name="twitter:card" content="summary_large_image"><meta name="twitter:image" content="${esc(image)}"><meta name="twitter:image:alt" content="${esc(alt)}">`:''}${drafts?'<meta name="robots" content="noindex,nofollow">':''}`;
}
function heading(fragment,level) {
  return fragment.replace(/<h[12](\s[^>]*)?>([\s\S]*?)<\/h[12]>/,(_,attributes='',body)=>`<h${level}${attributes}>${body}</h${level}>`);
}
function fill(shell,values) {
  return shell.replace(/\{\{(\w+)\}\}/g,(_,key)=>{if(!(key in values))throw new Error(`Missing shell value: ${key}`);return values[key];});
}
function noticeHTML(title,reason) {
  return `<section class="discovery-notice" id="notice"><h1>${esc(title)}</h1><p>${esc(reason)}</p></section>`;
}
export async function build({drafts=false,now=new Date(),records,manifest,revisions=[],publicOrigin,output=new URL(drafts?'review-dist/':'dist/',root)}={}) {
  // Inject records, release snapshots and an output directory for isolated tests.
  // Production manifest loading/migration is U7; legacy selection remains explicit here.
  publicOrigin=validatePublicOrigin(publicOrigin);
  const all=records === undefined ? await loadEntries() : records.map(validate);
  if(new Set(all.map(e=>e.id)).size!==all.length)throw new Error('Duplicate entry ids');
  const selection=selectRelease(all,{manifest,revisions,drafts,now});
  const {entries,withdrawals}=selection;
  if(!entries.length && !withdrawals.length) throw new Error('No publishable entries');
  const context=createPageContext({publicOrigin});
  for(const entry of entries) {
    const revision=selection.revisions.get(entry.id);
    if(!revision) continue;
    const fragment=entry.treatment.kind==='custom' ? await readFile(new URL(`src/exhibits/${entry.treatment.template}.html`,root),'utf8') : '';
    const digest=contentDigest(entry,{fragment,assetDigests:await assetDigests(entry)});
    if(digest!==revision.digest) throw new Error(`${entry.id}: working fragment or assets differ from released revision`);
  }
  const [shell,discoveryShell]=await Promise.all(['src/shell.html','src/discovery-shell.html'].map(path=>readFile(new URL(path,root),'utf8')));
  const draftBanner=drafts?'<aside class="draft-banner">Editorial preview · includes unpublished drafts</aside>':'';
  const fragments=await Promise.all(entries.map(async(e,i)=>heading(await renderEntry(e,entries[i+1],now,context),i?2:1)));
  let html=fill(shell,{entries:fragments.join('\n'),firstId:entries[0]?.id??'withdrawals',entryCount:String(entries.length),draftBanner,sceneHead:sceneHead(entries,context),metadata:`<link rel="canonical" href="${esc(publicOrigin)}/">${drafts?'<meta name="robots" content="noindex,nofollow">':''}`});
  if(withdrawals.length) html=html.replace('</main>',`<section id="withdrawals" aria-label="Withdrawn discoveries">${withdrawals.map(w=>`<article id="${esc(w.id)}"><h2>Discovery withdrawn</h2><p>${esc(w.reason)}</p><a href="${context.discoveryHref(w.id)}">Withdrawal notice</a></article>`).join('')}</section></main>`);
  const pages=new Map(),images=new Map();
  const individualContext=createPageContext({mode:'discovery',publicOrigin});
  for(const entry of entries) {
    const {question,description}=shareCopy(entry),canonical=publicOrigin+context.discoveryHref(entry.id);
    pages.set(entry.id,fill(discoveryShell,{metadata:metadata({title:question,description,canonical,image:`${publicOrigin}/share/${entry.id}.png`,alt:question,drafts}),firstId:entry.id,draftBanner,entries:heading(await renderEntry(entry,null,now,individualContext),1),sceneHead:sceneHead([entry],individualContext)}));
    images.set(entry.id,renderShareImage(entry));
  }
  for(const withdrawal of withdrawals) pages.set(withdrawal.id,fill(discoveryShell,{metadata:metadata({title:'Discovery withdrawn',description:'This discovery is no longer available. Keep exploring the collection.',canonical:publicOrigin+context.discoveryHref(withdrawal.id),drafts}),firstId:'notice',draftBanner,entries:noticeHTML('Discovery withdrawn',withdrawal.reason),sceneHead:''}));
  const notFound=fill(discoveryShell,{metadata:metadata({title:'Discovery not found',description:'This discovery could not be found. Keep exploring the collection.',canonical:publicOrigin+'/404.html',drafts:true}),firstId:'notice',draftBanner:'',entries:noticeHTML('Discovery not found','This link does not lead to an available discovery.'),sceneHead:''});
  // Validate every selected page dependency and render images before touching prior output.
  const assets=await checkAssets(entries,[html,...pages.values(),notFound].join('\n'));
  await rm(output,{recursive:true,force:true});
  await mkdir(output,{recursive:true});
  await copyAssets(assets,output);
  await writeFile(new URL('index.html',output),html);
  await writeFile(new URL('404.html',output),notFound);
  for(const directory of ['data/','share/','discoveries/'])await mkdir(new URL(directory,output),{recursive:true});
  for(const [id,page] of pages) {const directory=new URL(`discoveries/${id}/`,output);await mkdir(directory,{recursive:true});await writeFile(new URL('index.html',directory),page);}
  for(const [id,png] of images)await writeFile(new URL(`share/${id}.png`,output),png);
  for(const e of entries.filter(e=>getTreatment(e.treatment.kind).exportsData)) await writeFile(new URL(`data/${e.id}.csv`,output),csv(e));
  await writeFile(new URL('feed.json',output),JSON.stringify({builtAt:now.toISOString(),entries:entries.map(e=>({id:e.id,title:shareCopy(e).question,topic:e.topic,publishedAt:e.publishedAt ?? null,dataAsOf:e.evidence.dataAsOf,checkedAt:e.evidence.checkedAt,reviewDue:e.evidence.reviewDue,url:publicOrigin+context.discoveryHref(e.id)}))},null,2));
  console.log(`Built ${entries.length} discoveries → ${output.pathname}`);
  return {entries,withdrawals,selection,output,html,assets,pages};
}
if(process.argv[1] && new URL(process.argv[1],'file:').href===import.meta.url) await build({drafts:process.argv.includes('--drafts')});
