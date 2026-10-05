import {loadEntries,reviewState} from './content.mjs';
for(const e of await loadEntries()) console.log(`${e.status.padEnd(10)} ${e.id.padEnd(24)} ${reviewState(e)} ${e.evidence?.checkedAt ?? 'not yet'} | ${e.title}`);
