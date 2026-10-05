import { cp, mkdir, rm, readFile, writeFile } from 'node:fs/promises';
import { root, loadEntries, selectEntries, renderEntry, csv } from './content.mjs';
export async function build({drafts=false,now=new Date()}={}) {
  const all=await loadEntries();
  const entries=selectEntries(all,{drafts,now});
  if(!entries.length) throw new Error('No publishable entries');
  const output=new URL(drafts?'review-dist/':'dist/',root);
  await rm(output,{recursive:true,force:true});
  await mkdir(output,{recursive:true});
  await cp(new URL('public/',root),output,{recursive:true,filter:source=>!source.endsWith('/index.html')});
  const fragments=await Promise.all(entries.map((e,i)=>renderEntry(e,entries[i+1],now)));
  // Exactly one primary heading, independent of which discovery leads the page.
  for(let i=0;i<fragments.length;i++) fragments[i]=fragments[i].replace(/<h[12](\s[^>]*)?>([\s\S]*?)<\/h[12]>/,(_,a='',body)=>`<h${i?2:1}${a}>${body}</h${i?2:1}>`);
  let html=await readFile(new URL('src/shell.html',root),'utf8');
  html=html.replace('{{entries}}',()=>fragments.join('\n')).replaceAll('{{firstId}}',entries[0].id).replace('{{entryCount}}',String(entries.length)).replace('{{draftBanner}}',drafts?'<aside class="draft-banner">Editorial preview · includes unpublished drafts</aside>':'');
  if(drafts) html=html.replace('<head>','<head><meta name="robots" content="noindex,nofollow">');
  await writeFile(new URL('index.html',output),html);
  await mkdir(new URL('data/',output),{recursive:true});
  for(const e of entries.filter(e=>['bar','line'].includes(e.treatment.kind))) await writeFile(new URL(`data/${e.id}.csv`,output),csv(e));
  await writeFile(new URL('feed.json',output),JSON.stringify({builtAt:now.toISOString(),entries:entries.map(e=>({id:e.id,title:e.title,topic:e.topic,publishedAt:e.publishedAt ?? null,dataAsOf:e.evidence.dataAsOf,checkedAt:e.evidence.checkedAt,reviewDue:e.evidence.reviewDue,url:'#'+e.id}))},null,2));
  console.log(`Built ${entries.length} discoveries → ${drafts?'review-dist':'dist'}/`);
  return {entries,output,html};
}
if(process.argv[1] && new URL(process.argv[1],'file:').href===import.meta.url) await build({drafts:process.argv.includes('--drafts')});
