import {readdir} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {spawnSync} from 'node:child_process';

const root=new URL('../',import.meta.url);
async function checkDirectory(directory) {
  for(const entry of await readdir(directory,{withFileTypes:true})) {
    const path=new URL(entry.name+(entry.isDirectory()?'/':''),directory);
    if(entry.isDirectory()) await checkDirectory(path);
    else if(/\.(m?js)$/.test(entry.name)) {
      const result=spawnSync(process.execPath,['--check',fileURLToPath(path)],{stdio:'inherit'});
      if(result.error) throw result.error;
      if(result.status!==0) process.exit(result.status??1);
    }
  }
}
for(const directory of ['scripts/','src/','public/']) await checkDirectory(new URL(directory,root));
