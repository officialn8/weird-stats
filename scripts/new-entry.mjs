import {createDesk} from './candidates.mjs';
import {treatmentKinds} from '../src/treatments/registry.mjs';
const [id,kind='reveal']=process.argv.slice(2);
const kinds=treatmentKinds().filter(k=>k!=='custom');
if(!/^[a-z][a-z0-9-]*$/.test(id??'')||!kinds.includes(kind)) throw new Error(`Usage: npm run content:new -- unique-id ${kinds.join('|')}`);
const entry={id,title:'Untitled discovery',topic:'unassigned',status:'draft',order:100,question:'',answer:'',explanation:'',qualification:'',whyCare:'',evidence:{kind:'reported',scope:'',dataAsOf:'',checkedAt:'',reviewDue:'',sources:[]},treatment:{kind,...(kind==='reveal'?{}:{views:[]})}};
const result=await createDesk().createDraft(entry);
console.log(JSON.stringify(result,null,2));
if(result.outcome!=='created')process.exitCode=1;
