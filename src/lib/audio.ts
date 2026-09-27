/** Quiet, filtered wind and softly modulated water. Created only by a user gesture. */
export class NatureAudio {
  private context: AudioContext | null = null;
  private gain: GainNode | null = null;
  private volume = 0.7;
  private muted = false;
  setVolume(volume: number, muted: boolean) {
    this.volume = volume;
    this.muted = muted;
    if (this.context && this.gain) {
      this.gain.gain.cancelScheduledValues(this.context.currentTime);
      this.gain.gain.setTargetAtTime(
        muted ? 0 : volume * 0.14,
        this.context.currentTime,
        0.04,
      );
    }
  }
  async start() {
    if (this.context) {
      await this.context.resume();
      return;
    }
    const context = new AudioContext();
    this.context = context;
    const buffer = context.createBuffer(
      1,
      context.sampleRate * 4,
      context.sampleRate,
    );
    const channel = buffer.getChannelData(0);
    let last = 0;
    for (let i = 0; i < channel.length; i++) {
      last = (last + Math.random() * 0.04 - 0.02) / 1.02;
      channel[i] = last * 3.5;
    }
    const noise = context.createBufferSource();
    noise.buffer = buffer;
    noise.loop = true;
    const filter = context.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = 850;
    const gain = context.createGain();
    this.gain = gain;
    gain.gain.setValueAtTime(0, context.currentTime);
    gain.gain.linearRampToValueAtTime(
      this.muted ? 0 : this.volume * 0.14,
      context.currentTime + 1.5,
    );
    noise.connect(filter).connect(gain).connect(context.destination);
    noise.start();
    await context.resume();
  }
  async stop() {
    if (this.context) await this.context.suspend();
  }
  dispose() {
    void this.context?.close().catch(() => {});
    this.context = null;
    this.gain = null;
  }
}

/** Owns browser resources only; timer policy and persisted preferences live in the store. */
export class AudioPlayback {
  private nature: NatureAudio | null = null;
  private media: HTMLAudioElement | null = null;
  private trackId: string | null = null;
  private objectUrl: string | null = null;
  private volume = 0.7;
  private muted = false;

  setVolume(volume: number, muted: boolean) {
    this.volume = volume;
    this.muted = muted;
    this.nature?.setVolume(volume, muted);
    if (this.media) {
      this.media.volume = volume;
      this.media.muted = muted;
    }
  }

  async play(track: { id: string; blob: Blob } | null, onError: () => void) {
    if (!track) {
      if (this.media) this.dispose();
      this.nature ??= new NatureAudio();
      this.nature.setVolume(this.volume, this.muted);
      await this.nature.start();
      return;
    }
    if (this.trackId !== track.id || !this.media) {
      this.dispose();
      this.objectUrl = URL.createObjectURL(track.blob);
      this.media = new Audio(this.objectUrl);
      this.trackId = track.id;
      this.media.loop = true;
      this.media.preload = "auto";
    }
    this.media.onerror = onError;
    this.media.volume = this.volume;
    this.media.muted = this.muted;
    await this.media.play();
  }

  pause() {
    this.media?.pause();
    void this.nature?.stop().catch(() => {});
  }

  dispose() {
    this.nature?.dispose();
    this.nature = null;
    if (this.media) {
      this.media.onerror = null;
      this.media.pause();
      this.media.removeAttribute("src");
      this.media.load();
      this.media = null;
    }
    if (this.objectUrl) URL.revokeObjectURL(this.objectUrl);
    this.objectUrl = null;
    this.trackId = null;
  }
}
