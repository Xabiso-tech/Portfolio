/* ==========================================================
   TECH'STAMENT — SOUND DESIGN

   There is not a single audio file in this project. Every
   sound is synthesised in the browser with the Web Audio API,
   which keeps the site light and means nothing has to be
   downloaded before the visitor can hear anything.

   The sounds
   ----------
     room      a low, almost subliminal hum of the room itself
     page      the dry whisper of paper being turned
     leather   the creak of a cover being opened
     chime     a small, warm bell for arriving somewhere

   Sound is OFF until the visitor asks for it. The Web Audio
   context is not created until that moment, which means the
   page never trips a browser's "autoplay" warning.
   ========================================================== */

export class SoundDesign {
  constructor() {
    this.context = null;
    this.master = null;
    this.roomGain = null;
    this.enabled = false;
    this.roomNodes = [];
  }

  /* ------------------------------------------------------------
     THE CONTEXT
     ------------------------------------------------------------ */

  /** Create the audio graph. Only called after a real gesture. */
  create() {
    if (this.context) return this.context;

    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return null;

    this.context = new AudioContextClass();

    this.master = this.context.createGain();
    this.master.gain.value = 0.0001;
    this.master.connect(this.context.destination);

    this.roomGain = this.context.createGain();
    this.roomGain.gain.value = 0;
    this.roomGain.connect(this.master);

    this.startRoomTone();

    return this.context;
  }

  /** Turn the sound on. */
  async enable() {
    const context = this.create();
    if (!context) return false;

    if (context.state === 'suspended') {
      await context.resume();
    }

    this.enabled = true;

    const now = context.currentTime;
    this.master.gain.cancelScheduledValues(now);
    this.master.gain.setValueAtTime(Math.max(this.master.gain.value, 0.0001), now);
    this.master.gain.exponentialRampToValueAtTime(0.5, now + 1.4);

    this.roomGain.gain.setValueAtTime(0, now);
    this.roomGain.gain.linearRampToValueAtTime(0.22, now + 2.5);

    return true;
  }

  /** Turn the sound off. */
  disable() {
    this.enabled = false;
    if (!this.context) return;

    const now = this.context.currentTime;
    this.master.gain.cancelScheduledValues(now);
    this.master.gain.setValueAtTime(this.master.gain.value, now);
    this.master.gain.exponentialRampToValueAtTime(0.0001, now + 0.6);
    this.roomGain.gain.cancelScheduledValues(now);
    this.roomGain.gain.setValueAtTime(this.roomGain.gain.value, now);
    this.roomGain.gain.linearRampToValueAtTime(0, now + 0.6);
  }

  /** Turn the sound on or off. */
  async toggle() {
    if (this.enabled) {
      this.disable();
      return false;
    }
    await this.enable();
    return this.enabled;
  }

  /* ------------------------------------------------------------
     THE SOUNDS
     ------------------------------------------------------------ */

  /** A continuous, very quiet noise source shaped like a room. */
  startRoomTone() {
    const context = this.context;
    const seconds = 4;
    const buffer = context.createBuffer(1, context.sampleRate * seconds, context.sampleRate);
    const data = buffer.getChannelData(0);

    let last = 0;
    for (let i = 0; i < data.length; i += 1) {
      /* Brown-ish noise: a gentle low-pass on white noise. */
      const white = Math.random() * 2 - 1;
      last = (last + 0.02 * white) / 1.02;
      data[i] = last * 3.2;
    }

    const source = context.createBufferSource();
    source.buffer = buffer;
    source.loop = true;

    const filter = context.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 220;
    filter.Q.value = 0.6;

    const gain = context.createGain();
    gain.gain.value = 0.5;

    source.connect(filter);
    filter.connect(gain);
    gain.connect(this.roomGain);
    source.start();

    this.roomNodes.push(source, filter, gain);
  }

  /** A short burst of filtered noise: paper moving. */
  page() {
    if (!this.enabled || !this.context) return;

    const context = this.context;
    const now = context.currentTime;

    const length = Math.floor(context.sampleRate * 0.55);
    const buffer = context.createBuffer(1, length, context.sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < length; i += 1) {
      data[i] = (Math.random() * 2 - 1) * (1 - i / length);
    }

    const source = context.createBufferSource();
    source.buffer = buffer;

    const filter = context.createBiquadFilter();
    filter.type = 'bandpass';
    filter.Q.value = 0.8;
    filter.frequency.setValueAtTime(700, now);
    filter.frequency.exponentialRampToValueAtTime(2600, now + 0.28);
    filter.frequency.exponentialRampToValueAtTime(900, now + 0.55);

    const gain = context.createGain();
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.28, now + 0.06);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.55);

    source.connect(filter);
    filter.connect(gain);
    gain.connect(this.master);
    source.start(now);
    source.stop(now + 0.6);
  }

  /** A low creak: leather, cloth and a board all at once. */
  leather() {
    if (!this.enabled || !this.context) return;

    const context = this.context;
    const now = context.currentTime;

    const length = Math.floor(context.sampleRate * 1.1);
    const buffer = context.createBuffer(1, length, context.sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < length; i += 1) {
      const t = i / length;
      data[i] = (Math.random() * 2 - 1) * Math.sin(Math.PI * t) ** 1.6;
    }

    const source = context.createBufferSource();
    source.buffer = buffer;

    const filter = context.createBiquadFilter();
    filter.type = 'bandpass';
    filter.Q.value = 5.5;
    filter.frequency.setValueAtTime(180, now);
    filter.frequency.exponentialRampToValueAtTime(520, now + 0.9);

    const gain = context.createGain();
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.5, now + 0.12);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 1.1);

    source.connect(filter);
    filter.connect(gain);
    gain.connect(this.master);
    source.start(now);
    source.stop(now + 1.2);
  }

  /** A small warm bell. */
  chime(base = 392) {
    if (!this.enabled || !this.context) return;

    const context = this.context;
    const now = context.currentTime;

    [1, 1.5, 2.02].forEach((ratio, index) => {
      const oscillator = context.createOscillator();
      oscillator.type = 'sine';
      oscillator.frequency.value = base * ratio;

      const gain = context.createGain();
      const peak = 0.16 / (index + 1);
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.exponentialRampToValueAtTime(peak, now + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 2.2 - index * 0.4);

      oscillator.connect(gain);
      gain.connect(this.master);
      oscillator.start(now);
      oscillator.stop(now + 2.4);
    });
  }

  /** Play a named sound. */
  play(name) {
    switch (name) {
      case 'page':
        this.page();
        break;
      case 'leather':
        this.leather();
        break;
      case 'chime':
        this.chime();
        break;
      case 'open':
        this.leather();
        window.setTimeout(() => this.chime(329.63), 700);
        break;
      default:
        break;
    }
  }

  dispose() {
    this.disable();
    this.roomNodes.forEach((node) => {
      try {
        node.stop?.();
      } catch (error) {
        /* A source that was never started cannot be stopped. */
      }
      node.disconnect?.();
    });
    this.roomNodes = [];
    this.context?.close();
    this.context = null;
  }
}
