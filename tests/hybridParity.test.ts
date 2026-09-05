import { Collection } from "discord.js";
import { expect, it, vi } from "vitest";
import say from "../src/HybridCommands/owner/say.js";
import wordle from "../src/HybridCommands/games/wordle.js";
import pin from "../src/HybridCommands/Utility/pin.js";
import { commandInput } from "../src/helpers/commandInput.js";
import { handleApplicationCommandOptions } from "../src/utilities/CommandOptions.js";

function context(slash: boolean, args: string[] = []) {
  const user = { id: "123", username: "tester" };
  const reply = vi.fn().mockResolvedValue({ id: "reply-id" });
  const raw = { content: `d!say ${args.join(" ")}`, mentions: { users: new Collection(), members: new Collection() }, attachments: new Collection() };
  return { isSlash: slash, args, raw, user, guild: { id: "guild" }, reply,
    options: { getString: () => args.join(" "), getUser: () => null, getMember: () => null, getAttachment: () => null },
  } as any;
}
it.each([false, true])("say shares template execution for slash=%s", async slash => {
  const ctx = context(slash, ["hello", "world"]);
  await say.run(ctx, {} as any);
  expect(ctx.reply).toHaveBeenCalledWith({ content: "hello world", allowedMentions: { parse: [] } });
});
it.each([false, true])("wordle keys state by the actual reply ID for slash=%s", async slash => {
  const ctx = context(slash);
  const set = vi.fn();
  await wordle.run(ctx, { keyv: { set } } as any);
  expect(ctx.reply).toHaveBeenCalledOnce();
  expect(set).toHaveBeenCalledWith("reply-id", expect.any(String));
});
it("pin without arguments replies instead of throwing", async () => {
  const ctx = context(true);
  await pin.run(ctx, { color: 123 } as any);
  expect(ctx.reply).toHaveBeenCalledOnce();
});
it("slash target and attachment resolve as input data", () => {
  const ctx = context(true, ["add", "name", "some text"]);
  ctx.options.getUser = (name: string) => name === "user" ? { id: "456" } : null;
  ctx.options.getAttachment = () => ({ id: "image", url: "https://example.com/image.png" });
  const input = commandInput(ctx);
  expect(input.args).toEqual(["add", "name", "some", "text", "<@456>"]);
  expect(input.attachments.first()?.url).toBe("https://example.com/image.png");
});
it("owner-only commands stay restricted through template checks", async () => {
  const reply = vi.fn();
  expect(await handleApplicationCommandOptions({ user: { id: "not-owner" }, reply } as any, say)).toBe(false);
  expect(reply).toHaveBeenCalledOnce();
});
