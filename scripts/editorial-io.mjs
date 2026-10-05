import {randomUUID} from 'node:crypto';
import {mkdir,readFile,writeFile,rename,rm,link} from 'node:fs/promises';
import {resolve} from 'node:path';

export async function readJSON(path) {
  try { return JSON.parse(await readFile(path,'utf8')); }
  catch (error) { if(error.code==='ENOENT') return null; throw error; }
}

export async function atomicWrite(path,serialize) {
  await mkdir(resolve(path,'..'),{recursive:true});
  const temp=path+'.'+randomUUID()+'.tmp';
  try {
    // Serialize here so failures retain the writers' cleanup and error ordering.
    await writeFile(temp,serialize(),{flag:'wx'});
    await rename(temp,path);
  } finally { await rm(temp,{force:true}); }
}

// Install complete bytes without replacing a path created by another writer.
// A failed/interrupted temporary write leaves no partial final JSON.
export async function atomicCreate(path,serialize,{write=writeFile,install=link}={}) {
  await mkdir(resolve(path,'..'),{recursive:true});
  const temp=path+'.'+randomUUID()+'.tmp';
  try {
    await write(temp,serialize(),{flag:'wx'});
    await install(temp,path);
  } finally { await rm(temp,{force:true}); }
}
