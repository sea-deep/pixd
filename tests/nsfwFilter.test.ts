import { describe, expect, it } from "vitest";
import { isNsfwQuery } from "../src/helpers/nsfwFilter.js";

describe("isNsfwQuery filter", () => {
  describe("Safe prompts", () => {
    const safePrompts = [
      "A cute orange tabby cat sitting on a rug",
      "Delicious cucumber and tomato salad recipe",
      "Title of the best selling sci-fi book",
      "Deep economic analysis of renewable energy",
      "A vintage classic muscle car parked outside high school class",
      "Peacock drinking a colorful mocktail",
      "A Charles Dickens novel illustration",
      "Launch of the interstellar space shuttlecock",
      "Landscape photo of the county of Essex in winter",
      "A futuristic cyberpunk city with neon skyscrapers",
      "A majestic eagle flying over snow covered mountains",
      "Astronaut floating peacefully in orbit around Mars",
      "Photorealistic portrait of an old wise wizard with a beard",
    ];

    for (const prompt of safePrompts) {
      it(`recognizes "${prompt}" as safe`, () => {
        expect(isNsfwQuery(prompt)).toBe(false);
      });
    }
  });

  describe("NSFW / Adult prompts", () => {
    const nsfwPrompts = [
      "nude woman posing on a tropical beach",
      "ultra realistic sexy anime girl",
      "hentai waifu illustration in bedroom",
      "p 0 r n star posing for photo",
      "b00bs close up portrait",
      "goth girl in black lingerie",
      "young woman with no clothes on",
      "big tits anime girl",
      "r34 sonic the hedgehog",
      "nsfw ecchi cyberpunk wallpaper",
      "topless woman walking near river",
      "naked man in the shower",
      "deepthroat blowjob erotica",
      "girl wearing a revealing bikini",
      "chut and lund dirty talk illustration",
      "camgirl live on onlyfans",
      "explicit sex between couples",
      "stripper dancing at a strip club",
    ];

    for (const prompt of nsfwPrompts) {
      it(`detects "${prompt}" as NSFW`, () => {
        expect(isNsfwQuery(prompt)).toBe(true);
      });
    }
  });

  describe("Edge cases and evasions", () => {
    it("handles empty and non-string inputs safely", () => {
      expect(isNsfwQuery("")).toBe(false);
      expect(isNsfwQuery(null as any)).toBe(false);
      expect(isNsfwQuery(undefined as any)).toBe(false);
    });

    it("detects spaced out letters (e.g. 'p o r n')", () => {
      expect(isNsfwQuery("p o r n")).toBe(true);
      expect(isNsfwQuery("s e x y")).toBe(true);
    });

    it("detects leetspeak substitutions (e.g. 's3x', 'b00bs')", () => {
      expect(isNsfwQuery("s3x")).toBe(true);
      expect(isNsfwQuery("b00bs")).toBe(true);
      expect(isNsfwQuery("n!pples")).toBe(true);
      expect(isNsfwQuery("p0rn")).toBe(true);
    });
  });
});
