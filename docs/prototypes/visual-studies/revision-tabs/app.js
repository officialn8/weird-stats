'use strict';
const $ = selector => document.querySelector(selector);
const $$ = selector => [...document.querySelectorAll(selector)];
const studies = ['painting', 'mail', 'copper'];
const state = { study: 'painting', scale: 0, copper: false, journey: 0, playing: false, frame: 0 };
const motionQuery = matchMedia('(prefers-reduced-motion: reduce)');
const themeQuery = matchMedia('(prefers-color-scheme: dark)');
const motion = $('#motion');
const theme = $('#theme');
const reduceMotion = () => motion.checked || motionQuery.matches;

function applyTheme() {
  const choice = theme.value;
  document.documentElement.dataset.theme = choice === 'system' ? (themeQuery.matches ? 'dark' : 'light') : choice;
}
try { const saved = localStorage.getItem('weird-stats-appearance'); if (['system', 'light', 'dark'].includes(saved)) theme.value = saved; } catch {}
theme.addEventListener('change', () => { applyTheme(); try { localStorage.setItem('weird-stats-appearance', theme.value); } catch {} });
themeQuery.addEventListener('change', applyTheme);
applyTheme();
function syncMotion() {
  document.body.classList.toggle('reduce-motion', reduceMotion());
  stopJourney();
}
motion.checked = motionQuery.matches;
motion.addEventListener('change', syncMotion);
motionQuery.addEventListener('change', syncMotion);

function animateElement(element, className) {
  element.classList.remove(className);
  if (!reduceMotion()) { void element.offsetWidth; element.classList.add(className); }
}
let terrainStarted = false;
function loadTerrain() {
  if (terrainStarted) return;
  terrainStarted = true;
  const image = new Image();
  image.onload = () => { $('#canyon-image').setAttribute('href', 'assets/canyon.jpg'); $('.route-stage').classList.remove('is-loading'); $('.route-load').hidden = true; };
  image.onerror = () => { $('.route-stage').classList.remove('is-loading'); $('.route-stage').classList.add('asset-failed'); $('.route-load').textContent = 'The terrain could not load. The schematic route still works.'; };
  image.src = 'assets/canyon.jpg';
}
function changeStudy(name, updateHistory = true) {
  if (!studies.includes(name)) name = 'painting';
  stopJourney();
  state.study = name;
  if (name === 'mail') loadTerrain();
  $$('.study').forEach(section => { section.hidden = section.id !== name; });
  $$('nav [data-study]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.study === name)));
  if (updateHistory && location.hash !== '#' + name) history.pushState(null, '', '#' + name);
  animateElement($('#' + name), 'enter');
}
$$('nav [data-study]').forEach(button => button.addEventListener('click', () => changeStudy(button.dataset.study)));
$('.brand').addEventListener('click', event => { event.preventDefault(); changeStudy('painting'); });
$('.next-discovery').addEventListener('click', () => {
  changeStudy(studies[(studies.indexOf(state.study) + 1) % studies.length]);
  $('#main').scrollIntoView({ behavior: 'instant', block: 'start' });
  $('#main').focus({ preventScroll: true });
});
function followStudyHash() {
  const name = location.hash.slice(1);
  if (studies.includes(name)) changeStudy(name, false);
}
addEventListener('popstate', followStudyHash);
addEventListener('hashchange', followStudyHash);

const scaleStates = [
  { label: 'There’s more in the details.', number: 'How small is a pixel?', copy: 'The museum photographed this painting in extraordinary detail. Take a closer look at what one pixel represents.', caption: 'Rembrandt’s The Night Watch. Start with the whole painting.', measure: '', cell: '100%' },
  { label: 'Inside a 1 mm square of paint', number: '40,000', copy: 'Two hundred pixels across. Two hundred down. All inside a square just one millimeter wide.', caption: 'Measured diagram: 1 mm × 1 mm, enlarged. The grid represents pixels, not actual paint colors.', measure: '1 mm across', cell: '0.5%' },
  { label: 'Inside a 0.1 mm square of paint', number: '400', copy: 'Ten times narrower, yet still twenty pixels across. We’re getting closer.', caption: 'Measured diagram: 0.1 mm × 0.1 mm, enlarged. Twenty pixels across and twenty down.', measure: '0.1 mm across', cell: '5%' },
  { label: 'One pixel represents a square of paint', number: '0.005 mm', copy: 'That’s the width of one pixel’s patch of paint. The museum stitched 8,439 photographs into the full image.', caption: 'Measured diagram: 0.005 mm × 0.005 mm, enlarged. This square is not an actual paint sample.', measure: '0.005 mm across', cell: '100%' }
];
function setScale(index) {
  state.scale = index;
  const current = scaleStates[index];
  $('#art-label').textContent = current.label;
  $('#art-number').textContent = current.number;
  $('#art-number').classList.toggle('initial', index === 0);
  $('#art-number').style.fontSize = index === 3 ? 'clamp(38px, 4.4vw, 58px)' : '';
  $('#art-copy').textContent = current.copy;
  $('#art-caption').textContent = current.caption;
  $('.art-stage').dataset.scale = String(index);
  $('.artwork').hidden = index !== 0 || (painting.complete && !painting.naturalWidth);
  $('.asset-error').hidden = index !== 0 || !(painting.complete && !painting.naturalWidth);
  $('.pixel-model').hidden = index === 0;
  $('.pixel-model').setAttribute('aria-label', current.caption);
  $('.pixel-grid').style.setProperty('--cell', current.cell);
  $('.pixel-grid').classList.toggle('single', index === 3);
  $('#measurement-text').textContent = current.measure;
  $('.art-context').hidden = index === 0;
  $$('.scale-control button').forEach(button => button.setAttribute('aria-pressed', String(+button.dataset.scale === index)));
  $('#closer').innerHTML = index === 3 ? 'Start again <span aria-hidden="true">↺</span>' : 'Look closer <span aria-hidden="true">↗</span>';
  animateElement(index === 0 ? $('.artwork') : $('.pixel-model'), 'scale-enter');
}
$$('[data-scale]').filter(element => element.tagName === 'BUTTON').forEach(button => button.addEventListener('click', () => setScale(+button.dataset.scale)));
$('#closer').addEventListener('click', () => setScale((state.scale + 1) % 4));
const painting = $('.artwork img');
function imageFailed() { $('.asset-error').hidden = false; $('.artwork').hidden = true; }
painting.addEventListener('error', imageFailed);
if (painting.complete && !painting.naturalWidth) imageFailed();

const trail = $('#trail');
const trailLength = trail.getTotalLength();
function setJourney(value) {
  state.journey = Math.max(0, Math.min(100, value));
  const point = trail.getPointAtLength(trailLength * state.journey / 100);
  $('#mail-marker').setAttribute('transform', `translate(${point.x} ${point.y})`);
  $('#trail-position').value = state.journey;
  const status = state.journey === 0 ? 'Ready at the rim.' : state.journey === 100 ? 'Delivered to Supai.' : 'On the way to Supai.';
  if ($('#map-status').textContent !== status) $('#map-status').textContent = status;
  $('#trail-position').setAttribute('aria-valuetext', state.journey === 0 ? 'At the canyon rim' : state.journey === 100 ? 'At Supai Post Office' : `${Math.round(state.journey)} percent through the schematic route`);
}
function stopJourney() {
  cancelAnimationFrame(state.frame);
  state.playing = false;
  $('#journey').innerHTML = state.journey === 100 ? 'Replay <span aria-hidden="true">↺</span>' : state.journey > 0 ? 'Resume journey <span aria-hidden="true">→</span>' : 'Follow the mail <span aria-hidden="true">→</span>';
}
$('#journey').addEventListener('click', () => {
  if (state.playing) { stopJourney(); return; }
  if (reduceMotion()) { setJourney(state.journey === 100 ? 0 : 100); stopJourney(); return; }
  if (state.journey === 100) setJourney(0);
  state.playing = true;
  $('#journey').textContent = 'Pause journey';
  const initial = state.journey;
  const start = performance.now();
  function frame(time) {
    setJourney(initial + (time - start) / 75);
    if (state.journey < 100 && state.playing) state.frame = requestAnimationFrame(frame);
    else stopJourney();
  }
  state.frame = requestAnimationFrame(frame);
});
$('#trail-position').addEventListener('input', event => { stopJourney(); setJourney(+event.target.value); stopJourney(); });
document.addEventListener('visibilitychange', () => { if (document.hidden) stopJourney(); });

for (let index = 0; index < 60; index++) {
  const unit = document.createElement('i');
  unit.className = 'copper-unit';
  unit.style.setProperty('--i', index);
  $('.nickel-units').append(unit);
}
function revealCopper(guess) {
  state.copper = true;
  $('.coin-choices').hidden = true;
  $('.copper-result').hidden = false;
  $('#copper-explanation').hidden = false;
  $('#compare').innerHTML = 'Try again <span aria-hidden="true">↺</span>';
  $('#copper-note').textContent = guess ? `You picked the ${guess}. Here’s the copper inside each.` : 'One square for the penny. Sixty for the nickel.';
  $$('.nickel-units .copper-unit').forEach(unit => animateElement(unit, 'unit-enter'));
  if (guess) $('#compare').focus({ preventScroll: true });
}
$('#compare').addEventListener('click', () => {
  if (!state.copper) { revealCopper(); return; }
  state.copper = false;
  $('.coin-choices').hidden = false;
  $('.copper-result').hidden = true;
  $('#copper-explanation').hidden = true;
  $('#compare').innerHTML = 'Show the copper <span aria-hidden="true">→</span>';
  $('#copper-note').textContent = 'Pick a coin, or skip the guess.';
  $$('.nickel-units .copper-unit').forEach(unit => unit.classList.remove('unit-enter'));
});
$$('[data-guess]').forEach(button => button.addEventListener('click', () => revealCopper(button.dataset.guess)));
setJourney(0);
syncMotion();
changeStudy(location.hash.slice(1) || 'painting', false);
