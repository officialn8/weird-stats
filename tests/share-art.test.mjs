import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {shareSVG,shareLayout,renderShareImage,shareArtwork} from '../scripts/share-images.mjs';
import {publishedFixture} from './fixtures/entries.mjs';
import {reviewIndex} from '../scripts/review-packets.mjs';
const entry=(template)=>({...publishedFixture(),id:template,treatment:{kind:'custom',template},share:{question:'Which everyday thing would you choose?'}});
test('share renderer bundles an actual static bold face and does not fake weight with strokes',async()=>{
 const font=await readFile(new URL('../public/assets/outfit-bold.ttf',import.meta.url));
 const tables=new Map();for(let i=0;i<font.readUInt16BE(4);i++){const o=12+i*16;tables.set(font.toString('ascii',o,o+4),font.readUInt32BE(o+8));}
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
