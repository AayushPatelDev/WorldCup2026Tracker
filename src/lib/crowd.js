// Synthetic crowd roar — band-passed noise with a swell envelope, no audio file.
// Browsers only allow audio after a user gesture; if the context is still
// suspended we bail silently rather than fight the autoplay policy.
let ctx = null;
let lastPlay = 0;

export function crowdCheer() {
  try {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    const now = Date.now();
    if (now - lastPlay < 2500) return; // don't stack roars
    ctx ||= new AC();
    if (ctx.state === 'suspended') ctx.resume();
    if (ctx.state !== 'running') return;
    lastPlay = now;

    const dur = 1.9;
    const buf = ctx.createBuffer(1, Math.floor(ctx.sampleRate * dur), ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;

    const src = ctx.createBufferSource();
    src.buffer = buf;
    const bp = ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.value = 850;
    bp.Q.value = 0.6;
    const gain = ctx.createGain();
    const t = ctx.currentTime;
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(0.14, t + 0.5);
    gain.gain.exponentialRampToValueAtTime(0.06, t + 1.1);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(bp);
    bp.connect(gain);
    gain.connect(ctx.destination);
    src.start();
    src.stop(t + dur);
  } catch {
    /* audio unavailable — easter egg silently skipped */
  }
}
