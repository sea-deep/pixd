import { afterEach, describe, expect, it, vi } from "vitest";
import { KeyValueStore } from "../src/helpers/helperUtil.js";

afterEach(() => vi.useRealTimers());

describe("KeyValueStore", () => {
  it("expires values using seconds", () => {
    vi.useFakeTimers();
    const store = new KeyValueStore();
    store.set("temporary", "value", 30);
    vi.advanceTimersByTime(29_999);
    expect(store.get("temporary")).toBe("value");
    vi.advanceTimersByTime(2);
    expect(store.get("temporary")).toBeUndefined();
  });

  it("can replace and remove a TTL", () => {
    vi.useFakeTimers();
    const store = new KeyValueStore();
    store.set("key", 42, 1);
    store.setTTL("key", null);
    vi.advanceTimersByTime(2_000);
    expect(store.get("key")).toBe(42);
  });
});
