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
  removeAttribute(key){delete this.attrs[key];}
  hasAttribute(key){return key in this.attrs;}
  append(child){this.children.push(child);}
  after(node){this.nextSibling = node;node.previousSibling = this;}
  focus(){}
  scrollIntoView(){}
  getBoundingClientRect(){return {top:0};}
  pause(){}
}

// Records every assignment to a property so tests can prove what was (never) written.
function recordWrites(element, key, log) {
  let value = element[key];
  Object.defineProperty(element, key, {get: () => value, set(next){value = next;log.push(next);}});
  return element;
}

function environment(stories, reduced = false) {
  const document = new Element(), window = new Element(), timers = [], observers = [];
  document.nodes = {'#motion':new Element(), '#theme':new Element(), ...stories};
  document.body = new Element(); document.documentElement = new Element();
  document.createElement = tag => {const element = new Element();element.tagName = tag;element.writes = [];return recordWrites(element, 'textContent', element.writes);};
  document.hidden = false;
  let now = 0;
  const sandbox = {
    document, window, Event,
    matchMedia: query => Object.assign(new Element(), {matches:query.includes('reduced-motion') && reduced}),
    localStorage:{getItem(){return null;}, setItem(){}},
    IntersectionObserver:class{constructor(callback){observers.push(callback);} observe(){}}, MutationObserver:class{observe(){}},
    setTimeout(callback, delay = 0){const timer = {callback, delay, at:now + delay};timers.push(timer);return timer;},
    clearTimeout(timer){if(timer && typeof timer === 'object') timer.cancelled = true;}, cancelAnimationFrame(){},
  };
  // Runs due, uncancelled timers in time order, including ones they schedule.
  function advance(ms = Infinity) {
    const until = now + ms;
    for(let due; (due = timers.filter(timer => !timer.cancelled && !timer.ran && timer.at <= until).sort((a, b) => a.at - b.at)[0]);) {
      now = due.at;due.ran = true;due.callback();
    }
    if(Number.isFinite(until)) now = until;
  }
  return {sandbox, timers, observers, document, advance};
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
    story.nodes['.copper-question'].nodes['.question-copy']=new Element();
    story.nodes['.copper-answer'].hidden=true;
    runInNewContext(source, environment({'#copper':story}).sandbox);
    assert.equal(story.nodes['#penny-pile'].children.length, ratio);
    assert(story.nodes['#penny-pile'].children.every(coin => coin.src === '/assets/fictional-coin.webp'));
    button.dispatchEvent(new Event('click'));
    assert.equal(story.nodes['.copper-answer'].hidden,true,'a guess must not reveal');
    assert.equal(button.attrs['aria-pressed'],'true');
    story.nodes['#reveal'].dispatchEvent(new Event('click'));
    assert.equal(story.nodes['.copper-answer'].hidden,false);
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
    } else assert(timers.every(timer => timer.delay < 650), 'reduced motion schedules no hour-by-hour animation');
    assert.equal(status.textContent, `To orchard: ${down}h. Return to station: ${up}h. ${down + up}h total.`);
  }
});

async function mountMail({down = 2, up = 4, reduced = false} = {}) {
  const legs = [down, up].map((duration, index) => {
    const leg = new Element();
    leg.nodes = {'div > span':new Element(index ? 'Return to station' : 'To orchard'), strong:new Element(`${duration}h`), 'strong span':new Element('h'), '.hour-marks i':Array.from({length:duration}, () => new Element())};
    return leg;
  });
  const story = new Element(), score = new Element(), status = new Element('Approved opening status.');
  score.setAttribute('role', 'img');
  status.setAttribute('aria-live', 'polite');
  const disabledWrites = [], replay = recordWrites(new Element(), 'disabled', disabledWrites);
  const bars = legs.flatMap(leg => leg.nodes['.hour-marks i']);
  story.nodes = {
    '.mule-scene':new Element(), '.mail-copy':new Element(), '.journey-score':score,
    '#replay-journey':replay, '#journey-status':status,
    '.journey-leg.down':legs[0], '.journey-leg.up':legs[1], '.hour-marks i':bars,
  };
  const env = environment({'#mail':story}, reduced);
  runInNewContext(await readFile(new URL('../public/app.js', import.meta.url), 'utf8'), env.sandbox);
  const announcer = score.nextSibling;
  return {
    ...env, story, score, status, replay, disabledWrites, bars, announcer,
    summary:`To orchard: ${down}h. Return to station: ${up}h. ${down + up}h total.`,
    press: () => replay.dispatchEvent(new Event('click')),
    autoplay: () => env.observers.at(-1)([{target:score, isIntersecting:true, intersectionRatio:.5}]),
    pending: () => env.timers.filter(timer => !timer.cancelled && !timer.ran),
  };
}

test('mail init leaves the visual status silent and adds one empty status region outside the score image', async () => {
  const css = await readFile(new URL('../public/styles.css', import.meta.url), 'utf8');
  for(const reduced of [false, true]) {
    const mail = await mountMail({reduced});
    assert.equal(mail.status.hasAttribute('aria-live'), false, '#journey-status must not be a live region');
    assert.ok(mail.announcer, 'a status region follows the journey score');
    assert.equal(mail.announcer.getAttribute('role'), 'status');
    assert.equal(mail.announcer.textContent, '');
    assert.deepEqual(mail.announcer.writes, [], 'page load must stay silent');
    assert.equal(mail.score.getAttribute('role'), 'img');
    assert.equal(mail.announcer.previousSibling, mail.score, 'the region is a sibling after [role="img"], not inside it');
    assert(!mail.score.children.includes(mail.announcer));
    assert(mail.announcer.className, 'the region carries a class');
    assert.match(css, new RegExp(`\\.${mail.announcer.className}\\{[^}]*clip-path:inset\\(50%\\)`), 'the region is visually hidden');
    mail.advance();
    assert.deepEqual(mail.announcer.writes, []);
  }
});

test('a mail press keeps the replay button enabled and announces the summary once the run finishes', async () => {
  const mail = await mountMail();
  mail.press();
  assert.equal(mail.status.textContent, 'To orchard…');
  assert.notEqual(mail.replay.disabled, true);
  assert.deepEqual(mail.announcer.writes, [], 'nothing is announced while the run plays');
  mail.advance(650 * 3);
  assert.equal(mail.status.textContent, 'Return to station: 1h…');
  assert.notEqual(mail.replay.disabled, true);
  assert.deepEqual(mail.announcer.writes, []);
  mail.advance();
  assert.equal(mail.status.textContent, mail.summary);
  assert.deepEqual(mail.announcer.writes, ['', mail.summary], 'cleared, then refilled with the fragment-derived summary');
  assert.equal(mail.announcer.textContent, mail.summary);
  assert.equal(mail.replay.innerHTML, 'Watch it again <span aria-hidden="true">↺</span>');
  assert(!mail.disabledWrites.includes(true), 'the replay button is never disabled');
  assert.notEqual(mail.replay.disabled, true);
});

test('mail auto-play narrates visually but never disables the button or writes to the status region', async () => {
  const mail = await mountMail();
  mail.autoplay();
  assert.equal(mail.status.textContent, 'To orchard…');
  assert.notEqual(mail.replay.disabled, true);
  mail.advance(650);
  assert.equal(mail.status.textContent, 'To orchard: 1h…');
  mail.advance();
  assert.equal(mail.status.textContent, mail.summary);
  assert.equal(mail.replay.innerHTML, 'Watch it again <span aria-hidden="true">↺</span>');
  assert.deepEqual(mail.announcer.writes, []);
  assert(!mail.disabledWrites.includes(true));
});

test('a mail press mid-play cancels the earlier run, restarts and announces once at the end', async () => {
  for(const start of ['autoplay', 'press']) {
    const mail = await mountMail();
    mail[start]();
    mail.advance(650 * 1.5);
    assert.equal(mail.status.textContent, 'To orchard: 1h…');
    const earlier = mail.pending();
    assert(earlier.length > 0);
    mail.press();
    assert(earlier.every(timer => timer.cancelled), 'the earlier run’s timers are cancelled');
    assert.equal(mail.status.textContent, 'To orchard…');
    assert(mail.bars.every(bar => !bar.classList.contains('arrived')), 'the restart begins from no arrived marks');
    assert.notEqual(mail.replay.disabled, true);
    mail.advance();
    assert.equal(mail.status.textContent, mail.summary);
    assert.deepEqual(mail.announcer.writes, ['', mail.summary], `${start} then press announces exactly once`);
    assert(!mail.disabledWrites.includes(true));
  }
});

test('two mail presses each clear and refill the status region so an identical summary is read again', async () => {
  for(const reduced of [false, true]) {
    const mail = await mountMail({reduced});
    mail.press();mail.advance();
    assert.deepEqual(mail.announcer.writes, ['', mail.summary]);
    mail.press();
    if(!reduced) assert.equal(mail.announcer.textContent, mail.summary, 'the previous summary stays until the next run finishes');
    mail.advance();
    assert.deepEqual(mail.announcer.writes, ['', mail.summary, '', mail.summary]);
    assert(!mail.disabledWrites.includes(true));
  }
});

test('mail visibility and motion resets stop a pressed run without writing to the status region', async () => {
  for(const reset of ['hidden', 'motionchange', 'motion-off']) {
    const mail = await mountMail();
    mail.autoplay();
    mail.press();
    mail.advance(650 * 1.5);
    const pressedRun = mail.pending();
    if(reset === 'hidden') {
      mail.document.hidden = true;mail.document.dispatchEvent(new Event('visibilitychange'));
      assert.equal(mail.status.textContent, 'Approved opening status.');
      assert.equal(mail.replay.innerHTML, 'Watch the round trip <span aria-hidden="true">↗</span>');
      mail.document.hidden = false;mail.document.dispatchEvent(new Event('visibilitychange'));
    } else if(reset === 'motionchange') {
      mail.document.dispatchEvent(new Event('motionchange'));
    } else {
      mail.document.nodes['#motion'].dispatchEvent(new Event('click'));
      assert.equal(mail.status.textContent, mail.summary, 'Motion off applies the static summary visually');
    }
    assert(pressedRun.every(timer => timer.cancelled), `${reset} cancels the pressed run`);
    mail.advance();
    assert.deepEqual(mail.announcer.writes, [], `${reset} and any auto-play after it stay silent`);
    assert.equal(mail.status.textContent, mail.summary);
    assert(!mail.disabledWrites.includes(true));
  }
});

test('with reduced motion or Motion off a mail press applies the static summary and announces it once', async () => {
  for(const mode of ['reduced', 'motion-off']) {
    const mail = await mountMail({reduced:mode === 'reduced'});
    if(mode === 'motion-off') {
      mail.autoplay();
      mail.document.nodes['#motion'].dispatchEvent(new Event('click'));
    }
    mail.autoplay();
    mail.advance();
    assert.equal(mail.status.textContent, mail.summary);
    assert.deepEqual(mail.announcer.writes, [], 'load, visibility and Motion changes stay silent');
    mail.press();
    assert.equal(mail.status.textContent, mail.summary);
    assert(mail.bars.every(bar => bar.classList.contains('arrived')));
    assert.notEqual(mail.replay.disabled, true, `the button stays enabled under ${mode}`);
    mail.advance();
    assert.deepEqual(mail.announcer.writes, ['', mail.summary]);
    assert.notEqual(mail.replay.innerHTML, 'Watch it again <span aria-hidden="true">↺</span>', 'the static path keeps the round-trip label');
    assert(!mail.disabledWrites.includes(true));
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
