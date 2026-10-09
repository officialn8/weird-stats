for (const story of document.querySelectorAll('.bw-story')) {
  const reveal = story.querySelector('.bw-reveal');
  reveal.addEventListener('toggle', () => {
    if (reveal.open) window.WeirdAnalytics?.reveal(story.id);
  });
}

for (const figure of document.querySelectorAll('.ux-memory')) {
  const canvas = figure.querySelector('.bath-drawing');
  const context = canvas.getContext('2d');
  if (!context) continue;
  const water = figure.querySelector('.bath-water');
  const paint = water.getContext('2d');
  const note = figure.querySelector('.ux-note');
  const label = figure.querySelector('.bath-label');
  const start = figure.querySelector('.ux-start button');
  const compare = figure.querySelector('.ux-compare button');
  const reset = figure.querySelector('.ux-plain');
  const skip = figure.querySelector('.ux-skip');
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  let pointer = null, hasDrawing = false, frame = 0, drainTimer = 0, drainStart = 0;
  let visible = false;
  const reduced = () => motion.matches || document.body.classList.contains('reduce-motion');
  const duration = 1100;

  function endStroke() {
    const previous = pointer;
    pointer = null;
    if (previous !== null && canvas.hasPointerCapture(previous)) canvas.releasePointerCapture(previous);
  }
  function phase(value) {
    clearTimeout(drainTimer);
    endStroke(); figure.dataset.phase = value;
    canvas.tabIndex = value === 'draw' ? 0 : -1;
    start.disabled = value === 'draining';
    start.textContent = value === 'draining' ? 'Draining…' : 'Drain the bath';
    label.textContent = {look:'Remember these lines',draining:'There they go…',draw:'Draw on the fingertip',compare:'Original + your drawing'}[value];
    schedule();
  }
  function finishDrain(focus = true) {
    phase('draw');
    note.textContent = 'Draw the lines you remember on the finger.';
    if (focus && visible && !document.hidden) canvas.focus();
  }
  function uncover() {
    phase('compare');
    if (!hasDrawing) label.textContent = 'The original is back';
    note.textContent = hasDrawing ? 'Your lines are cream; the original lines are brown.' : 'The original lines are back.';
    reset.focus({preventScroll:true});
  }
  start.addEventListener('click', () => {
    if (reduced()) return finishDrain();
    drainStart = performance.now();
    phase('draining');
    note.textContent = 'The lines are fading as the bath drains.';
    drainTimer = setTimeout(() => finishDrain(), duration);
  });
  compare.addEventListener('click', uncover);
  skip.addEventListener('click', uncover);
  reset.addEventListener('click', () => {
    hasDrawing = false; context.clearRect(0, 0, canvas.width, canvas.height);
    phase('look'); note.textContent = 'Drain the bath when you’re ready.';
    start.focus({preventScroll:true});
    canvas.scrollIntoView({block:'center',behavior:'instant'});
  });
  function point(event) {
    const rect = canvas.getBoundingClientRect();
    return [(event.clientX - rect.left) * canvas.width / rect.width, (event.clientY - rect.top) * canvas.height / rect.height];
  }
  canvas.addEventListener('pointerdown', event => {
    if (figure.dataset.phase !== 'draw' || pointer !== null || (event.pointerType === 'mouse' && event.button !== 0)) return;
    pointer = event.pointerId; canvas.setPointerCapture(pointer);
    const [x,y] = point(event);
    context.strokeStyle = '#fff6df'; context.shadowColor = '#693817'; context.shadowBlur = 3;
    context.lineWidth = 7; context.lineCap = 'round'; context.lineJoin = 'round';
    context.beginPath(); context.moveTo(x,y); context.lineTo(x+.01,y); context.stroke(); hasDrawing = true;
  });
  canvas.addEventListener('pointermove', event => {
    if (pointer !== event.pointerId || figure.dataset.phase !== 'draw') return;
    context.lineTo(...point(event)); context.stroke();
  });
  for (const type of ['pointerup','pointercancel','lostpointercapture']) canvas.addEventListener(type, event => {
    if (pointer === event.pointerId) endStroke();
  });

  // The artwork stays static; only translucent water and a few bubbles are repainted.
  function render(now) {
    if (!paint) return;
    paint.setTransform(water.width / 1024, 0, 0, water.height / 1536, 0, 0);
    paint.clearRect(0, 0, 1024, 1536);
    const state = figure.dataset.phase;
    const amount = state === 'look' ? 1 : state === 'draining' ? Math.max(0, 1 - (now - drainStart) / duration) : 0;
    if (!amount) return;
    const time = reduced() ? 0 : now / 1000;
    const level = 1220 - 110 * amount;
    paint.save();
    // Confine the water to the basin, above the painted porcelain front lip.
    paint.beginPath(); paint.moveTo(210,1100); paint.quadraticCurveTo(610,1070,1024,1102);
    paint.lineTo(1024,1210); paint.quadraticCurveTo(640,1270,210,1195); paint.closePath(); paint.clip();
    paint.globalAlpha = .38 * amount;
    const fill = paint.createLinearGradient(0, level, 0, 1250);
    fill.addColorStop(0, '#a8dcd0'); fill.addColorStop(1, '#297c83'); paint.fillStyle = fill;
    paint.beginPath(); paint.moveTo(210, 1280); paint.lineTo(210, level);
    for (let x = 210; x <= 1030; x += 12) paint.lineTo(x, level + Math.sin(x / 67 + time * 1.5) * 4);
    paint.lineTo(1030,1280); paint.closePath(); paint.fill();
    paint.strokeStyle = '#fff3c9'; paint.lineWidth = 3; paint.globalAlpha = .6 * amount;
    for (let i=0;i<4;i++) {
      const x = 295 + i * 155 + Math.sin(time + i) * 8;
      paint.beginPath(); paint.ellipse(x, level + 20 + i%2*18, 43, 5, 0, .1, 2.7); paint.stroke();
    }
    paint.restore();
    for (let i=0;i<7;i++) {
      const cycle = (time * .12 + i * .143) % 1;
      const x = (i%2 ? 829 : 198) + Math.sin(time*.7+i)*15;
      const y = 1110 - cycle * 380;
      paint.globalAlpha = Math.sin(cycle * Math.PI) * .45 * amount;
      paint.strokeStyle = '#fff8e7'; paint.lineWidth = 2;
      paint.beginPath(); paint.arc(x,y,7+i%3*5,0,Math.PI*2); paint.stroke();
      paint.beginPath(); paint.arc(x-2,y-2,3+i%3*2,Math.PI,Math.PI*1.5); paint.stroke();
    }
    paint.globalAlpha = 1;
  }
  function tick(now) {
    frame = 0; render(now);
    if (visible && !document.hidden && !reduced() && ['look','draining'].includes(figure.dataset.phase)) frame = requestAnimationFrame(tick);
  }
  function schedule() {
    cancelAnimationFrame(frame); frame = 0;
    if (visible && !document.hidden) tick(performance.now());
    else render(performance.now());
  }
  new IntersectionObserver(entries => {
    visible = entries[0].isIntersecting;
    if (!visible && figure.dataset.phase === 'draining') finishDrain(false);
    schedule();
  }, {threshold:0}).observe(figure.querySelector('.bath-scene'));
  function motionChanged() {
    if (reduced() && figure.dataset.phase === 'draining') finishDrain();
    schedule();
  }
  motion.addEventListener('change', motionChanged);
  new MutationObserver(motionChanged).observe(document.body, {attributes:true,attributeFilter:['class']});
  document.addEventListener('visibilitychange', () => {
    if (document.hidden && figure.dataset.phase === 'draining') finishDrain(false);
    schedule();
  });
  figure.querySelector('.ux-actions').hidden = false;
  skip.hidden = false;
}
