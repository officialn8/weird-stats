import assert from 'node:assert/strict';
// Shared presentation copy is part of the editorial digest, including these defaults.
// Changes require revision review; this helper never records approval.
const customQuestions=Object.freeze({
  crunch:'Could your ears make a chip seem fresher?',
  copper:'Which one has more copper?',
  mail:'How does the mail reach the bottom of a canyon?',
  painting:'How close can you get to a painting?'
});
export function shareCopy(entry) {
  const question=entry.share?.question ?? (entry.treatment.kind==='custom' ? customQuestions[entry.treatment.template] : entry.question);
  const description=entry.share?.description ?? 'A small question. A surprising discovery. Take a look at weird.stats.';
  assert(typeof question==='string'&&question.trim()&&question.length<=220,`${entry.id}: share question must contain 1–220 characters`);
  assert(typeof description==='string'&&description.trim()&&description.length<=300,`${entry.id}: share description must contain 1–300 characters`);
  return {question,description};
}
export function validatePublicOrigin(value=process.env.PUBLIC_SITE_ORIGIN ?? 'https://weird-stats.vercel.app') {
  let url;
  try {url=new URL(value);} catch {throw new Error('Invalid public origin');}
  assert(url.protocol==='https:'&&!url.username&&!url.password&&url.pathname==='/'&&!url.search&&!url.hash,'Invalid public origin: use an HTTPS origin without credentials, path, query or hash');
  return url.origin;
}
