// Web Audio API Industrial Railway Alarm Sound Synthesizer
// Provides 100% offline, zero-latency, reliable audio alerts without external MP3 dependencies.

let audioCtx: AudioContext | null = null;
let activeOscillators: { osc: OscillatorNode; gain: GainNode }[] = [];
let alarmInterval: any = null;

function getAudioContext(): AudioContext {
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    audioCtx = new AudioContextClass();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume().catch(() => {});
  }
  return audioCtx;
}

// Ensure AudioContext is unlocked upon user gesture
export function initAudioOnUserGesture() {
  const unlock = () => {
    try {
      const ctx = getAudioContext();
      if (ctx.state === 'suspended') {
        ctx.resume();
      }
    } catch {}
    window.removeEventListener('click', unlock);
    window.removeEventListener('keydown', unlock);
    window.removeEventListener('touchstart', unlock);
  };
  window.addEventListener('click', unlock, { once: true });
  window.addEventListener('keydown', unlock, { once: true });
  window.addEventListener('touchstart', unlock, { once: true });
}

export function isAudioMuted(): boolean {
  return localStorage.getItem('railsync_alarm_muted') === 'true';
}

export function setAudioMuted(muted: boolean) {
  localStorage.setItem('railsync_alarm_muted', muted ? 'true' : 'false');
  if (muted) {
    stopAlarmSound();
  }
}

let pendingAlarmType: 'emergency' | 'alarm' | 'warning' | 'chime' | null = null;

export function stopAlarmSound() {
  pendingAlarmType = null;
  if (alarmInterval) {
    clearInterval(alarmInterval);
    alarmInterval = null;
  }
  activeOscillators.forEach(({ osc, gain }) => {
    try {
      gain.gain.exponentialRampToValueAtTime(0.0001, (audioCtx?.currentTime || 0) + 0.05);
      setTimeout(() => {
        try {
          osc.stop();
          osc.disconnect();
        } catch {}
      }, 60);
    } catch {
      try {
        osc.stop();
        osc.disconnect();
      } catch {}
    }
  });
  activeOscillators = [];
}

/**
 * Play a synthesized sound alert based on alert severity.
 * - 'emergency': Alternating dual-frequency industrial railway siren (repeating)
 * - 'alarm': Urgent 3-pulse beep cluster (repeating)
 * - 'warning': Dual amber warning chime
 * - 'chime': Pleasant resolution chime
 */
export function playAlarmSound(type: 'emergency' | 'alarm' | 'warning' | 'chime' = 'alarm') {
  if (isAudioMuted()) return;
  stopAlarmSound();
  pendingAlarmType = type;

  try {
    const ctx = getAudioContext();

    if (ctx.state === 'suspended') {
      const resumeAndPlay = () => {
        ctx.resume().then(() => {
          if (pendingAlarmType) {
            playAlarmSound(pendingAlarmType);
          }
        }).catch(() => {});
        window.removeEventListener('click', resumeAndPlay);
        window.removeEventListener('pointerdown', resumeAndPlay);
        window.removeEventListener('keydown', resumeAndPlay);
      };
      window.addEventListener('click', resumeAndPlay, { once: true });
      window.addEventListener('pointerdown', resumeAndPlay, { once: true });
      window.addEventListener('keydown', resumeAndPlay, { once: true });
    }

    if (type === 'emergency') {
      // Alternating 880Hz / 660Hz two-tone railway siren pulse
      let state = false;
      const playTone = () => {
        const freq = state ? 880 : 660;
        state = !state;

        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(freq, ctx.currentTime);

        // Low-pass filter to give rich industrial siren tone
        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(1400, ctx.currentTime);

        gain.gain.setValueAtTime(0.25, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.22);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(ctx.destination);

        osc.start();
        osc.stop(ctx.currentTime + 0.24);
      };

      playTone();
      alarmInterval = setInterval(playTone, 260);

    } else if (type === 'alarm') {
      // Triple urgent beep cluster (800Hz)
      const playBeepTriple = () => {
        [0, 0.12, 0.24].forEach((offset) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(800, ctx.currentTime + offset);

          gain.gain.setValueAtTime(0.3, ctx.currentTime + offset);
          gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + offset + 0.09);

          osc.connect(gain);
          gain.connect(ctx.destination);

          osc.start(ctx.currentTime + offset);
          osc.stop(ctx.currentTime + offset + 0.1);
        });
      };

      playBeepTriple();
      alarmInterval = setInterval(playBeepTriple, 800);

    } else if (type === 'warning') {
      // Dual warning chime (587Hz to 740Hz)
      const playChime = () => {
        [
          { freq: 587.33, start: 0, dur: 0.2 },
          { freq: 739.99, start: 0.15, dur: 0.3 },
        ].forEach(({ freq, start, dur }) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, ctx.currentTime + start);

          gain.gain.setValueAtTime(0.2, ctx.currentTime + start);
          gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + start + dur);

          osc.connect(gain);
          gain.connect(ctx.destination);

          osc.start(ctx.currentTime + start);
          osc.stop(ctx.currentTime + start + dur + 0.05);
        });
      };
      playChime();
      alarmInterval = setInterval(playChime, 1500);

    } else {
      // Chime: 523Hz -> 659Hz single pleasant notification
      [
        { freq: 523.25, start: 0, dur: 0.25 },
        { freq: 659.25, start: 0.18, dur: 0.4 },
      ].forEach(({ freq, start, dur }) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, ctx.currentTime + start);

        gain.gain.setValueAtTime(0.2, ctx.currentTime + start);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + start + dur);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(ctx.currentTime + start);
        osc.stop(ctx.currentTime + start + dur + 0.05);
      });
    }
  } catch (err) {
    console.warn('Unable to play alarm audio:', err);
  }
}

export function testAlarmSound() {
  playAlarmSound('emergency');
  setTimeout(() => {
    stopAlarmSound();
  }, 2200);
}
