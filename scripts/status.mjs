import {loadEntries,reviewState} from './content.mjs';
import {createDesk} from './candidates.mjs';
import {createReviewDesk} from './review-packets.mjs';
const [entries,desk,review]=await Promise.all([loadEntries(),createDesk().report(),createReviewDesk().report()]);
if(process.argv.includes('--json')) console.log(JSON.stringify({entries,desk,review},null,2));
else {
 for(const e of entries)console.log(`${e.status.padEnd(10)} ${e.id.padEnd(24)} ${reviewState(e)} ${e.evidence?.checkedAt??'not yet'} | ${e.title}`);
 console.log(`\nRevision review: ${review.packets.filter(p=>p.state==='pending').length} pending proposals; ${review.unpacketized.length} drafts need an exact packet. Local index: /review.html`);
 for(const p of review.packets)console.log(`${p.state} ${p.id} | ${p.conflict?'BASELINE CONFLICT':'baseline unchanged'} | ${p.readiness.join('; ')||'Structurally ready'} | packet ${p.packetId} | content ${p.digest}`);
 console.log(`\nEditorial desk: ${desk.queue.count}/${desk.queue.limit} unfinished packets; ${desk.candidates.length} saved candidates.`);
 for(const candidate of desk.candidates)console.log(`${(candidate.disposition??'open').padEnd(10)} ${candidate.id} | ${candidate.evidenceGaps.length} evidence gaps; ${candidate.treatmentGaps.length} treatment gaps; ${candidate.duplicates.length} duplicate links | revision ${candidate.revision}`);
 for(const run of desk.runs)console.log(`${run.id} | ${run.status} | ${run.investigations.length}/${desk.limits.investigationsPerRun} investigated; ${run.promotions.length}/${desk.limits.promotionsPerRun} promoted/reserved | ${run.summary?.note??'No completion report yet'}`);
 console.log(`Editorial gate: ${desk.editorialGate.recordedCompletedRuns}/${desk.editorialGate.requiredCompletedRuns} recorded completed runs; actual workload assessment is still required.`);
}
