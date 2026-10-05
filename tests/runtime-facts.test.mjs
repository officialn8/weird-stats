import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {runInNewContext} from 'node:vm';

class Element extends EventTarget {
  constructor(text = '') {
    super(); this.textContent = text; this.nodes = {}; this.children = []; this.dataset = {}; this.attrs = {};
    this.hidden = false; this.value = 'system'; this.style = {setProperty(){}, removeProperty(){}};
    const classes = new Set();
    this.classList = {contains: value => classes.has(value), add: value => classes.add(value), remove: value => classes.delete(value), toggle(value, active){if(active) classes.add(value); else classes.delete(value);}};
  }
  querySelector(key){return this.nodes[key] ?? null;}
  querySelectorAll(key){return this.nodes[key] ?? [];}
  setAttribute(key, value){this.attrs[key] = value;}
  getAttribute(key){return this.attrs[key];}
  append(child){this.children.push(child);}
  focus(){}
  scrollIntoView(){}
  getBoundingClientRect(){return {top:0};}
  pause(){}
}

function environment(stories, reduced = false) {
  const document = new Element(), window = new Element(), timers = [];
  document.nodes = {'#motion':new Element(), '#theme':new Element(), ...stories};
  document.body = new Element(); document.documentElement = new Element();
  document.createElement = () => new Element(); document.hidden = false;
  const sandbox = {
    document, window, Event,
    matchMedia: query => Object.assign(new Element(), {matches:query.includes('reduced-motion') && reduced}),
    localStorage:{getItem(){return null;}, setItem(){}},
    IntersectionObserver:class{observe(){}}, MutationObserver:class{observe(){}},
    setTimeout(callback, delay){const timer = {callback, delay};timers.push(timer);return timer;},
    clearTimeout(timer){timer.cancelled = true;}, cancelAnimationFrame(){},
  };
  return {sandbox, timers, document};
}

test('copper pile and reveal use the pinned fragment ratio, image and answer for each instance', async () => {
  const source = await readFile(new URL('../public/app.js', import.meta.url), 'utf8');
  for(const ratio of [7, 12]) {
    const story = new Element(), button = new Element('Fictional coin'), feedback = new Element('The approved fictional answer.');
    button.dataset.coin = 'fictional';
    const image = new Element();image.setAttribute('src', '/assets/fictional-coin.webp');
    story.nodes = {
      '.copper-question':new Element(), '.copper-answer':new Element(), '#penny-pile':new Element(),
      '.giant-ratio':new Element(`${ratio}×`), '.hero-penny img':image, '#coin-feedback':feedback,
      '#reveal':new Element(), '#copper-result':new Element(), '#again':new Element(), '.coin-duet':new Element(), '.coin-choice':[button],
    };
    runInNewContext(source, environment({'#copper':story}).sandbox);
    assert.equal(story.nodes['#penny-pile'].children.length, ratio);
    assert(story.nodes['#penny-pile'].children.every(coin => coin.src === '/assets/fictional-coin.webp'));
    button.dispatchEvent(new Event('click'));
    assert.equal(feedback.textContent, 'You picked Fictional coin. The approved fictional answer.');
    story.nodes['#again'].dispatchEvent(new Event('click'));
    story.nodes['#reveal'].dispatchEvent(new Event('click'));
    assert.equal(feedback.textContent, 'The approved fictional answer.');
  }
});

test('mail timing, intermediate narration and reduced-motion summary follow approved leg values and labels', async () => {
  const source = await readFile(new URL('../public/app.js', import.meta.url), 'utf8');
  for(const [down, up] of [[2, 4], [4, 7]]) for(const reduced of [false, true]) {
    const story = new Element(), legs = [down, up].map((duration, index) => {
      const leg = new Element();
      leg.nodes = {'div > span':new Element(index ? 'Return to station' : 'To orchard'), strong:new Element(`${duration}h`), 'strong span':new Element('h'), '.hour-marks i':Array.from({length:duration}, () => new Element())};
      return leg;
    });
    story.nodes = {
      '.mule-scene':new Element(), '.mail-copy':new Element(), '.journey-score':new Element(),
      '#replay-journey':new Element(), '#journey-status':new Element('Approved opening status.'),
      '.journey-leg.down':legs[0], '.journey-leg.up':legs[1], '.hour-marks i':legs.flatMap(leg => leg.nodes['.hour-marks i']),
    };
    const {sandbox, timers} = environment({'#mail':story}, reduced);
    runInNewContext(source, sandbox);
    story.nodes['#replay-journey'].dispatchEvent(new Event('click'));
    const status = story.nodes['#journey-status'];
    if(!reduced) {
      assert.equal(status.textContent, 'To orchard…');
      assert.equal(timers.length, down + up);
      assert.equal(timers.at(-1).delay, (down + up) * 650);
      timers[down - 1].callback();assert.equal(status.textContent, `To orchard: ${down}h…`);
      timers[down].callback();assert.equal(status.textContent, 'Return to station: 1h…');
      timers.at(-1).callback();
    } else assert.equal(timers.length, 0);
    assert.equal(status.textContent, `To orchard: ${down}h. Return to station: ${up}h. ${down + up}h total.`);
  }
});

test('chip choice feedback acknowledges approved visible labels without supplying a runtime factual answer', async () => {
  const section = new Element(), guesses = ['First sound', 'Second sound', 'Neither'].map(label => new Element(label));
  section.nodes = Object.fromEntries(['.chip-stage', '#crunch-status', '#crunch-volume', '#crunch-mute', '#crunch-answer', '#crunch-reveal', '#crunch-reset', '#crunch-result', '.crunch-player', '#crunch-level', '#crunch-guess-status', '#crunch-choice-feedback'].map(key => [key, new Element()]));
  section.nodes['#crunch-volume'].value = '35';
  section.nodes['[data-crunch-guess]'] = guesses;
  section.nodes['[data-crunch-reveal]'] = [];section.nodes['[data-crunch]'] = [];section.nodes['.crunch-wave i'] = [];
  const {sandbox} = environment({'#crunch':section});
  runInNewContext(await readFile(new URL('../public/crunch.js', import.meta.url), 'utf8'), sandbox);
  for(const guess of guesses) {
    guess.dispatchEvent(new Event('click'));
    section.nodes['#crunch-reveal'].dispatchEvent(new Event('click'));
    assert.equal(section.nodes['#crunch-choice-feedback'].textContent, `Your impression: ${guess.textContent}.`);
    assert.equal(section.nodes['#crunch-guess-status'].textContent, `You chose ${guess.textContent}. Reveal when you’re ready.`);
  }
});
