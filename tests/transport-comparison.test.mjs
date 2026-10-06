import test from 'node:test';
import assert from 'node:assert/strict';
import {tripEnergyScenario,displayScenario} from '../public/assets/transport-comparison.js';

test('trip energy converts chemical and metabolic inputs to the same energy/distance unit',()=>{
 const r=tripEnergyScenario(30,1);
 assert(Math.abs(r.carWhPerMile-1123.3333333333333)<1e-10);
 assert(Math.abs(r.bikeWhPerMile-50.29252525252525)<1e-10);
 assert(Math.abs(r.bikeWhPerMile/1.609344-31.25032637678784)<1e-10);
 assert(Math.abs(r.ratio-22.33598984526889)<1e-10);
 assert.equal(tripEnergyScenario(30,4).carWhPerMile,r.carWhPerMile/4);
 assert.equal(tripEnergyScenario(60,1).carWhPerMile,r.carWhPerMile/2);
 assert.equal(tripEnergyScenario(60,4).bikeWhPerMile,r.bikeWhPerMile);
 assert.throws(()=>tripEnergyScenario(0),RangeError);
 assert.throws(()=>tripEnergyScenario(30,1.5),RangeError);
 assert.throws(()=>tripEnergyScenario(Infinity),RangeError);
});

test('unit display conversion preserves the physical drop, energy, and comparison ratio',()=>{
 for(const mass of [2000,4000,8000])for(const speed of [10,30,60]){
  const us=displayScenario(mass,speed),si=displayScenario(mass,speed,true);
  assert.equal(si.mass,mass*.45359237);
  assert.equal(si.speed,speed*1.609344);
  assert.equal(si.height,us.heightM);
  assert.equal(si.energy,us.energyJ/1000);
  assert.equal(si.dropSeconds,us.dropSeconds);
  assert.equal(si.relativeTo20,us.relativeTo20);
  assert.equal(si.heightFt,us.heightFt);
 }
 const r=tripEnergyScenario();
 assert(Math.abs((r.carWhPerMile/1.609344)/(r.bikeWhPerMile/1.609344)-r.ratio)<1e-12);
});
