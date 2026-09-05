import { describe, expect, it } from "vitest";
import { createLastFmState, verifyLastFmState } from "../src/services/lastfm/AuthState.js";

describe("Last.fm callback state", () => {
  it("round-trips a signed Discord user ID", () => {
    expect(verifyLastFmState(createLastFmState("123456789"))).toBe("123456789");
  });
  it("rejects tampering", () => {
    const state = createLastFmState("123456789");
    expect(() => verifyLastFmState(`${state.slice(0, -1)}x`)).toThrow();
  });
});
