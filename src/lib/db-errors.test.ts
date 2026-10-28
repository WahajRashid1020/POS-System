import { describe, expect, it } from "vitest";
import { isDuplicateKeyError } from "./db-errors";

describe("isDuplicateKeyError", () => {
  it("recognises MongoDB's duplicate key error (code 11000)", () => {
    const error = Object.assign(new Error("E11000 duplicate key error"), { code: 11000 });

    expect(isDuplicateKeyError(error)).toBe(true);
  });

  it("does not treat other database errors as duplicates", () => {
    expect(isDuplicateKeyError(Object.assign(new Error("boom"), { code: 121 }))).toBe(false);
    expect(isDuplicateKeyError(new Error("E11000 in the message only"))).toBe(false);
  });

  it.each([null, undefined, "11000", 11000, {}, { code: "11000" }])(
    "returns false for %j",
    (value) => {
      expect(isDuplicateKeyError(value)).toBe(false);
    },
  );
});
