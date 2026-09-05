import { expect, it, vi } from "vitest";
import CommandContext from "../src/helpers/CommandContext.js";

it("returns a real message for fresh slash replies", async () => {
  const message = { id: "actual-message", createMessageComponentCollector: vi.fn() };
  const raw = { isCommand: () => true, user: { id: "user" }, options: {},
    reply: vi.fn().mockResolvedValue({}), fetchReply: vi.fn().mockResolvedValue(message) };
  const ctx = new CommandContext(raw as any);
  expect(await ctx.reply("test")).toBe(message);
  expect(raw.reply).toHaveBeenCalledOnce();
});
it("edits deferred replies rather than creating a follow-up", async () => {
  const message = { id: "reply" };
  const raw = { isCommand: () => true, user: { id: "user" }, options: {}, deferred: true, editReply: vi.fn().mockResolvedValue(message) };
  expect(await new CommandContext(raw as any).reply("ready")).toBe(message);
});
it("preserves raw prefix arguments and removes only ephemeral flags", async () => {
  const reply = vi.fn().mockResolvedValue({ id: "reply" });
  const raw = { author: { id: "user" }, reply };
  const ctx = new CommandContext(raw as any, ["two", "words"]);
  expect(ctx.args).toEqual(["two", "words"]);
  await ctx.reply({ content: "hello", flags: 64 | 4, ephemeral: true });
  expect(reply).toHaveBeenCalledWith({ content: "hello", flags: 4 });
});
it("recognizes modern interaction metadata for component ownership", () => {
  const owner = { id: "owner" };
  const raw = { user: { id: "clicker" }, message: { interactionMetadata: { user: owner } } };
  expect(new CommandContext(raw as any).originalAuthor).toBe(owner);
});
