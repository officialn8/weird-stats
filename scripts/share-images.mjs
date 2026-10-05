import {Resvg} from '@resvg/resvg-js';
import sharp from 'sharp';
import {readFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import assert from 'node:assert/strict';
import {esc} from '../src/treatments/registry.mjs';
import {shareCopy} from './share-copy.mjs';
import {collectionCopy,validateCollectionCopy} from './collection-copy.mjs';
import {entryAssets} from './assets.mjs';
const font=fileURLToPath(new URL('../public/assets/outfit-bold.ttf',import.meta.url));
const options={font:{fontFiles:[font],loadSystemFonts:false,defaultFontFamily:'Outfit'}};
const type='font-family="Outfit" font-weight="700"';
const orange='#ff681f',ink='#29211b',paper='#fff8f0'; // paper matches public/styles.css --paper (light)
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
// Text column shared by every card: top edge, height, and the baseline factor for the first line.
const column={top:175,height:345};
const centered=(block,size)=>column.top+(column.height-block)/2+size*.72;
// Wraps text into the left column at the largest size that fits; throws rather than clipping.
// Defaults are the entry headline; breakWords:false never splits a word across lines.
export function shareLayout(text,{measure=650,height=column.height,sizes=[86,80,74,66,58,50,42,36,30],breakWords=true,label='Share question'}={}) {
 fit: for(const size of sizes) {
  const lines=[]; let line='';
  for(const word of text.split(/\s+/)) {
   if(line&&width(line+' '+word,size)>measure){lines.push(line);line='';}
   if(!breakWords&&width(word,size)>measure)continue fit;
   // A word that may not break already fits: it passed the wrap check, or the width check above on an empty line.
   if(breakWords)for(const letter of word) {
    if(width(line+letter,size)>measure){lines.push(line);line='';}
    line+=letter;
   }
   else line+=word;
   line+=' ';
  }
  if(line.trim())lines.push(line.trim());
  if(lines.length*(size+4)<=height)return {size,lines:lines.map(s=>s.trim())};
 }
 throw new Error(label+' does not fit the image');
}
// Shared card anatomy: 1200×630 orange field, art, then wordmark, headline and footer in ink.
function card(art,body,footer) {
 return '<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630"><rect width="1200" height="630" fill="'+orange+'"/>'+art+'<g fill="'+ink+'" '+type+'><text x="58" y="77" font-size="39" letter-spacing="-1.8">weird.stats</text>'+body+'<text x="58" y="576" font-size="24">'+esc(footer)+'</text><text x="654" y="580" font-size="42" text-anchor="end">↗</text></g></svg>';
}
function headline({size,lines},start) {
 return lines.map((line,i)=>'<text x="58" y="'+(start+i*(size+4))+'" font-size="'+size+'" letter-spacing="-1.5">'+esc(line)+'</text>').join('');
}
export async function shareSVG(entry) {
 const {question}=shareCopy(entry),layout=shareLayout(question),{size,lines}=layout;
 const objects=await Promise.all(shareArtwork(entry).map(async([path,x,y,w,h,angle])=>{
  const bytes=await readFile(new URL('../public/'+path,import.meta.url));
  const png=await sharp(bytes).resize({width:640,height:640,fit:'inside',withoutEnlargement:true}).png().toBuffer();
  return '<image href="data:image/png;base64,'+png.toString('base64')+'" x="'+x+'" y="'+y+'" width="'+w+'" height="'+h+'" preserveAspectRatio="xMidYMid meet" transform="rotate('+angle+' '+(x+w/2)+' '+(y+h/2)+')"/>';
 }));
 const runway=entry.treatment.kind==='bearing-shift' ? '<g transform="rotate(14 960 340)"><rect x="801" y="95" width="304" height="480" rx="4" fill="#202922"/><path d="M820 110V560M1086 110V560" stroke="#e5e5cf" stroke-width="3"/><path d="M840 130V185M863 130V185M886 130V185M1020 130V185M1043 130V185M1066 130V185" stroke="#e5e5cf" stroke-width="10"/><text x="953" y="345" text-anchor="middle" '+type+' font-size="160" fill="#fff8ee">'+esc(Math.round(entry.treatment.from/10)||36)+'</text><path d="M953 385V555" stroke="#e5e5cf" stroke-width="6" stroke-dasharray="30 20"/></g>' : '';
 const image=objects.join('')||runway||'<text x="945" y="475" text-anchor="middle" '+type+' font-size="400" fill="'+ink+'">?</text>';
 return card(image,headline(layout,centered(lines.length*(size+4),size)),'Open the question.');
}
export async function renderShareImage(entry) {
 return new Resvg(await shareSVG(entry),options).render().asPng();
}
// Collection (home) card: a brand card, not any discovery. Vector only: no <image>, no entry artwork.
function collectionArt() {
 const w=250,h=340,r=22,gap=9,cx=945,cy=300,x=cx-w/2,y=cy-h/2,origin=cx+' 640';
 return [-15,-3,9].map((angle,i)=>'<g transform="rotate('+angle+' '+origin+')">'
  +(i?'<rect x="'+(x-gap)+'" y="'+(y-gap)+'" width="'+(w+2*gap)+'" height="'+(h+2*gap)+'" rx="'+(r+gap)+'" fill="'+orange+'"/>':'')
  +'<rect x="'+x+'" y="'+y+'" width="'+w+'" height="'+h+'" rx="'+r+'" fill="'+ink+'"/>'
  +(i===2?'<text x="'+cx+'" y="'+(cy+92)+'" text-anchor="middle" '+type+' font-size="250" fill="'+paper+'">?</text>':'')+'</g>').join('');
}
function collectionLayout(copy=collectionCopy) {
 validateCollectionCopy(copy);
 // 62 reserves the largest sub-line size (34) plus its gap (28) under the headline.
 const head=shareLayout(copy.headline,{measure:600,height:column.height-62,sizes:[86,80,74,66,58],breakWords:false,label:'Collection headline'});
 const sub=shareLayout(copy.subline,{measure:600,height:38,sizes:[34,32,30,28],breakWords:false,label:'Collection sub-line'});
 // Only a fit check: the footer is drawn at the card's fixed position, but must not run into the arrow.
 shareLayout(copy.footer,{measure:520,height:28,sizes:[24],breakWords:false,label:'Collection footer'});
 const gap=sub.size+28,block=head.size*.72+(head.lines.length-1)*(head.size+4)+gap;
 const headlineY=centered(block,head.size);
 return {head,sub,headlineY,sublineY:headlineY+(head.lines.length-1)*(head.size+4)+gap};
}
export function collectionShareSVG(copy=collectionCopy) {
 const {head,sub,headlineY,sublineY}=collectionLayout(copy);
 return card(collectionArt(),headline(head,headlineY)+'<text x="58" y="'+sublineY+'" font-size="'+sub.size+'" letter-spacing="-.5">'+esc(copy.subline)+'</text>',copy.footer);
}
export function renderCollectionShareImage(copy=collectionCopy) {
 return new Resvg(collectionShareSVG(copy),options).render().asPng();
}
