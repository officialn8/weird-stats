import { cp, mkdir, rm } from 'node:fs/promises';
// Only the public site goes into a deployment. Research stays in the repository.
const output = new URL('../dist/', import.meta.url);
await rm(output, { recursive: true, force: true });
await mkdir(output, { recursive: true });
await cp(new URL('../public/', import.meta.url), output, { recursive: true });
console.log('Built public/ → dist/');
