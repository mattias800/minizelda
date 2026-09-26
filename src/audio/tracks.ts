import type { TrackName } from "../world/types";

export type Wave = "pulse12" | "pulse25" | "pulse50" | "triangle" | "noise";

export interface Channel {
  wave: Wave;
  volume: number;
  notes: string;
  /** Fraction of each note's length that is actually sounded (staccato < 1). */
  gate?: number;
}

export interface Track {
  bpm: number;
  loop: boolean;
  channels: Channel[];
}

export type JingleName = "item" | "secret" | "fanfare" | "gameover" | "heart_container";
export type SongName = TrackName | "ending" | JingleName;

// All music below is original, written for this game in a classic 8-bit adventure style.

const OVERWORLD: Track = {
  bpm: 140,
  loop: true,
  channels: [
    {
      wave: "pulse25",
      volume: 0.22,
      gate: 0.92,
      notes: `
        A4:6 E4:2 A4:4 B4:2 C5:2 | D5:6 C5:2 B4:4 G4:4 | A4:6 E4:2 A4:4 C5:2 E5:2 | D5:8 -:4 E5:4 |
        F5:6 E5:2 D5:4 C5:4 | B4:6 C5:2 D5:4 G4:4 | A4:4 C5:4 B4:4 G#4:4 | A4:12 -:4 |
        C5:4 C5:2 D5:2 E5:4 G5:4 | F5:6 E5:2 D5:8 | B4:4 B4:2 C5:2 D5:4 F5:4 | E5:6 D5:2 C5:8 |
        A4:4 A4:2 B4:2 C5:4 E5:4 | D5:6 C5:2 B4:4 E5:4 | C5:4 B4:4 A4:4 G#4:4 | A4:8 E4:4 G#4:4`,
    },
    {
      wave: "pulse50",
      volume: 0.08,
      gate: 0.95,
      notes: `
        E4:8 E4:8 | D4:8 B3:8 | E4:8 C4:8 | B3:8 D4:8 |
        C4:8 A3:8 | D4:8 B3:8 | C4:8 B3:8 | C4:12 -:4 |
        E4:8 G4:8 | A4:8 F4:8 | D4:8 G4:8 | G4:8 E4:8 |
        E4:8 C4:8 | D4:8 B3:8 | C4:8 B3:8 | C4:8 B3:8`,
    },
    {
      wave: "triangle",
      volume: 0.3,
      gate: 0.8,
      notes: `
        A2:2 A3:2 A2:2 A3:2 A2:2 A3:2 A2:2 A3:2 | G2:2 G3:2 G2:2 G3:2 G2:2 G3:2 G2:2 G3:2 |
        A2:2 A3:2 A2:2 A3:2 A2:2 A3:2 A2:2 A3:2 | G2:2 G3:2 G2:2 G3:2 G2:2 G3:2 G2:2 G3:2 |
        F2:2 F3:2 F2:2 F3:2 F2:2 F3:2 F2:2 F3:2 | G2:2 G3:2 G2:2 G3:2 G2:2 G3:2 G2:2 G3:2 |
        E2:2 E3:2 E2:2 E3:2 E2:2 E3:2 E2:2 E3:2 | A2:2 A3:2 A2:2 A3:2 A2:2 A3:2 A2:2 A3:2 |
        C3:2 C4:2 C3:2 C4:2 C3:2 C4:2 C3:2 C4:2 | F2:2 F3:2 F2:2 F3:2 F2:2 F3:2 F2:2 F3:2 |
        G2:2 G3:2 G2:2 G3:2 G2:2 G3:2 G2:2 G3:2 | C3:2 C4:2 C3:2 C4:2 C3:2 C4:2 C3:2 C4:2 |
        A2:2 A3:2 A2:2 A3:2 A2:2 A3:2 A2:2 A3:2 | E2:2 E3:2 E2:2 E3:2 E2:2 E3:2 E2:2 E3:2 |
        A2:2 A3:2 A2:2 A3:2 E2:2 E3:2 E2:2 E3:2 | A2:2 A3:2 A2:2 A3:2 E2:2 E3:2 E2:2 E3:2`,
    },
    {
      wave: "noise",
      volume: 0.12,
      notes: Array(16).fill("k:2 h:2 s:2 h:2 k:2 k:2 s:2 h:2").join(" | "),
    },
  ],
};

const DUNGEON: Track = {
  bpm: 100,
  loop: true,
  channels: [
    {
      wave: "pulse25",
      volume: 0.16,
      gate: 0.9,
      notes: `
        D5:4 A4:4 F5:4 E5:4 | D5:4 C#5:4 A4:8 | Bb4:4 F4:4 D5:4 C5:4 | A4:12 -:4 |
        D5:4 A4:4 F5:4 G5:4 | A5:4 G5:4 F5:4 E5:4 | F5:4 E5:4 D5:4 C#5:4 | D5:12 -:4`,
    },
    {
      wave: "pulse50",
      volume: 0.07,
      gate: 0.7,
      notes: `
        ${"D4:1 F4:1 A4:1 F4:1 ".repeat(4)} | ${"C#4:1 E4:1 A4:1 E4:1 ".repeat(4)} |
        ${"D4:1 F4:1 Bb4:1 F4:1 ".repeat(4)} | ${"C#4:1 E4:1 A4:1 E4:1 ".repeat(4)} |
        ${"D4:1 F4:1 A4:1 F4:1 ".repeat(4)} | ${"C4:1 E4:1 G4:1 E4:1 ".repeat(4)} |
        ${"D4:1 G4:1 Bb4:1 G4:1 ".repeat(2)} ${"C#4:1 E4:1 A4:1 E4:1 ".repeat(2)} | ${"D4:1 F4:1 A4:1 F4:1 ".repeat(4)}`,
    },
    {
      wave: "triangle",
      volume: 0.32,
      gate: 0.95,
      notes: "D2:16 | A1:16 | Bb1:16 | A1:16 | D2:16 | C2:16 | G1:8 A1:8 | D2:16",
    },
  ],
};

const BOSS: Track = {
  bpm: 165,
  loop: true,
  channels: [
    {
      wave: "pulse25",
      volume: 0.17,
      gate: 0.8,
      notes: `
        E4:2 G4:2 B4:2 E5:2 D#5:2 B4:2 G4:2 B4:2 | E4:2 G4:2 C5:2 E5:2 D#5:2 C5:2 A4:2 F#4:2 |
        E4:2 G4:2 B4:2 E5:2 G5:2 F#5:2 E5:2 D#5:2 | E5:4 B4:4 C5:4 D#5:4`,
    },
    {
      wave: "pulse50",
      volume: 0.06,
      notes: "B3:16 | C4:16 | B3:16 | B3:8 A3:8",
    },
    {
      wave: "triangle",
      volume: 0.32,
      gate: 0.7,
      notes: `
        E2:2 E2:2 E3:2 E2:2 E2:2 E2:2 E3:2 E2:2 | C2:2 C2:2 C3:2 C2:2 C2:2 C2:2 C3:2 C2:2 |
        E2:2 E2:2 E3:2 E2:2 E2:2 E2:2 E3:2 E2:2 | B1:2 B1:2 B2:2 B1:2 B1:2 B1:2 B2:2 B1:2`,
    },
    { wave: "noise", volume: 0.12, notes: Array(4).fill("k:2 h:2 s:2 h:2 k:2 h:2 s:2 s:2").join(" | ") },
  ],
};

const CAVE: Track = {
  bpm: 84,
  loop: true,
  channels: [
    {
      wave: "pulse50",
      volume: 0.06,
      gate: 0.6,
      notes: `
        ${"C4:1 G4:1 E5:1 G4:1 ".repeat(4)} | ${"A3:1 E4:1 C5:1 E4:1 ".repeat(4)} |
        ${"F3:1 C4:1 A4:1 C4:1 ".repeat(4)} | ${"G3:1 D4:1 B4:1 D4:1 ".repeat(4)}`,
    },
    { wave: "triangle", volume: 0.2, notes: "C3:16 | A2:16 | F2:16 | G2:16" },
  ],
};

const TITLE: Track = {
  bpm: 96,
  loop: true,
  channels: [
    {
      wave: "pulse25",
      volume: 0.2,
      gate: 0.95,
      notes: `
        A4:8 E5:8 | D5:4 C5:4 B4:4 C5:4 | A4:8 E4:8 | F4:4 G4:4 A4:8 |
        F5:8 E5:8 | D5:4 C5:4 B4:4 G4:4 | A4:12 B4:2 C5:2 | A4:16`,
    },
    {
      wave: "pulse50",
      volume: 0.06,
      gate: 0.7,
      notes: `
        ${"A3:2 C4:2 E4:2 C4:2 ".repeat(2)} | ${"G3:2 B3:2 D4:2 B3:2 ".repeat(2)} |
        ${"A3:2 C4:2 E4:2 C4:2 ".repeat(2)} | ${"F3:2 A3:2 C4:2 A3:2 ".repeat(2)} |
        ${"D4:2 F4:2 A4:2 F4:2 ".repeat(2)} | ${"G3:2 B3:2 D4:2 B3:2 ".repeat(2)} |
        ${"E3:2 G#3:2 B3:2 G#3:2 ".repeat(2)} | ${"A3:2 C4:2 E4:2 C4:2 ".repeat(2)}`,
    },
    { wave: "triangle", volume: 0.3, notes: "A2:16 | G2:16 | A2:16 | F2:16 | D2:16 | G2:16 | E2:16 | A2:16" },
  ],
};

const TRIFORCE_ROOM: Track = {
  bpm: 76,
  loop: true,
  channels: [
    {
      wave: "pulse50",
      volume: 0.07,
      gate: 0.8,
      notes: `
        ${"C4:1 E4:1 G4:1 B4:1 ".repeat(4)} | ${"F3:1 A3:1 C4:1 E4:1 ".repeat(4)} |
        ${"A3:1 C4:1 E4:1 G4:1 ".repeat(4)} | ${"G3:1 B3:1 D4:1 F#4:1 ".repeat(4)}`,
    },
    { wave: "pulse25", volume: 0.1, notes: "G5:12 E5:4 | A5:16 | E5:12 C5:4 | D5:16" },
    { wave: "triangle", volume: 0.24, notes: "C3:16 | F2:16 | A2:16 | G2:16" },
  ],
};

const ENDING: Track = { ...TITLE, bpm: 110 };

// ---------------------------------------------------------------------------
// Jingles (one-shot)
// ---------------------------------------------------------------------------

const ITEM: Track = {
  bpm: 150,
  loop: false,
  channels: [
    { wave: "pulse25", volume: 0.22, notes: "C5:2 E5:2 G5:2 C6:10" },
    { wave: "pulse50", volume: 0.08, notes: "E4:2 G4:2 C5:2 E5:10" },
    { wave: "triangle", volume: 0.3, notes: "C3:6 C3:10" },
  ],
};

const HEART_CONTAINER: Track = {
  bpm: 150,
  loop: false,
  channels: [
    { wave: "pulse25", volume: 0.22, notes: "A4:2 C#5:2 E5:2 A5:4 E5:2 A5:8" },
    { wave: "triangle", volume: 0.3, notes: "A2:6 A2:4 E3:2 A3:8" },
  ],
};

const SECRET: Track = {
  bpm: 180,
  loop: false,
  channels: [
    { wave: "pulse25", volume: 0.18, notes: "E5:1 G5:1 B5:1 E6:1 F5:1 A5:1 C6:1 F6:1 G5:1 B5:1 D6:1 G6:6" },
    { wave: "triangle", volume: 0.25, notes: "E3:4 F3:4 G3:9" },
  ],
};

const FANFARE: Track = {
  bpm: 132,
  loop: false,
  channels: [
    {
      wave: "pulse25",
      volume: 0.22,
      notes: "G4:2 C5:2 E5:2 G5:6 F5:2 A5:2 G5:8 E5:2 F5:2 G5:2 C6:14",
    },
    { wave: "pulse50", volume: 0.08, notes: "E4:6 E4:6 F4:4 E4:8 C5:6 E5:14" },
    { wave: "triangle", volume: 0.3, notes: "C3:6 C3:6 F3:4 C3:8 G2:6 C3:14" },
    { wave: "noise", volume: 0.1, notes: "k:6 k:6 s:4 k:8 s:2 s:2 s:2 k:14" },
  ],
};

const GAME_OVER: Track = {
  bpm: 80,
  loop: false,
  channels: [
    { wave: "pulse25", volume: 0.18, notes: "E5:4 C5:4 A4:4 F4:4 E4:4 D4:4 C4:12" },
    { wave: "triangle", volume: 0.28, notes: "A2:8 F2:8 G2:8 C2:12" },
  ],
};

export const TRACKS: Record<SongName, Track> = {
  title: TITLE,
  overworld: OVERWORLD,
  cave: CAVE,
  dungeon: DUNGEON,
  boss: BOSS,
  triforce: TRIFORCE_ROOM,
  ending: ENDING,
  item: ITEM,
  heart_container: HEART_CONTAINER,
  secret: SECRET,
  fanfare: FANFARE,
  gameover: GAME_OVER,
};
