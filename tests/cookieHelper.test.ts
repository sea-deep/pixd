import { describe, expect, it, vi } from "vitest";
import { getCookiesPath } from "../src/helpers/cookieHelper.js";

describe("cookieHelper", () => {
  it("returns undefined or valid string path without crashing", () => {
    const path = getCookiesPath();
    expect(path === undefined || typeof path === "string").toBe(true);
  });
});
