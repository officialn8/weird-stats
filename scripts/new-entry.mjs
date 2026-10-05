import {writeFile} from 'node:fs/promises';
import {root} from './content.mjs';
import {treatmentKinds} from '../src/treatments/registry.mjs';
const [id,kind='reveal']=process.argv.slice(2);
if(!/^[a-z][a-z0-9-]*$/.test(id??'')||!treatmentKinds().filter(k=>k!=='custom').includes(kind)) throw new Error('Usage: npm run content:new -- unique-id reveal|bar|line');
const entry={id,title:'Untitled discovery',topic:'unassigned',status:'draft',order:100,question:'',answer:'',explanation:'',qualification:'',whyCare:'',evidence:{kind:'reported',scope:'',dataAsOf:'',checkedAt:'',reviewDue:'',sources:[]},treatment:{kind,...(kind==='reveal'?{}:{views:[]})}};
await writeFile(new URL(`content/entries/${id}.json`,root),JSON.stringify(entry,null,2)+'\n',{flag:'wx'});
console.log(`Created content/entries/${id}.json as a private draft. Complete the evidence and treatment before moving to review.`);
