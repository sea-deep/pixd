import { afterEach, expect, it, vi } from "vitest";
import { Collection } from "discord.js";
import sharp from "sharp";
import animan from "../src/HybridCommands/Image/animan.js";
import lapata from "../src/HybridCommands/Image/lapata.js";
import goodness from "../src/HybridCommands/Image/goodness.js";
import nearyou from "../src/HybridCommands/Image/nearyou.js";
import vosahihai from "../src/HybridCommands/Image/vosahihai.js";
import allustuff from "../src/HybridCommands/Image/allustuff.js";
vi.mock("google-translate-api-x", () => ({ translate: vi.fn().mockResolvedValue({ text: "test caption" }) }));
afterEach(() => vi.unstubAllGlobals());

it.each([animan, lapata, goodness, nearyou, vosahihai, allustuff].flatMap(command => [false, true].map(slash => ({ command, slash }))))(
  "renders $command.name using shared logic (slash=$slash)", async ({ command, slash }) => {
    const png = await sharp({ create: { width: 100, height: 100, channels: 4, background: "red" } }).png().toBuffer();
    vi.stubGlobal("fetch", vi.fn().mockImplementation(async () => new Response(new Uint8Array(png))));
    const users = new Collection(["111", "222", "333", "444"].map(id => [id, { id, displayAvatarURL: () => "https://example.com/avatar.png" }]));
    const image = { id: "img", url: "https://example.com/image.png" };
    const args = command.name === "animan" ? users.map(user => `<@${user.id}>`) : ["test", "caption"];
    const reply = vi.fn().mockResolvedValue({ id: "reply" });
    const ctx = { isSlash: slash, args, user: users.first(), reply,
      raw: { content: `d!${command.name} ${args.join(" ")}`, author: users.first(), mentions: { users, members: new Collection() }, attachments: new Collection([[image.id, image]]), stickers: new Collection() },
      options: {
        getUser: (name: string) => name === "user" ? users.first() : users.at(Number(name.replace("user", "")) - 1) ?? null,
        getMember: () => null,
        getString: (name: string) => name === "caption" ? "test caption" : null,
        getAttachment: (name: string) => name === "image-file" ? image : null,
      },
    };
    await command.run(ctx as any, { users: { fetch: async (id: string) => users.get(id) } } as any);
    const payload = reply.mock.calls.at(-1)?.[0];
    expect(payload.files).toHaveLength(1);
    const metadata = await sharp(payload.files[0].attachment).metadata();
    expect(metadata.width).toBeGreaterThan(0);
    expect(metadata.height).toBeGreaterThan(0);
  }, 30_000,
);
