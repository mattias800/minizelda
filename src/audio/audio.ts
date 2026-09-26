import { parseNotes, type NoteEvent } from "./notes";
import { TRACKS, type SongName, type Track, type Wave } from "./tracks";

export type SfxName =
  | "sword"
  | "beam"
  | "hit"
  | "kill"
  | "hurt"
  | "rupee"
  | "heart"
  | "key"
  | "unlock"
  | "shutter"
  | "boomerang"
  | "shield"
  | "text"
  | "lowHealth"
  | "stairs"
  | "fireball"
  | "roar"
  | "cut"
  | "error"
  | "pause"
  | "bossHit"
  | "bossDie"
  | "die"
  | "select"
  | "fairy";

interface ScheduledChannel {
  wave: Wave;
  volume: number;
  gate: number;
  events: NoteEvent[];
  index: number;
  nextTime: number;
  done: boolean;
}

interface PlayingSong {
  name: SongName;
  track: Track;
  output: GainNode;
  channels: ScheduledChannel[];
  onEnd?: () => void;
}

const LOOKAHEAD = 0.15;
const TICK_MS = 25;

/**
 * Tiny chiptune engine on top of WebAudio: a lookahead sequencer for music and a handful
 * of synthesized sound effects. The AudioContext is created lazily on the first user
 * gesture, as browsers require.
 */
export class AudioEngine {
  private ctx?: AudioContext;
  private master!: GainNode;
  private musicBus!: GainNode;
  private sfxBus!: GainNode;
  private noise!: AudioBuffer;
  private waves = new Map<Wave, PeriodicWave>();
  private song?: PlayingSong;
  private timer?: number;
  private parsed = new Map<string, NoteEvent[]>();
  /** Song requested before audio was unlocked; started as soon as it is. */
  private pendingSong?: SongName;
  muted = false;

  /** Must be called from a user gesture (key press) at least once. */
  unlock(): void {
    if (!this.ctx) {
      const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!Ctor) return;
      this.ctx = new Ctor();
      this.master = this.ctx.createGain();
      this.master.gain.value = this.muted ? 0 : 0.6;
      this.master.connect(this.ctx.destination);
      this.musicBus = this.ctx.createGain();
      this.musicBus.connect(this.master);
      this.sfxBus = this.ctx.createGain();
      this.sfxBus.gain.value = 0.9;
      this.sfxBus.connect(this.master);
      this.noise = this.makeNoise();
      this.timer = window.setInterval(() => this.schedule(), TICK_MS);
    }
    if (this.ctx.state === "suspended") void this.ctx.resume();
    if (this.pendingSong) {
      const name = this.pendingSong;
      this.pendingSong = undefined;
      this.playMusic(name);
    }
  }

  toggleMute(): void {
    this.muted = !this.muted;
    if (this.ctx) this.master.gain.setTargetAtTime(this.muted ? 0 : 0.6, this.ctx.currentTime, 0.02);
  }

  get currentSong(): SongName | undefined {
    return this.song?.name ?? this.pendingSong;
  }

  /** Starts a looping song unless it's already playing. */
  playMusic(name: SongName): void {
    if (this.currentSong === name) return;
    this.startSong(name);
  }

  /** Plays a one-shot jingle, then continues with `then` (if given). */
  playJingle(name: SongName, then?: SongName): void {
    this.startSong(name, () => {
      if (then) this.startSong(then);
    });
  }

  stopMusic(): void {
    this.pendingSong = undefined;
    if (!this.song || !this.ctx) {
      this.song = undefined;
      return;
    }
    const out = this.song.output;
    out.gain.setTargetAtTime(0, this.ctx.currentTime, 0.02);
    window.setTimeout(() => out.disconnect(), 200);
    this.song = undefined;
  }

  private startSong(name: SongName, onEnd?: () => void): void {
    this.stopMusic();
    if (!this.ctx) {
      this.pendingSong = name;
      return;
    }
    const track = TRACKS[name];
    const output = this.ctx.createGain();
    output.connect(this.musicBus);
    const start = this.ctx.currentTime + 0.05;
    this.song = {
      name,
      track,
      output,
      onEnd,
      channels: track.channels.map((c) => ({
        wave: c.wave,
        volume: c.volume,
        gate: c.gate ?? 0.9,
        events: this.parse(c.notes),
        index: 0,
        nextTime: start,
        done: false,
      })),
    };
    this.schedule();
  }

  private parse(notes: string): NoteEvent[] {
    let events = this.parsed.get(notes);
    if (!events) {
      events = parseNotes(notes);
      this.parsed.set(notes, events);
    }
    return events;
  }

  private schedule(): void {
    const ctx = this.ctx;
    const song = this.song;
    if (!ctx || !song) return;
    const sixteenth = 60 / song.track.bpm / 4;
    for (const ch of song.channels) {
      while (!ch.done && ch.nextTime < ctx.currentTime + LOOKAHEAD) {
        const ev = ch.events[ch.index];
        const dur = ev.length * sixteenth;
        if (ev.pitch !== null) this.playNote(song.output, ch, ev.pitch, ch.nextTime, dur);
        ch.nextTime += dur;
        ch.index++;
        if (ch.index >= ch.events.length) {
          if (song.track.loop) ch.index = 0;
          else ch.done = true;
        }
      }
    }
    if (!song.track.loop && song.channels.every((c) => c.done)) {
      const endAt = Math.max(...song.channels.map((c) => c.nextTime));
      const onEnd = song.onEnd;
      song.onEnd = undefined;
      if (onEnd) {
        window.setTimeout(() => {
          if (this.song === song) {
            this.song = undefined;
            onEnd();
          }
        }, Math.max(0, (endAt - ctx.currentTime) * 1000));
      }
    }
  }

  private playNote(out: AudioNode, ch: ScheduledChannel, pitch: number | string, t: number, dur: number): void {
    const ctx = this.ctx!;
    if (typeof pitch === "string") {
      this.drum(out, pitch, t, ch.volume);
      return;
    }
    const osc = ctx.createOscillator();
    this.setWave(osc, ch.wave);
    osc.frequency.value = pitch;
    const gain = ctx.createGain();
    const len = Math.max(0.03, dur * ch.gate);
    const peak = ch.volume;
    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(peak, t + 0.005);
    gain.gain.linearRampToValueAtTime(peak * (ch.wave === "triangle" ? 1 : 0.7), t + Math.min(0.08, len));
    gain.gain.setValueAtTime(peak * (ch.wave === "triangle" ? 1 : 0.7), t + len);
    gain.gain.linearRampToValueAtTime(0, t + len + 0.02);
    osc.connect(gain).connect(out);
    osc.start(t);
    osc.stop(t + len + 0.05);
  }

  private drum(out: AudioNode, kind: string, t: number, volume: number): void {
    const ctx = this.ctx!;
    if (kind === "k") {
      const osc = ctx.createOscillator();
      osc.type = "sine";
      osc.frequency.setValueAtTime(160, t);
      osc.frequency.exponentialRampToValueAtTime(40, t + 0.12);
      const g = ctx.createGain();
      g.gain.setValueAtTime(volume * 3, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.14);
      osc.connect(g).connect(out);
      osc.start(t);
      osc.stop(t + 0.15);
      return;
    }
    const src = ctx.createBufferSource();
    src.buffer = this.noise;
    const filter = ctx.createBiquadFilter();
    const g = ctx.createGain();
    const len = kind === "s" ? 0.12 : 0.04;
    filter.type = kind === "s" ? "bandpass" : "highpass";
    filter.frequency.value = kind === "s" ? 1800 : 7000;
    g.gain.setValueAtTime(volume * (kind === "s" ? 1.4 : 0.7), t);
    g.gain.exponentialRampToValueAtTime(0.001, t + len);
    src.connect(filter).connect(g).connect(out);
    src.start(t, Math.random());
    src.stop(t + len + 0.01);
  }

  private setWave(osc: OscillatorNode, wave: Wave): void {
    if (wave === "triangle") {
      osc.type = "triangle";
      return;
    }
    if (wave === "noise") throw new Error("Noise is not an oscillator wave");
    let pw = this.waves.get(wave);
    if (!pw) {
      const duty = wave === "pulse12" ? 0.125 : wave === "pulse25" ? 0.25 : 0.5;
      // Fourier series of a pulse wave with the given duty cycle.
      const n = 64;
      const real = new Float32Array(n);
      const imag = new Float32Array(n);
      for (let i = 1; i < n; i++) real[i] = (2 / (i * Math.PI)) * Math.sin(i * Math.PI * duty);
      pw = this.ctx!.createPeriodicWave(real, imag);
      this.waves.set(wave, pw);
    }
    osc.setPeriodicWave(pw);
  }

  private makeNoise(): AudioBuffer {
    const ctx = this.ctx!;
    const buffer = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
    return buffer;
  }

  // -------------------------------------------------------------------------
  // Sound effects
  // -------------------------------------------------------------------------

  sfx(name: SfxName): void {
    if (!this.ctx || this.ctx.state !== "running") return;
    const t = this.ctx.currentTime;
    switch (name) {
      case "sword":
        this.noiseBurst(t, 0.1, 0.35, "bandpass", 3000, 800);
        this.tone(t, "pulse25", 900, 300, 0.08, 0.12);
        break;
      case "beam":
        for (let i = 0; i < 3; i++) this.tone(t + i * 0.05, "pulse25", 500 + i * 200, 1400, 0.05, 0.1);
        break;
      case "hit":
        this.tone(t, "pulse50", 700, 150, 0.1, 0.18);
        break;
      case "bossHit":
        this.tone(t, "pulse50", 400, 60, 0.18, 0.25);
        this.noiseBurst(t, 0.15, 0.3, "lowpass", 1200, 300);
        break;
      case "kill":
        this.noiseBurst(t, 0.28, 0.4, "lowpass", 4000, 200);
        this.tone(t, "pulse25", 500, 60, 0.2, 0.12);
        break;
      case "hurt":
        this.tone(t, "pulse50", 300, 70, 0.25, 0.25);
        this.tone(t + 0.04, "pulse25", 250, 60, 0.2, 0.15);
        break;
      case "rupee":
        this.tone(t, "pulse25", 1568, 1568, 0.05, 0.14);
        this.tone(t + 0.06, "pulse25", 2093, 2093, 0.09, 0.14);
        break;
      case "heart":
        this.tone(t, "triangle", 880, 880, 0.06, 0.35);
        this.tone(t + 0.07, "triangle", 1320, 1320, 0.1, 0.35);
        break;
      case "key":
        [1047, 1319, 1568, 2093].forEach((f, i) => this.tone(t + i * 0.05, "pulse25", f, f, 0.05, 0.13));
        break;
      case "unlock":
      case "shutter":
        this.noiseBurst(t, 0.2, 0.5, "lowpass", 800, 100);
        this.tone(t, "triangle", 120, 50, 0.2, 0.5);
        break;
      case "boomerang":
        this.tone(t, "pulse12", 700, 900, 0.04, 0.06);
        break;
      case "shield":
        this.tone(t, "pulse25", 2400, 1800, 0.04, 0.12);
        break;
      case "text":
        this.tone(t, "pulse50", 1200, 1200, 0.02, 0.05);
        break;
      case "lowHealth":
        this.tone(t, "pulse50", 1500, 1500, 0.06, 0.05);
        break;
      case "stairs":
        [600, 500, 400, 300, 250, 200].forEach((f, i) => this.tone(t + i * 0.06, "pulse25", f, f * 0.9, 0.05, 0.12));
        break;
      case "fireball":
        this.noiseBurst(t, 0.3, 0.25, "bandpass", 600, 1800);
        break;
      case "roar":
        this.noiseBurst(t, 0.6, 0.45, "lowpass", 500, 150);
        this.tone(t, "pulse50", 110, 70, 0.6, 0.2);
        break;
      case "cut":
        this.noiseBurst(t, 0.12, 0.3, "highpass", 2000, 4000);
        break;
      case "error":
        this.tone(t, "pulse50", 110, 100, 0.25, 0.18);
        break;
      case "pause":
      case "select":
        this.tone(t, "pulse25", 988, 988, 0.05, 0.15);
        this.tone(t + 0.06, "pulse25", 1319, 1319, 0.07, 0.15);
        break;
      case "bossDie":
        for (let i = 0; i < 6; i++) this.noiseBurst(t + i * 0.12, 0.2, 0.45, "lowpass", 3000, 100);
        this.tone(t, "pulse50", 400, 40, 0.8, 0.2);
        break;
      case "die":
        [784, 740, 698, 659, 622, 587, 554, 523].forEach((f, i) => this.tone(t + i * 0.08, "pulse25", f, f, 0.07, 0.14));
        break;
      case "fairy":
        [1319, 1568, 1976, 2637].forEach((f, i) => this.tone(t + i * 0.04, "triangle", f, f, 0.05, 0.25));
        break;
    }
  }

  private tone(t: number, wave: Wave, from: number, to: number, dur: number, vol: number): void {
    const ctx = this.ctx!;
    const osc = ctx.createOscillator();
    this.setWave(osc, wave);
    osc.frequency.setValueAtTime(from, t);
    if (to !== from) osc.frequency.exponentialRampToValueAtTime(to, t + dur);
    const g = ctx.createGain();
    g.gain.setValueAtTime(vol, t);
    g.gain.setValueAtTime(vol, t + dur * 0.7);
    g.gain.linearRampToValueAtTime(0, t + dur);
    osc.connect(g).connect(this.sfxBus);
    osc.start(t);
    osc.stop(t + dur + 0.02);
  }

  private noiseBurst(t: number, dur: number, vol: number, type: BiquadFilterType, from: number, to: number): void {
    const ctx = this.ctx!;
    const src = ctx.createBufferSource();
    src.buffer = this.noise;
    const filter = ctx.createBiquadFilter();
    filter.type = type;
    filter.frequency.setValueAtTime(from, t);
    filter.frequency.exponentialRampToValueAtTime(to, t + dur);
    const g = ctx.createGain();
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    src.connect(filter).connect(g).connect(this.sfxBus);
    src.start(t, Math.random());
    src.stop(t + dur + 0.02);
  }

  dispose(): void {
    if (this.timer !== undefined) window.clearInterval(this.timer);
    void this.ctx?.close();
  }
}
