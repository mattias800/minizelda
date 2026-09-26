import { describe, expect, it } from "vitest";
import { noteToHz, parseNotes, totalLength } from "../src/audio/notes";
import { TRACKS } from "../src/audio/tracks";

describe("music", () => {
  it("converts note names to frequencies", () => {
    expect(noteToHz("A4")).toBeCloseTo(440);
    expect(noteToHz("A5")).toBeCloseTo(880);
    expect(noteToHz("C4")).toBeCloseTo(261.63, 1);
    expect(noteToHz("C#4")).toBeCloseTo(noteToHz("Db4"));
  });

  it("parses notes, rests and drums", () => {
    const events = parseNotes("A4:4 -:2 | k:1");
    expect(events).toHaveLength(3);
    expect(events[1]).toEqual({ pitch: null, length: 2 });
    expect(events[2]).toEqual({ pitch: "k", length: 1 });
  });

  it.each(Object.entries(TRACKS))("%s parses and its looping channels stay in sync", (_name, track) => {
    const lengths = track.channels.map((c) => totalLength(parseNotes(c.notes)));
    if (track.loop) expect(new Set(lengths).size, `channel lengths ${lengths.join(", ")}`).toBe(1);
  });
});
