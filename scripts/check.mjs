import { readFile } from 'node:fs/promises';
import assert from 'node:assert/strict';
import { root, loadEntries, selectEntries, renderEntry, createPageContext } from './content.mjs';
import { checkAssets, sceneHead } from './assets.mjs';
import {validatePublicOrigin} from './share-copy.mjs';
const entries=await loadEntries();
const selected=selectEntries(entries,{drafts:true});
const context=createPageContext({publicOrigin:validatePublicOrigin()});
function checkAnchors(html) {
 const ids=[...html.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]);
 assert.equal(ids.length,new Set(ids).size,'Duplicate HTML IDs');
 for(const [,id] of html.matchAll(/href="#([^"]+)"/g))assert(ids.includes(id),`Broken anchor #${id}`);
 for(const [,path] of html.matchAll(/(?:src|href)="(assets\/[^\"]+)"/g))assert.fail(`Asset must be root-relative: ${path}`);
 for(const [,srcset] of html.matchAll(/srcset="([^\"]+)"/g))for(const item of srcset.split(','))assert(item.trim().startsWith('/assets/'),`Asset must be root-relative: ${item}`);
}
const fragments=await Promise.all(selected.map((e,i)=>renderEntry(e,selected[i+1],new Date(),context)));
const shell=await readFile(new URL('src/shell.html',root),'utf8');
const html=shell.replace('{{entries}}',()=>fragments.join('\n')).replace('{{firstId}}',selected[0]?.id ?? 'top').replace('{{sceneHead}}',sceneHead(selected,context));
const assets=await checkAssets(selected,html);checkAnchors(html);
const individualShell=await readFile(new URL('src/discovery-shell.html',root),'utf8');
for(const entry of selected) {
 const pageContext=createPageContext({mode:'discovery',publicOrigin:context.publicOrigin});
 const fragment=await renderEntry(entry,null,new Date(),pageContext);
 const page=individualShell.replace('{{entries}}',()=>fragment).replace('{{firstId}}',entry.id).replace('{{sceneHead}}',sceneHead([entry],pageContext));
 checkAnchors(page);await checkAssets([entry],page);
}
console.log(`Validated ${entries.length} content records, ${assets.length} owned assets, and collection/individual-page anchors.`);
