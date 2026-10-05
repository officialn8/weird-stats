import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
// Preview copy for the collection (home page) link card. Approval: docs/editorial/2026-10-05-home-preview-approval.md.
// Kept apart from share-copy.mjs, whose defaults feed approved entry digests. It names no
// discovery: the home preview is a brand card, not the newest discovery's question.
// Changing any string here or the art means a new version (new filename) and a new approval
// record with the exact strings and the SHA-256 of the approved PNG. The hashes below mirror that record; they are not approval.
export const collectionCopy=Object.freeze({
  version:1,
  title:'weird.stats: wonderfully unnecessary discoveries',
  description:'Unexpected discoveries, interactive comparisons, and sourced numbers about the world. A collection for the incurably curious.',
  headline:'Wonderfully unnecessary discoveries.',
  subline:'A collection for the incurably curious.',
  footer:'Open the collection.',
  alt:'weird.stats: Wonderfully unnecessary discoveries. A collection for the incurably curious.'
});
// SHA-256 of the approved full-size PNG for the current version; the build and a test pin the rendered card to it.
export const approvedCollectionImageSha256='127c519365b41381d2a883c108d5008c6c5c19f818657d9f77ef1df7dd5085f8';
// SHA-256 of serializeCollectionCopy() for the approved strings. og:title, og:description and alt never reach the PNG,
// so the image hash cannot hold them; the build refuses copy that differs from this pin.
export const approvedCollectionCopySha256='3c09cc56d60131f1ef3cd9d9c802b145b9d428ec5885db47d2687ffd9a962a67';
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
// Canonical form for the copy pin: every field in a fixed order, and no field the pin would not cover.
export function serializeCollectionCopy(copy=collectionCopy) {
  const fields=['version',...Object.keys(limits)],unpinned=Object.keys(validateCollectionCopy(copy)).filter(key=>!fields.includes(key));
  assert(!unpinned.length,`Invalid collection copy: unpinned field ${unpinned.join(', ')}`);
  return JSON.stringify(copy,fields);
}
const sha256=bytes=>createHash('sha256').update(bytes).digest('hex');
export function collectionCopySha256(copy=collectionCopy) {
  return sha256(serializeCollectionCopy(copy));
}
// The home preview's release pin, as verifyWorkingRevision is for entries: the copy is checked before rendering, then the
// rendered card, so the build fails before replacing any output. Returns the card only when both match the approval.
export function approvedCollectionPreview(copy=collectionCopy,render) {
  const action='a changed home preview needs a new version and a new approval record naming its exact strings and PNG SHA-256 (see docs/editorial/2026-10-05-home-preview-approval.md)';
  if(collectionCopySha256(copy)!==approvedCollectionCopySha256)throw new Error(`Home preview copy differs from the approved copy: ${action}`);
  const png=render(copy),actual=sha256(png);
  if(actual!==approvedCollectionImageSha256)throw new Error(`Home preview image (SHA-256 ${actual}) differs from the approved PNG: ${action}`);
  return {path:collectionImagePath(copy),png};
}
