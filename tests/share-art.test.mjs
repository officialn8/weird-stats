import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {shareSVG,shareLayout,renderShareImage,shareArtwork,collectionShareSVG,renderCollectionShareImage,shareImagePath} from '../scripts/share-images.mjs';
import {collectionCopy,collectionImagePath,approvedCollectionImageSha256,approvedCollectionCopySha256,serializeCollectionCopy,collectionCopySha256,approvedCollectionPreview} from '../scripts/collection-copy.mjs';
import {shareCopy} from '../scripts/share-copy.mjs';
import {loadEntries,esc} from '../scripts/content.mjs';
import {publishedFixture,reviewFixture} from './fixtures/entries.mjs';
import {reviewIndex} from '../scripts/review-packets.mjs';
const entry=(template)=>({...publishedFixture(),id:template,treatment:{kind:'custom',template},share:{question:'Which everyday thing would you choose?'}});
// SFNT table directory: tag -> byte offset.
function sfntTables(font){const tables=new Map();for(let i=0;i<font.readUInt16BE(4);i++){const o=12+i*16;tables.set(font.toString('ascii',o,o+4),font.readUInt32BE(o+8));}return tables;}
test('share renderer bundles an actual static bold face and does not fake weight with strokes',async()=>{
 const font=await readFile(new URL('../public/assets/outfit-bold.ttf',import.meta.url));
 const tables=sfntTables(font);
 assert(!tables.has('fvar'));assert.equal(font.readUInt16BE(tables.get('OS/2')+4),700);
 const svg=await shareSVG(entry('crunch'));assert(!svg.includes('stroke='));assert(svg.includes('font-weight="700"'));
});
test('each custom share image uses only its owned recognizable objects and no answer copy',async()=>{
 const expected={crunch:['assets/chip.webp'],copper:['assets/penny.webp','assets/nickel.webp'],mail:['assets/mule.webp'],painting:['assets/nightwatch.webp']};
 const images=[];
 for(const [kind,paths] of Object.entries(expected)){
  const item=entry(kind);item.answer='DO NOT SHARE THIS ANSWER';
  assert.deepEqual(shareArtwork(item).map(a=>a[0]),paths);
  const svg=await shareSVG(item);assert.equal((svg.match(/<image /g)||[]).length,paths.length);
  assert(svg.includes('data:image/png;base64,'));assert(!svg.includes(item.answer));assert(!svg.includes('<circle'));
  images.push(await renderShareImage(item));
 }
 assert.equal(new Set(images.map(b=>b.toString('base64'))).size,4);
 const generic=await shareSVG(publishedFixture());assert(!generic.includes('<image '),'no unrelated scene imagery on generic records');
});
test('long or unbroken share questions fit a bounded headline area',()=>{
 for(const question of ['W'.repeat(220),'A question with several words '.repeat(7).trim()]){
  const {size,lines}=shareLayout(question);
  assert(lines.length*(size+4)<=345);assert.equal(lines.join('').replace(/\s/g,''),question.replace(/\s/g,''));
 }
});
test('private review leads with exact preview and share art, with raw diffs collapsed',()=>{
 const e=publishedFixture();e.status='review';
 const html=reviewIndex({packets:[{id:e.id,packetId:'packet',digest:'digest',state:'pending',entry:e,baselineDigest:null,readiness:[],changes:{claim:[{field:'answer',before:null,after:'<unsafe>'}],data:[],sources:[]}}],unpacketized:[]});
 assert(html.includes('/review/'+e.id+'/packet/share.png'));
 assert(html.includes('Preview exact revision'));assert(html.includes('keep, revise, or reject'));
 assert(html.indexOf('Preview exact revision')<html.indexOf('<pre>'));
 assert(html.includes('<details class="technical">'));assert(!html.includes('<unsafe>'));
});
// Code points with a glyph in the bundled face (cmap format 4), so copy edits cannot render blank boxes.
async function outfitCodePoints() {
 const font=await readFile(new URL('../public/assets/outfit-bold.ttf',import.meta.url)),points=new Set();
 const tables=sfntTables(font);
 const cmap=tables.get('cmap');
 for(let i=0;i<font.readUInt16BE(cmap+2);i++){
  const t=cmap+font.readUInt32BE(cmap+8+i*8);if(font.readUInt16BE(t)!==4)continue;
  const segs=font.readUInt16BE(t+6)/2,ends=t+14,starts=ends+segs*2+2,deltas=starts+segs*2,ranges=deltas+segs*2;
  for(let s=0;s<segs;s++)for(let c=font.readUInt16BE(starts+s*2);c<=font.readUInt16BE(ends+s*2)&&c<0xffff;c++){
   const r=font.readUInt16BE(ranges+s*2),g=r?font.readUInt16BE(ranges+s*2+r+(c-font.readUInt16BE(starts+s*2))*2):c;
   if(g&&((g+font.readInt16BE(deltas+s*2))&0xffff))points.add(c);
  }
 }
 return points;
}
const textOf=svg=>[...svg.matchAll(/<text[^>]*>([^<]*)<\/text>/g)].map(m=>m[1].replace(/&#39;/g,"'").replace(/&quot;/g,'"').replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&amp;/g,'&'));
test('collection share card is vector-only Outfit Bold with every glyph present and no stroked text',async()=>{
 const svg=collectionShareSVG();
 assert.deepEqual([...new Set(svg.match(/font-family="[^"]*"/g))],['font-family="Outfit"']);
 assert.deepEqual([...new Set(svg.match(/font-weight="[^"]*"/g))],['font-weight="700"']);
 assert(!svg.includes('stroke='));assert(!svg.includes('<image'));assert(!svg.includes('href'));
 const text=textOf(svg);
 assert(text.includes('weird.stats'));assert(text.includes(collectionCopy.subline));assert(text.includes(collectionCopy.footer));assert(text.includes('↗'));
 assert(text.join(' ').includes(collectionCopy.headline),'headline renders in full, only wrapped at spaces');
 const glyphs=await outfitCodePoints();
 for(const ch of new Set(text.join('')))if(ch!==' ')assert(glyphs.has(ch.codePointAt(0)),'Outfit Bold has no glyph for '+JSON.stringify(ch));
});
test('collection share card and copy feature no discovery question or answer',async()=>{
 const scoped=publishedFixture();scoped.answer='DO NOT SHARE THIS ANSWER';
 const entries=[scoped,reviewFixture(),...await loadEntries()];
 assert(entries.filter(e=>e.status==='published').length>=6);
 const svg=collectionShareSVG(),surfaces=[svg,textOf(svg).join(' '),collectionCopy.title,collectionCopy.description,collectionCopy.alt];
 assert(svg.includes('font-size="400"')===false,'no single-question placeholder art');
 for(const entry of entries)for(const text of new Set([entry.question,shareCopy(entry).question,entry.answer].filter(Boolean)))
  for(const surface of surfaces)assert(!surface.includes(text)&&!surface.includes(esc(text)),entry.id+' leaks into the collection preview: '+text);
 assert.throws(()=>collectionShareSVG(scoped),/collection copy/,'an entry is never accepted as collection copy');
});
test('collection share PNG is 1200×630, deterministic, and distinct from entry cards',async()=>{
 const png=renderCollectionShareImage(),again=renderCollectionShareImage();
 assert.equal(png.toString('hex',0,8),'89504e470d0a1a0a');assert.equal(png.readUInt32BE(16),1200);assert.equal(png.readUInt32BE(20),630);
 assert(png.equals(again),'rendering twice yields identical bytes');
 assert(!png.equals(await renderShareImage(publishedFixture())));
 assert.equal(collectionImagePath(),'social/home-v'+collectionCopy.version+'.png');assert(!collectionImagePath().startsWith('share/'));
});
// CI renders on Linux like the deploy builder, so platform drift in the approved card fails here before release.
test('the collection card renders byte-for-byte as the approved version-1 PNG',()=>{
 assert.equal(collectionCopy.version,1,'a new version needs its own approval record and approved hash');
 assert.match(approvedCollectionImageSha256,/^[0-9a-f]{64}$/);
 assert.equal(createHash('sha256').update(renderCollectionShareImage()).digest('hex'),approvedCollectionImageSha256);
});
// og:title, og:description and alt never reach the PNG, so the image hash alone cannot hold them to the approval.
test('the approved collection copy is pinned by a canonical hash that covers every field',()=>{
 assert.match(approvedCollectionCopySha256,/^[0-9a-f]{64}$/);
 assert.equal(collectionCopySha256(),approvedCollectionCopySha256);
 assert.equal(serializeCollectionCopy(Object.fromEntries(Object.entries(collectionCopy).reverse())),serializeCollectionCopy(),'key order does not change the canonical form');
 for(const field of Object.keys(collectionCopy)){
  const edited={...collectionCopy,[field]:field==='version'?2:collectionCopy[field]+' Again.'};
  assert.notEqual(collectionCopySha256(edited),approvedCollectionCopySha256,field+' is pinned');
 }
 assert.throws(()=>serializeCollectionCopy({...collectionCopy,kicker:'Something new.'}),/unpinned field kicker/,'a new field cannot ship outside the pin');
});
test('the home preview is released only when its copy and rendered PNG both match the approval pins',()=>{
 const approval=/home preview needs a new version and a new approval record/;
 const {path,png}=approvedCollectionPreview(collectionCopy,renderCollectionShareImage);
 assert.equal(path,collectionImagePath());assert.equal(createHash('sha256').update(png).digest('hex'),approvedCollectionImageSha256);
 let rendered=false;
 for(const field of ['title','description','alt'])assert.throws(()=>approvedCollectionPreview({...collectionCopy,[field]:collectionCopy[field]+' Updated.'},()=>{rendered=true;}),approval,field+' edits need approval');
 assert(!rendered,'copy is refused before any card is rendered');
 assert.throws(()=>approvedCollectionPreview(collectionCopy,()=>Buffer.from('a redrawn card')),approval,'a card that renders differently needs approval');
});
test('the approval record names exactly the pinned strings and image hash',async()=>{
 const record=await readFile(new URL('../docs/editorial/2026-10-05-home-preview-approval.md',import.meta.url),'utf8');
 const rows=new Map([...record.matchAll(/^\| (.+?) \| (.+?) \|$/gm)].map(m=>[m[1],m[2]]));
 const labels={title:'Link title (`og:title`)',description:'Description (`og:description`)',headline:'Image headline',subline:'Image sub-line',footer:'Image footer',alt:'Alt text (`og:image:alt`, `twitter:image:alt`)'};
 const approved={version:Number(record.match(/^# Home-page preview card, version (\d+)$/m)?.[1])};
 for(const [field,label] of Object.entries(labels)){
  assert(rows.has(label),'approval record row: '+label);approved[field]=rows.get(label);
  assert(record.includes(collectionCopy[field]),field+' appears verbatim in the approval record');
 }
 // The record shows the footer as drawn, followed by the card's fixed arrow glyph.
 assert(approved.footer.endsWith(' ↗'));approved.footer=approved.footer.slice(0,-2);
 assert.deepEqual(approved,{...collectionCopy});
 assert.equal(collectionCopySha256(approved),approvedCollectionCopySha256,'the copy pin is the hash of the recorded strings');
 assert(record.includes('**SHA-256:** `'+approvedCollectionImageSha256+'`'),'the image pin is the recorded SHA-256');
 assert(record.includes('**Path:** `'+collectionImagePath()+'`'));
});
// Discovery cards share card() and shareLayout() with the home card; a frame change re-renders every published
// discovery card, so the generic fixture card is pinned. It embeds no raster artwork, so only the renderer can move it.
test('a generic discovery share card renders byte-for-byte as its golden PNG',async()=>{
 assert(!(await shareSVG(publishedFixture())).includes('<image'));
 assert.equal(createHash('sha256').update(await renderShareImage(publishedFixture())).digest('hex'),'2756a190d1f0691d34d284d06658277e220005f7a1c0679c25fa86b23b029247');
});
test('collection copy that would overflow the card throws instead of clipping',()=>{
 assert.throws(()=>collectionShareSVG({...collectionCopy,headline:'Wonderfully unnecessary discoveries, '.repeat(3).trim()}),/Collection headline does not fit/);
 assert.throws(()=>collectionShareSVG({...collectionCopy,headline:'W'.repeat(60)}),/Collection headline does not fit/);
 assert.throws(()=>collectionShareSVG({...collectionCopy,subline:collectionCopy.subline+' Bring a friend along.'}),/Collection sub-line does not fit/);
 assert.throws(()=>collectionShareSVG({...collectionCopy,footer:'Open the whole wonderfully unnecessary collection.'}),/Collection footer does not fit/);
 assert.throws(()=>collectionShareSVG({...collectionCopy,headline:''}),/collection copy/);
 assert.throws(()=>collectionShareSVG({...collectionCopy,version:0}),/collection copy/);
});

test('transport preview carries the traffic scene and Deep Dive action without changing other cards',async()=>{
 const transport=entry('one-person-sixty-cars');
 transport.share.question='One person. An entire car.';
 const svg=await shareSVG(transport),text=textOf(svg).join(' ');
 assert(text.includes(transport.share.question),'the approved headline is complete');
 assert(text.includes('Read the Deep Dive'));assert(text.includes('Illustrative traffic'));
 assert(!text.includes('Open the question.'));assert(!text.includes('?'));
 assert.equal((svg.match(/data-share-car=/g)||[]).length,32);
 assert.equal((svg.match(/data-share-bus=/g)||[]).length,1);
 assert.equal((svg.match(/data-share-passenger=/g)||[]).length,60);
 const png=await renderShareImage(transport);
 assert.equal(png.readUInt32BE(16),1200);assert.equal(png.readUInt32BE(20),630);
 assert(png.equals(await renderShareImage(transport)));
 assert.equal(shareImagePath(transport),'share/one-person-sixty-cars-intersection-v1.png');
 assert.equal(shareImagePath(entry('crunch')),'share/crunch.png');
 const generic=await shareSVG({...transport,treatment:{kind:'reveal'}});
 assert(!generic.includes('data-share-car='),'only the matching custom treatment receives this art');
});
