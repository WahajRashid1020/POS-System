import { describe, expect, it } from "vitest";
import { parseBold } from "./chat-format";

describe("parseBold", () => {
  it("returns plain text as a single non-bold segment", () => {
    expect(parseBold("Sales are up")).toEqual([
      { text: "Sales are up", bold: false },
    ]);
  });

  it("marks **text** as bold and keeps the text around it", () => {
    expect(parseBold("Top item: **Spice Bag** today")).toEqual([
      { text: "Top item: ", bold: false },
      { text: "Spice Bag", bold: true },
      { text: " today", bold: false },
    ]);
  });

  it("handles several bold spans on one line", () => {
    expect(parseBold("**A** and **B**")).toEqual([
      { text: "A", bold: true },
      { text: " and ", bold: false },
      { text: "B", bold: true },
    ]);
  });

  it("leaves an unmatched ** as literal text", () => {
    expect(parseBold("5 ** 2")).toEqual([{ text: "5 ** 2", bold: false }]);
  });

  it("never turns HTML into markup: it stays inside plain text segments", () => {
    const attack = '<img src=x onerror="alert(1)"> and **<script>x</script>**';
    const segments = parseBold(attack);

    expect(segments).toEqual([
      { text: '<img src=x onerror="alert(1)"> and ', bold: false },
      { text: "<script>x</script>", bold: true },
    ]);
    expect(segments.map((s) => s.text).join("")).toContain("<img");
  });

  it("returns no segments for an empty line", () => {
    expect(parseBold("")).toEqual([]);
  });
});
