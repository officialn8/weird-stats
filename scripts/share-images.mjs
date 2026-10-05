import {Resvg} from '@resvg/resvg-js';
import sharp from 'sharp';
import {readFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import assert from 'node:assert/strict';
import {esc} from '../src/treatments/registry.mjs';
import {shareCopy} from './share-copy.mjs';
import {entryAssets} from './assets.mjs';
const font=fileURLToPath(new URL('../public/assets/outfit-bold.ttf',import.meta.url));
const options={font:{fontFiles:[font],loadSystemFonts:false,defaultFontFamily:'Outfit'}};
const type='font-family="Outfit" font-weight="700"';
// Fixed scene artwork only, never an arbitrary URL or unreleased entry's asset.
const artwork={
 crunch:[['assets/chip.webp',710,135,500,460,-12]],
 copper:[['assets/penny.webp',780,112,285,285,-16],['assets/nickel.webp',885,327,285,285,12]],
 mail:[['assets/mule.webp',684,158,510,400,0]],
 painting:[['assets/nightwatch.webp',745,145,420,390,5]]
};
export function shareArtwork(entry) {
 const items=entry.treatment.kind==='custom' ? artwork[entry.treatment.template]??[] : [];
 const owned=new Set(entryAssets(entry));
 for(const [path] of items)assert(owned.has(path),entry.id+': share artwork must belong to the selected entry');
 return items;
}
function width(text,size) {
 const svg='<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="200"><text x="0" y="100" '+type+' font-size="'+size+'">'+esc(text)+'</text></svg>';
 return new Resvg(svg,options).innerBBox()?.width??0;
}
export function shareLayout(question) {
 for(const size of [86,80,74,66,58,50,42,36,30]) {
  const lines=[]; let line='';
  for(const word of question.split(/\s+/)) {
   if(line&&width(line+' '+word,size)>650){lines.push(line);line='';}
   for(const letter of word) {
    if(width(line+letter,size)>650){lines.push(line);line='';}
    line+=letter;
   }
   line+=' ';
  }
  if(line.trim())lines.push(line.trim());
  if(lines.length*(size+4)<=345)return {size,lines:lines.map(s=>s.trim())};
 }
 throw new Error('Share question does not fit the image');
}
export async function shareSVG(entry) {
 const {question}=shareCopy(entry),{size,lines}=shareLayout(question);
 const objects=await Promise.all(shareArtwork(entry).map(async([path,x,y,w,h,angle])=>{
  const bytes=await readFile(new URL('../public/'+path,import.meta.url));
  const png=await sharp(bytes).resize({width:640,height:640,fit:'inside',withoutEnlargement:true}).png().toBuffer();
  return '<image href="data:image/png;base64,'+png.toString('base64')+'" x="'+x+'" y="'+y+'" width="'+w+'" height="'+h+'" preserveAspectRatio="xMidYMid meet" transform="rotate('+angle+' '+(x+w/2)+' '+(y+h/2)+')"/>';
 }));
 const runway=entry.treatment.kind==='bearing-shift' ? '<g transform="rotate(14 960 340)"><rect x="801" y="95" width="304" height="480" rx="4" fill="#202922"/><path d="M820 110V560M1086 110V560" stroke="#e5e5cf" stroke-width="3"/><path d="M840 130V185M863 130V185M886 130V185M1020 130V185M1043 130V185M1066 130V185" stroke="#e5e5cf" stroke-width="10"/><text x="953" y="345" text-anchor="middle" '+type+' font-size="160" fill="#fff8ee">'+esc(Math.round(entry.treatment.from/10)||36)+'</text><path d="M953 385V555" stroke="#e5e5cf" stroke-width="6" stroke-dasharray="30 20"/></g>' : '';
 const image=objects.join('')||runway||'<text x="945" y="475" text-anchor="middle" '+type+' font-size="400" fill="#29211b">?</text>';
 const start=175+(345-lines.length*(size+4))/2+size*.72;
 return '<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630"><rect width="1200" height="630" fill="#ff681f"/>'+image+'<g fill="#29211b" '+type+'><text x="58" y="77" font-size="39" letter-spacing="-1.8">weird.stats</text>'+lines.map((line,i)=>'<text x="58" y="'+(start+i*(size+4))+'" font-size="'+size+'" letter-spacing="-1.5">'+esc(line)+'</text>').join('')+'<text x="58" y="576" font-size="24">Open the question.</text><text x="654" y="580" font-size="42" text-anchor="end">↗</text></g></svg>';
}
export async function renderShareImage(entry) {
 return new Resvg(await shareSVG(entry),options).render().asPng();
}
