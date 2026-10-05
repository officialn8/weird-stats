import {loadEntries,reviewState} from './content.mjs';
import {createDesk} from './candidates.mjs';
const [entries,desk]=await Promise.all([loadEntries(),createDesk().report()]);
if(process.argv.includes('--json')) console.log(JSON.stringify({entries,desk},null,2));
else {
 for(const e of entries)console.log(`${e.status.padEnd(10)} ${e.id.padEnd(24)} ${reviewState(e)} ${e.evidence?.checkedAt??'not yet'} | ${e.title}`);
 console.log(`\nEditorial desk: ${desk.queue.count}/${desk.queue.limit} unfinished packets; ${desk.candidates.length} saved candidates.`);
 for(const candidate of desk.candidates)console.log(`${(candidate.disposition??'open').padEnd(10)} ${candidate.id} | ${candidate.evidenceGaps.length} evidence gaps; ${candidate.treatmentGaps.length} treatment gaps; ${candidate.duplicates.length} duplicate links | revision ${candidate.revision}`);
 for(const run of desk.runs)console.log(`${run.id} | ${run.status} | ${run.investigations.length}/${desk.limits.investigationsPerRun} investigated; ${run.promotions.length}/${desk.limits.promotionsPerRun} promoted/reserved | ${run.summary?.note??'No completion report yet'}`);
 console.log(`Editorial gate: ${desk.editorialGate.recordedCompletedRuns}/${desk.editorialGate.requiredCompletedRuns} recorded completed runs; actual workload assessment is still required.`);
}
