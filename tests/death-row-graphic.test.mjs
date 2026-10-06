import test from 'node:test';
import assert from 'node:assert/strict';
import {markerCount,markerField,highlightOrder} from '../public/assets/death-row-model.js';
import {ownedAssets,entryAssets} from '../scripts/assets.mjs';
import {publishedFixture} from './fixtures/entries.mjs';

test('illustrated populations preserve fractional percentages and reject invalid inputs',()=>{
  assert.equal(markerCount(3.7,1000),37);
  assert.equal(markerCount(2.5,200),5);
  assert.equal(markerCount(100,500),500);
  assert.equal(markerCount(0,500),0);
  for(const args of [[NaN,1000],[-1,1000],[101,1000],[4,0],[4,1.5],[4,Infinity]]) assert.throws(()=>markerCount(...args),RangeError);
});
test('changing the illustrated interval keeps one fixed population and nested highlighted subsets',()=>{
  const total=200,positions=markerField(total),rank=highlightOrder(total);
  assert.equal(positions.length,total);
  assert.equal(new Set(positions.map(p=>`${p.x},${p.z}`)).size,total);
  assert(positions.every(p=>Number.isFinite(p.x)&&Number.isFinite(p.z)));
  assert.deepEqual(markerField(total),positions,'no random reshuffle on switching measures');
  assert.deepEqual(highlightOrder(total),rank);
  assert.equal(new Set(rank).size,total);assert(rank.every(i=>i>=0&&i<total));
  const low=rank.slice(0,markerCount(2, total)),point=rank.slice(0,markerCount(5,total)),high=rank.slice(0,markerCount(8,total));
  assert(low.every(i=>point.includes(i)));assert(point.every(i=>high.includes(i)));
});
test('the custom 3D runtime and library belong only to the selected custom treatment',()=>{
  // Synthetic metadata exercises ownership without importing the editorial draft.
  const fixture={...publishedFixture(),id:'death-row-innocence',treatment:{kind:'custom',template:'death-row-innocence'}};
  const owned=entryAssets(fixture);
  for(const asset of ['assets/death-row.js','assets/death-row-model.js','assets/three/three.module.js','assets/three/LICENSE.txt']) {
    assert(owned.includes(asset));assert(!ownedAssets([publishedFixture()]).includes(asset));
  }
});
