'use strict';
(() => {
  const section = document.querySelector('#crunch');
  if (!section) return;
  const stage = section.querySelector('.chip-stage');
  const buttons = [...section.querySelectorAll('[data-crunch]')];
  const bars = [...section.querySelectorAll('.crunch-wave i')];
  const status = section.querySelector('#crunch-status');
  const volume = section.querySelector('#crunch-volume');
  const mute = section.querySelector('#crunch-mute');
  const answer = section.querySelector('#crunch-answer');
  const revealButton = section.querySelector('#crunch-reveal');
  const revealButtons = [...new Set([revealButton,...section.querySelectorAll('[data-crunch-reveal]')].filter(Boolean))];
  const guesses = [...section.querySelectorAll('[data-crunch-guess]')];
  const guessStatus = section.querySelector('#crunch-guess-status');
  const choiceFeedback = section.querySelector('#crunch-choice-feedback');
  let impression = null;
  function syncImpression() {
    if (!choiceFeedback) return;
    choiceFeedback.hidden = impression === null;
    choiceFeedback.textContent = impression === null ? '' : `Your impression: ${impression}.`;
  }
  guesses.forEach(button => button.addEventListener('click', () => {
    impression = button.textContent.trim();
    guesses.forEach(choice => choice.setAttribute('aria-pressed', String(choice === button)));
    syncImpression();
    if (guessStatus) guessStatus.textContent = `You chose ${impression}. Reveal when you’re ready.`;
  }));
  const player = document.createElement('audio');
  player.id = 'crunch-audio';
  player.preload = 'none';
  player.hidden = true;
  section.append(player);
  let context, analyser, samples, active = null, generation = 0, frame = 0, muted = false;
  const heard = new Set();
  const motionOff = () => document.body.classList.contains('reduce-motion');

  function clearVisual() {
    cancelAnimationFrame(frame);
    stage.style.setProperty('--energy', 0);
    bars.forEach(bar => bar.style.removeProperty('transform'));
  }
  function syncButtons() {
    buttons.forEach(button => {
      const key = button.dataset.crunch;
      const playing = active === key;
      button.classList.toggle('is-playing', playing);
      const label = playing ? 'Stop ' + key.toUpperCase() : heard.has(key) ? 'Again ' + key.toUpperCase() : 'Listen ' + key.toUpperCase();
      button.querySelector('.listen-label').textContent = label;
      button.querySelector('.listen-symbol').textContent = playing ? '■' : '▶';
    });
  }
  function stop(message) {
    generation++;
    player.pause();
    active = null;
    clearVisual();
    syncButtons();
    if (message) status.textContent = message;
  }
  function visualize() {
    if (player.paused || !active || !analyser || motionOff()) {
      clearVisual();
      return;
    }
    analyser.getByteFrequencyData(samples);
    let energy = 0;
    for (let i = 0; i < samples.length; i++) energy += samples[i];
    stage.style.setProperty('--energy', Math.min(1, energy / samples.length / 100).toFixed(3));
    bars.forEach((bar, index) => {
      const level = samples[Math.floor(index / bars.length * samples.length)];
      bar.style.transform = `scaleY(${(.08 + level / 255 * .92).toFixed(3)})`;
    });
    frame = requestAnimationFrame(visualize);
  }
  function setupAudio() {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!context && AudioContextClass) {
      // Created in a click handler only. One media source and one output path.
      context = new AudioContextClass();
      analyser = context.createAnalyser();
      analyser.fftSize = 128;
      samples = new Uint8Array(analyser.frequencyBinCount);
      context.createMediaElementSource(player).connect(analyser);
      analyser.connect(context.destination);
    }
    return context?.state === 'suspended' ? context.resume() : Promise.resolve();
  }
  buttons.forEach(button => button.addEventListener('click', async () => {
    const key = button.dataset.crunch;
    if (active === key) { stop('Stopped. Tap either version to listen again.'); return; }
    stop();
    if (muted || Number(volume.value) === 0) {
      status.textContent = muted ? 'Sound is muted. Unmute to listen, or reveal without sound.' : 'Volume is at zero. Raise it to listen, or reveal without sound.';
      return;
    }
    const request = generation;
    active = key;
    syncButtons();
    status.textContent = `Loading crunch ${key.toUpperCase()}…`;
    player.src = `/assets/chip-${key}.mp3`;
    try {
      await setupAudio();
      if (request !== generation) return;
      await player.play();
      if (request !== generation) return;
      heard.add(key);
      status.textContent = `Playing crunch ${key.toUpperCase()}.`;
      visualize();
    } catch (error) {
      if (request !== generation) return;
      stop('Sound couldn’t play. Try again, or reveal the discovery without sound.');
    }
  }));
  player.addEventListener('ended', () => {
    if (!active) return;
    const finished = active.toUpperCase();
    stop(heard.size === 2 ? 'Both versions heard. What changed for you?' : `Crunch ${finished} finished. Try the other version, or reveal the discovery.`);
  });
  player.addEventListener('error', () => {
    if (active) stop('Sound couldn’t load. You can still reveal the discovery.');
  });
  function syncVolume() {
    player.volume = Number(volume.value) / 100;
    player.muted = muted;
    section.querySelector('#crunch-level').textContent = volume.value + '%';
    mute.textContent = muted ? 'Unmute' : 'Mute';
    mute.setAttribute('aria-pressed', String(muted));
  }
  volume.addEventListener('input', syncVolume);
  mute.addEventListener('click', () => {
    muted = !muted;
    syncVolume();
    stop(muted ? 'Sound muted. The discovery still works without it.' : 'Sound unmuted. Tap Listen when you’re ready.');
  });
  syncVolume();
  revealButtons.forEach(button => button.addEventListener('click', () => {
    stop('You can listen to either version above whenever you like.');
    syncImpression();
    answer.hidden = false;
    revealButtons.forEach(button => button.setAttribute('aria-expanded', 'true'));
    section.querySelector('#crunch-result').focus({preventScroll:true});
    answer.scrollIntoView({block:'start', behavior:motionOff() ? 'instant' : 'smooth'});
  }));
  section.querySelector('#crunch-reset').addEventListener('click', () => {
    stop('Tap either version to listen, or reveal without sound.');
    answer.hidden = true;
    impression = null;
    syncImpression();
    guesses.forEach(choice => choice.setAttribute('aria-pressed', 'false'));
    if (guessStatus) guessStatus.textContent = 'Choose an impression, or go straight to the reveal.';
    revealButtons.forEach(button => button.setAttribute('aria-expanded', 'false'));
    revealButton.focus({preventScroll:true});
    section.scrollIntoView({block:'start', behavior:motionOff() ? 'instant' : 'smooth'});
  });
  new IntersectionObserver(entries => {
    if (!entries[0].isIntersecting && active) stop('Playback stopped while you explored. Tap Listen to replay.');
  }).observe(section.querySelector('.crunch-player'));
  new MutationObserver(() => { if (motionOff()) clearVisual(); }).observe(document.body, {attributes:true, attributeFilter:['class']});
  document.addEventListener('visibilitychange', () => {
    if (document.hidden && active) stop('Playback paused. Tap Listen to replay.');
  });
  window.addEventListener('pagehide', () => stop());
})();
