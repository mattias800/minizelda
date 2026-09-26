/**
 * Music is written as whitespace separated tokens: `<pitch>:<length>`, where length is in
 * sixteenth notes. Pitch is a note name with octave (C4, F#3, Bb2) or `-` for a rest.
 * Noise channels use drum names instead of pitches: k (kick), s (snare), h (hat).
 */

export interface NoteEvent {
  /** Frequency in Hz, or a drum name for noise channels, or null for a rest. */
  pitch: number | string | null;
  /** Length in sixteenth notes. */
  length: number;
}

const SEMITONES: Record<string, number> = { C: -9, D: -7, E: -5, F: -4, G: -2, A: 0, B: 2 };

/** Converts "A4" / "C#5" / "Bb3" to Hz (A4 = 440). */
export function noteToHz(name: string): number {
  const m = /^([A-G])([#b]?)(-?\d)$/.exec(name);
  if (!m) throw new Error(`Bad note '${name}'`);
  const [, letter, accidental, octave] = m;
  let semis = SEMITONES[letter] + (Number(octave) - 4) * 12;
  if (accidental === "#") semis += 1;
  if (accidental === "b") semis -= 1;
  return 440 * Math.pow(2, semis / 12);
}

export const DRUMS = ["k", "s", "h"] as const;

export function parseNotes(source: string): NoteEvent[] {
  return source
    .trim()
    .split(/\s+/)
    .filter((t) => t.length > 0 && t !== "|")
    .map((token) => {
      const [p, len] = token.split(":");
      const length = Number(len);
      if (!Number.isFinite(length) || length <= 0) throw new Error(`Bad note length in '${token}'`);
      if (p === "-") return { pitch: null, length };
      if ((DRUMS as readonly string[]).includes(p)) return { pitch: p, length };
      return { pitch: noteToHz(p), length };
    });
}

export function totalLength(events: readonly NoteEvent[]): number {
  return events.reduce((sum, e) => sum + e.length, 0);
}
