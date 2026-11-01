/* Offline sound effects for Russian Dice Poker, synthesized via Web Audio. */
(() => {
  'use strict';

  const storageKey = 'russisches-wuerfelpoker-ton';
  const AudioEngine = window.AudioContext || window.webkitAudioContext;
  let enabled = true;
  let context = null;
  let output = null;
  let noiseBuffer = null;
  let toggleButton = null;
  const activeSources = new Set();

  try { enabled = localStorage.getItem(storageKey) !== 'aus'; } catch (_) { /* file:// may restrict storage */ }

  function updateToggle() {
    if (!toggleButton) return;
    const label = enabled ? 'Ton an' : 'Ton aus';
    toggleButton.querySelector('.sound-label').textContent = label;
    toggleButton.querySelector('.sound-icon').textContent = enabled ? '\u266b' : '\u266a';
    toggleButton.setAttribute('aria-label', enabled ? 'Soundeffekte aktiviert' : 'Soundeffekte deaktiviert');
    toggleButton.setAttribute('aria-pressed', String(enabled));
    toggleButton.title = enabled ? 'Soundeffekte ausschalten' : 'Soundeffekte einschalten';
    toggleButton.classList.toggle('sound-muted', !enabled);
  }

  function getContext() {
    if (!enabled || !AudioEngine) return null;
    if (!context) {
      try {
        context = new AudioEngine();
        output = context.createGain();
        output.gain.value = 0.48;
        output.connect(context.destination);
        noiseBuffer = context.createBuffer(1, context.sampleRate, context.sampleRate);
        const channel = noiseBuffer.getChannelData(0);
        for (let i = 0; i < channel.length; i++) channel[i] = Math.random() * 2 - 1;
      } catch (error) {
        context = null;
        return null;
      }
    }
    // Called from a button event at least once, satisfying browser autoplay rules.
    if (context.state === 'suspended') context.resume().catch(() => {});
    return context;
  }

  function track(source) {
    activeSources.add(source);
    source.addEventListener('ended', () => activeSources.delete(source), { once: true });
  }

  function silence() {
    for (const source of activeSources) {
      try { source.stop(); } catch (_) { /* already finished */ }
    }
    activeSources.clear();
  }

  function tone(ctx, when, frequency, length, gain = 0.13, type = 'sine', endFrequency = frequency) {
    const oscillator = ctx.createOscillator();
    const envelope = ctx.createGain();
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, when);
    oscillator.frequency.exponentialRampToValueAtTime(Math.max(25, endFrequency), when + length);
    envelope.gain.setValueAtTime(0.0001, when);
    envelope.gain.exponentialRampToValueAtTime(gain, when + Math.min(0.012, length * 0.2));
    envelope.gain.exponentialRampToValueAtTime(0.0001, when + length);
    oscillator.connect(envelope);
    envelope.connect(output);
    track(oscillator);
    oscillator.start(when);
    oscillator.stop(when + length + 0.01);
  }

  function tap(ctx, when, strength = 1, pitch = 520) {
    // A filtered noise click and a short low thump sound like dice on felt.
    const source = ctx.createBufferSource();
    source.buffer = noiseBuffer;
    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = pitch;
    filter.Q.value = 0.8;
    const envelope = ctx.createGain();
    const length = 0.034 + 0.016 * strength;
    envelope.gain.setValueAtTime(0.0001, when);
    envelope.gain.exponentialRampToValueAtTime(0.21 * strength, when + 0.003);
    envelope.gain.exponentialRampToValueAtTime(0.0001, when + length);
    source.connect(filter);
    filter.connect(envelope);
    envelope.connect(output);
    track(source);
    source.start(when, Math.random() * 0.75, length + 0.002);
    source.stop(when + length + 0.003);
    tone(ctx, when, 135 + 25 * strength, 0.055, 0.12 * strength, 'sine', 82);
  }

  function play(action, detail) {
    const ctx = getContext();
    if (!ctx) return;
    const now = ctx.currentTime + 0.018;

    switch (action) {
      case 'roll': {
        const count = Math.max(0, Math.min(5, Number(detail) || 0));
        if (!count) return;
        const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        if (reducedMotion) {
          tap(ctx, now, 0.65, 620);
          return;
        }
        const ticks = 5 + count * 2;
        for (let i = 0; i < ticks; i++) {
          const fraction = i / Math.max(1, ticks - 1);
          const when = now + 0.045 + fraction * 1.035;
          const impact = (0.44 + Math.random() * 0.22) * (1 - 0.2 * fraction);
          tap(ctx, when, impact, 420 + Math.random() * 650);
        }
        // The final landing coincides with the last animated die.
        tap(ctx, now + 1.12, 0.9, 320);
        break;
      }
      case 'keep':
        tone(ctx, now, detail ? 720 : 480, 0.07, 0.10, 'triangle', detail ? 950 : 360);
        tap(ctx, now, 0.20, 1450);
        break;
      case 'click':
        tone(ctx, now, 590, 0.075, 0.095, 'sine', 750);
        break;
      case 'start':
        tone(ctx, now, 392, 0.13, 0.12, 'triangle', 440);
        tone(ctx, now + 0.105, 587.33, 0.19, 0.12, 'triangle', 587.33);
        break;
      case 'finish-turn':
        tone(ctx, now, 515, 0.115, 0.085, 'triangle', 390);
        break;
      case 'round': {
        // result: +1 player won, -1 computer won, 0 tie
        if (detail > 0) {
          [523.25, 659.25, 783.99].forEach((freq, i) => tone(ctx, now + i * 0.115, freq, 0.28, 0.15, 'triangle'));
        } else if (detail < 0) {
          [392, 349.23, 293.66].forEach((freq, i) => tone(ctx, now + i * 0.135, freq, 0.26, 0.095, 'sine'));
        } else {
          tone(ctx, now, 440, 0.24, 0.105, 'sine');
          tone(ctx, now + 0.135, 440, 0.27, 0.085, 'sine');
        }
        break;
      }
      case 'game-over': {
        if (detail > 0) {
          [392, 523.25, 659.25, 783.99].forEach((freq, i) => tone(ctx, now + i * 0.13, freq, 0.36, 0.13, 'triangle'));
        } else if (detail < 0) {
          [440, 392, 329.63].forEach((freq, i) => tone(ctx, now + i * 0.16, freq, 0.32, 0.10, 'sine'));
        } else {
          [392, 440, 392].forEach((freq, i) => tone(ctx, now + i * 0.15, freq, 0.28, 0.09, 'sine'));
        }
        break;
      }
    }
  }

  function toggle() {
    if (!AudioEngine) return;
    enabled = !enabled;
    try { localStorage.setItem(storageKey, enabled ? 'an' : 'aus'); } catch (_) { /* optional */ }
    if (!enabled) silence();
    updateToggle();
    if (enabled) play('click');
  }

  function init() {
    toggleButton = document.getElementById('soundToggle');
    if (!toggleButton) return;
    if (!AudioEngine) {
      enabled = false;
      toggleButton.disabled = true;
      toggleButton.title = 'Dein Browser unterstuetzt keine Audioeffekte.';
    }
    updateToggle();
    toggleButton.addEventListener('click', toggle);
  }

  window.GameSound = Object.freeze({ play, silence });
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true });
  else init();
})();
