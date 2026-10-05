import {Resvg} from '@resvg/resvg-js';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import {esc} from '../src/treatments/registry.mjs';
import {shareCopy} from './share-copy.mjs';
const font=fileURLToPath(new URL('../public/assets/outfit.ttf',import.meta.url));
// Only our own geometry and escaped text enter this SVG: no image/use/font URLs.
// Outfit is bundled under public/assets/OFL-Outfit.txt. No system or remote fonts.
export function shareSVG(entry) {
 const {question}=shareCopy(entry),words=question.split(/\s+/),lines=[];
 const size=question.length>165?44:question.length>120?53:question.length>75?64:76;
 const columns=size===76?25:size===64?30:size===53?36:44;
 const pieces=words.flatMap(word=>word.match(new RegExp(`.{1,${columns}}`,'gu'))??[]);
 let line='';for(const word of pieces){if(line&&line.length+word.length+1>columns){lines.push(line);line=word;}else line+=(line?' ':'')+word;}if(line)lines.push(line);
 const seed=createHash('sha256').update(entry.id).digest()[0];
 return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630"><rect width="1200" height="630" fill="#ff5b19"/><g fill="none" stroke="#30160c" stroke-width="2" opacity=".23"><circle cx="1070" cy="330" r="${150+seed%45}"/><circle cx="1070" cy="330" r="${230+seed%30}"/><path d="M890 60V570M840 330H1180"/></g><g fill="#26140d" font-family="Outfit"><text x="62" y="72" font-size="35" font-weight="600" stroke="#26140d" stroke-width="1" paint-order="stroke">weird.stats</text><text x="1138" y="70" text-anchor="end" font-size="18" letter-spacing="2">FOR THE CURIOUS</text>${lines.map((text,i)=>`<text x="62" y="${180+i*(size+8)}" font-size="${size}" font-weight="600" stroke="#26140d" stroke-width="2" stroke-linejoin="round" paint-order="stroke">${esc(text)}</text>`).join('')}<text x="62" y="570" font-size="23">Open the question. Find the discovery.</text><text x="1110" y="568" font-size="52">↗</text></g></svg>`;
}
export function renderShareImage(entry) {
 return new Resvg(shareSVG(entry),{font:{fontFiles:[font],loadSystemFonts:false,defaultFontFamily:'Outfit'}}).render().asPng();
}
