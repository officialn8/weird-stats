import assert from 'node:assert/strict';
// Preview copy for the collection (home page) link card. Version 1 was approved by Nate on
// 2026-10-05 (see docs/editorial/2026-10-05-home-preview-approval.md).
// Kept apart from share-copy.mjs, whose defaults feed approved entry digests. It names no
// discovery: the home preview is a brand card, not the newest discovery's question.
// Changing any string here or the art means a new version (new filename) and a new approval
// record with the exact strings and the SHA-256 of the approved PNG; this module never records approval.
export const collectionCopy=Object.freeze({
  version:1,
  title:'weird.stats: wonderfully unnecessary discoveries',
  description:'Unexpected discoveries, interactive comparisons, and sourced numbers about the world. A collection for the incurably curious.',
  headline:'Wonderfully unnecessary discoveries.',
  subline:'A collection for the incurably curious.',
  footer:'Open the collection.',
  alt:'weird.stats: Wonderfully unnecessary discoveries. A collection for the incurably curious.'
});
// SHA-256 of the full-size version-1 PNG Nate approved, as recorded in the approval record above.
export const approvedCollectionImageSha256='127c519365b41381d2a883c108d5008c6c5c19f818657d9f77ef1df7dd5085f8';
const limits={title:120,description:300,headline:120,subline:120,footer:60,alt:420};
export function validateCollectionCopy(copy=collectionCopy) {
  assert(copy&&typeof copy==='object','Invalid collection copy');
  assert(Number.isSafeInteger(copy.version)&&copy.version>0,'Invalid collection copy: version must be a positive integer');
  for(const [field,max] of Object.entries(limits)) {
    const value=copy[field];
    assert(typeof value==='string'&&value.trim()===value&&value&&value.length<=max&&!/[\n\r\t]/.test(value),`Invalid collection copy: ${field} must contain 1–${max} characters on one line`);
  }
  return copy;
}
// The version lives with the copy: a revised card is published under a new name, never over an approved one.
export function collectionImagePath(copy=collectionCopy) {
  return `social/home-v${validateCollectionCopy(copy).version}.png`;
}
