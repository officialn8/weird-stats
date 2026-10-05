import { readdir, stat } from 'node:fs/promises';
import { spawn } from 'node:child_process';
import { build } from './build.mjs';
const drafts=process.argv.includes('--drafts');
await build({drafts});
const port=process.env.PORT || (drafts?'63214':'63014');
const server=spawn('python3',['-m','http.server',port,'--bind','127.0.0.1','--directory',drafts?'review-dist':'dist'],{stdio:'inherit'});
// Poll this small source tree to avoid platform-specific recursive watcher limits.
async function fingerprint(){
 const files=(await Promise.all(['content','src','public'].map(async dir=>(await readdir(dir,{recursive:true,withFileTypes:true})).filter(e=>e.isFile()).map(e=>`${e.parentPath}/${e.name}`)))).flat().sort();
 return (await Promise.all(files.map(async f=>`${f}:${(await stat(f)).mtimeMs}`))).join('|');
}
let previous=await fingerprint(),busy=false;
const timer=setInterval(async()=>{
 if(busy)return;busy=true;
 try {const current=await fingerprint();if(current!==previous){await build({drafts});previous=current;console.log('Rebuilt. Refresh your browser.');}}
 catch(e){console.error(e.message);}
 finally{busy=false;}
},1500);
function close(code=0){clearInterval(timer);server.kill();process.exit(typeof code==='number'?code:0);}
process.on('SIGINT',close);process.on('SIGTERM',close);server.on('exit',close);server.on('error',error=>{console.error(error.message);close();});
console.log(`http://localhost:${port}${drafts?' — editorial preview':''}`);
