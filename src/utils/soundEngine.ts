// Sound Engine using Web Audio API for rich meeting alarm chimes & feedback

let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext {
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    audioCtx = new AudioContextClass();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

/**
 * Plays a high-pitched double digital alarm chime for scheduled meeting alerts.
 */
export function playMeetingAlarmSound() {
  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;

    // Alarm pulse 1
    createChimePulse(ctx, now, 880, 0.25);
    createChimePulse(ctx, now + 0.15, 1174.66, 0.35);

    // Alarm pulse 2
    createChimePulse(ctx, now + 0.6, 880, 0.25);
    createChimePulse(ctx, now + 0.75, 1174.66, 0.45);
  } catch (err) {
    console.error('AudioContext playback error:', err);
  }
}

/**
 * Plays a 1-second test alarm chime so user can verify audio settings.
 */
export function playTestAlarmSound() {
  playMeetingAlarmSound();
}

/**
 * Plays an ascending celebratory chord when a meeting photo & log is completed!
 */
export function playCompletionVictorySound() {
  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;
    const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6

    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now + idx * 0.1);

      gain.gain.setValueAtTime(0.01, now + idx * 0.1);
      gain.gain.exponentialRampToValueAtTime(0.3, now + idx * 0.1 + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.1 + 0.4);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now + idx * 0.1);
      osc.stop(now + idx * 0.1 + 0.45);
    });
  } catch (err) {
    console.error('AudioContext victory error:', err);
  }
}

function createChimePulse(ctx: AudioContext, startTime: number, frequency: number, duration: number) {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = 'sine';
  osc.frequency.setValueAtTime(frequency, startTime);

  gain.gain.setValueAtTime(0.01, startTime);
  gain.gain.exponentialRampToValueAtTime(0.4, startTime + 0.03);
  gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start(startTime);
  osc.stop(startTime + duration + 0.05);
}
