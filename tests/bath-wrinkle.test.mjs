import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {runInNewContext} from 'node:vm';
import {analyticsHead} from '../scripts/analytics.mjs';
import {createVisit} from '../public/analytics.js';

const runtime = await readFile(new URL('../public/assets/bath-wrinkle.js', import.meta.url), 'utf8');

// Fictional DOM and controlled browser scheduling execute the shipping module.
function fixture({systemReduced = false, analytics, drawingSupported = true} = {}) {
  class Element extends EventTarget {
    constructor() { super(); this.nodes = {}; this.dataset = {}; this.hidden = true; this.focusCount = 0; this.captured = new Set(); }
    querySelector(selector) { return this.nodes[selector]; }
    focus() { this.focusCount++; }
    scrollIntoView() {}
    getBoundingClientRect() { return {left: 0, top: 0, width: 300, height: 300}; }
    setPointerCapture(id) { this.captured.add(id); }
    hasPointerCapture(id) { return this.captured.has(id); }
    releasePointerCapture(id) { this.captured.delete(id); }
  }
  const story = new Element(), figure = new Element(), reveal = new Element(), receipts = new Element();
  story.id = 'bath-wrinkle-pattern'; story.nodes['.bw-reveal'] = reveal; reveal.open = false;
  figure.dataset.phase = 'look';
  for (const name of ['.bath-drawing', '.bath-water', '.bath-scene', '.ux-note', '.bath-label', '.ux-start button', '.ux-compare button', '.ux-plain', '.ux-skip', '.ux-actions']) figure.nodes[name] = new Element();
  const canvas = figure.nodes['.bath-drawing']; canvas.width = canvas.height = 600;
  const drawing = {strokes: 0, clears: 0, beginPath() {}, moveTo() {}, lineTo() {}, stroke() { this.strokes++; }, clearRect() { this.clears++; }};
  canvas.getContext = () => drawingSupported ? drawing : null;
  figure.nodes['.bath-water'].getContext = () => null;
  const document = new EventTarget(), media = new EventTarget();
  let siteReduced = false, intersection, mutation, now = 0, next = 0;
  const timers = new Map(), frames = new Map();
  document.hidden = false; document.body = {classList: {contains: () => siteReduced}};
  document.querySelectorAll = selector => selector === '.bw-story' ? [story] : selector === '.ux-memory' ? [figure] : [];
  media.matches = systemReduced;
  const window = analytics ? {WeirdAnalytics: analytics} : {};
  runInNewContext(runtime, {
    document, window, matchMedia: () => media, performance: {now: () => now},
    IntersectionObserver: class { constructor(callback) { intersection = callback; } observe() {} },
    MutationObserver: class { constructor(callback) { mutation = callback; } observe() {} },
    setTimeout(callback, delay) { const id = ++next; timers.set(id, {callback, due: now + delay}); return id; },
    clearTimeout: id => timers.delete(id),
    requestAnimationFrame(callback) { const id = ++next; frames.set(id, callback); return id; },
    cancelAnimationFrame: id => frames.delete(id),
  });
  const dispatch = (node, type, fields = {}) => { const event = new Event(type); Object.assign(event, fields); node.dispatchEvent(event); };
  return {
    figure, canvas, drawing, reveal, receipts, timers, frames,
    click: selector => dispatch(figure.nodes[selector], 'click'),
    toggle(node, open) { node.open = open; dispatch(node, 'toggle'); },
    pointer: (type, id = 1) => dispatch(canvas, type, {pointerId: id, pointerType: 'mouse', button: 0, clientX: 30, clientY: 50}),
    visible(value) { intersection([{isIntersecting: value}]); },
    hidden(value) { document.hidden = value; dispatch(document, 'visibilitychange'); },
    systemMotion(value) { media.matches = value; dispatch(media, 'change'); },
    siteMotion(value) { siteReduced = value; mutation([]); },
    advance(ms) {
      now += ms;
      for (const [id, timer] of [...timers]) if (timer.due <= now) { timers.delete(id); timer.callback(); }
    },
  };
}

test('reset during a drain cancels the delayed drawing transition', () => {
  const f = fixture(); f.visible(true);
  f.click('.ux-start button'); assert.equal(f.figure.dataset.phase, 'draining');
  assert.equal(f.timers.size, 1);
  f.advance(400); f.click('.ux-plain'); f.advance(2000);
  assert.equal(f.figure.dataset.phase, 'look');
  assert.equal(f.canvas.focusCount, 0);
  assert.equal(f.timers.size, 0);
  assert.equal(f.frames.size, 1, 'only the visible idle-water frame remains');
});

test('leaving the scene or hiding the tab finishes a drain without stealing focus', () => {
  for (const leave of [f => f.visible(false), f => f.hidden(true)]) {
    const f = fixture(); f.visible(true); f.click('.ux-start button'); leave(f);
    assert.equal(f.figure.dataset.phase, 'draw');
    assert.equal(f.timers.size, 0); assert.equal(f.frames.size, 0);
    f.advance(2000); assert.equal(f.canvas.focusCount, 0);
    f.visible(true); f.hidden(false);
    assert.equal(f.figure.dataset.phase, 'draw'); assert.equal(f.frames.size, 0);
  }
});

test('system and site motion reduction cancel an active drain immediately', () => {
  for (const reduce of [f => f.systemMotion(true), f => f.siteMotion(true)]) {
    const f = fixture(); f.visible(true); f.click('.ux-start button'); reduce(f);
    assert.equal(f.figure.dataset.phase, 'draw');
    assert.equal(f.canvas.focusCount, 1); assert.equal(f.timers.size, 0); assert.equal(f.frames.size, 0);
    f.advance(2000); assert.equal(f.canvas.focusCount, 1, 'no late timer focus');
    f.click('.ux-plain'); f.click('.ux-start button');
    assert.equal(f.figure.dataset.phase, 'draw'); assert.equal(f.timers.size, 0);
  }
  const f = fixture({systemReduced: true}); f.visible(true); f.click('.ux-start button');
  assert.equal(f.figure.dataset.phase, 'draw'); assert.equal(f.frames.size, 0); assert.equal(f.timers.size, 0);
});

test('normal drain, pointer cancellation, comparison and reset preserve drawing state', () => {
  const f = fixture(); f.visible(true); f.click('.ux-start button'); f.advance(1100);
  assert.equal(f.figure.dataset.phase, 'draw'); assert.equal(f.canvas.focusCount, 1);
  f.pointer('pointerdown'); f.pointer('pointermove'); const strokes = f.drawing.strokes;
  f.pointer('pointercancel'); f.pointer('pointermove');
  assert.equal(f.canvas.captured.size, 0); assert.equal(f.drawing.strokes, strokes);
  f.click('.ux-compare button'); assert.equal(f.figure.dataset.phase, 'compare');
  assert.match(f.figure.nodes['.ux-note'].textContent, /Your lines are cream/);
  f.click('.ux-plain'); assert.equal(f.drawing.clears, 1);
  f.pointer('pointermove'); assert.equal(f.drawing.strokes, strokes);
  f.click('.ux-skip'); assert.equal(f.figure.dataset.phase, 'compare');
  assert.equal(f.figure.nodes['.ux-note'].textContent, 'The original lines are back.');
});

test('only the answer reveal counts, once, and enables continuation analytics', () => {
  const config = {enabled: true, projectToken: 'phc_Fixture123', apiHost: 'https://us.i.posthog.com', publicOrigin: 'https://example.org'};
  // IDs select production treatment behavior; all fixture data is fictional.
  const entries = [{id: 'bath-wrinkle-pattern', treatment: {kind: 'custom'}}, {id: 'fixture-next', treatment: {kind: 'reveal'}}, {id: 'mail', treatment: {kind: 'custom'}}];
  const markup = analyticsHead(config, {entries, publicOrigin: config.publicOrigin});
  const payload = JSON.parse(markup.match(/id="analytics-config">([^<]+)<\/script>/)[1]);
  assert.equal(payload.entries[0].revealable, true); assert.equal(payload.entries[2].revealable, false);
  assert.equal(analyticsHead(config, {entries, publicOrigin: config.publicOrigin, drafts: true}), '');
  const events = [];
  const visit = createVisit({entries: payload.entries, capture: (event, properties) => events.push({event, properties}), visitId: 'fixture', pageKind: 'collection'});
  const f = fixture({systemReduced: true, analytics: {reveal: id => visit.reveal(id)}});
  f.visible(true); f.click('.ux-start button'); f.click('.ux-compare button'); f.click('.ux-plain'); f.click('.ux-skip');
  f.toggle(f.receipts, true); assert.equal(events.length, 0, 'game and receipts cannot fabricate an answer reveal');
  f.toggle(f.reveal, true); f.toggle(f.reveal, false); f.toggle(f.reveal, true);
  visit.view('fixture-next'); visit.view('fixture-next');
  assert.deepEqual(events.filter(e => e.event === 'discovery_revealed').map(e => [e.properties.entry_id, e.properties.revealed_count]), [['bath-wrinkle-pattern', 1]]);
  assert.deepEqual(events.filter(e => e.event === 'discovery_continued').map(e => e.properties.from_entry_id), ['bath-wrinkle-pattern']);
  const noAnalytics = fixture(); assert.doesNotThrow(() => noAnalytics.toggle(noAnalytics.reveal, true));
});

test('answer reveal analytics also work when drawing canvas is unavailable', () => {
  const ids = [], f = fixture({drawingSupported: false, analytics: {reveal: id => ids.push(id)}});
  f.toggle(f.reveal, true); assert.deepEqual(ids, ['bath-wrinkle-pattern']);
  assert.equal(f.figure.nodes['.ux-actions'].hidden, true);
});
