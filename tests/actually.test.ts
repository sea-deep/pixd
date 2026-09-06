import { describe, expect, it, vi } from "vitest";
import actuallyCommand from "../src/Interactions/MessageContextMenus/actually.js";
import emote from "../Configs/emote.js";

describe("React Nerd Context Menu (actually.ts)", () => {
  it("has exactly 20 valid custom nerd emojis in emote config", () => {
    expect(emote.nerdEmojis).toHaveLength(20);
    for (const emoji of emote.nerdEmojis) {
      expect(emoji).toMatch(/^<(a?):[a-zA-Z0-9_]+:\d+>$/);
    }
  });

  it("is registered as a Message Context Menu named 'React Nerd'", () => {
    expect(actuallyCommand.name).toBe("React Nerd");
    expect(actuallyCommand.commandType).toBe("messageContextMenu");
  });

  it("safely reacts up to the remaining reaction limit and edits reply", async () => {
    const reactions: string[] = [];
    const mockMessage = {
      reactions: {
        cache: new Map([
          ["1", {}],
          ["2", {}],
        ]), // 2 existing reactions -> 18 slots remaining
      },
      react: vi.fn(async (e: string) => {
        reactions.push(e);
        return {} as any;
      }),
    };

    const mockInteraction = {
      deferred: false,
      replied: false,
      deferReply: vi.fn(async () => {
        mockInteraction.deferred = true;
      }),
      editReply: vi.fn(async () => ({})),
      targetMessage: mockMessage,
      guild: null,
    } as any;

    await actuallyCommand.execute(mockInteraction, {} as any);

    expect(mockInteraction.deferReply).toHaveBeenCalledWith({ flags: 64 });
    expect(mockMessage.react).toHaveBeenCalledTimes(18); // 20 - 2 = 18
    expect(mockInteraction.editReply).toHaveBeenCalledWith({
      content: expect.stringContaining("Successfully deployed **18** nerd reactions!"),
    });
  });

  it("blocks execution if target message already has 20 reactions", async () => {
    const mockMessage = {
      reactions: {
        cache: { size: 20 },
      },
      react: vi.fn(),
    };

    const mockInteraction = {
      deferred: false,
      replied: false,
      deferReply: vi.fn(async () => {
        mockInteraction.deferred = true;
      }),
      editReply: vi.fn(async () => ({})),
      targetMessage: mockMessage,
      guild: null,
    } as any;

    await actuallyCommand.execute(mockInteraction, {} as any);

    expect(mockMessage.react).not.toHaveBeenCalled();
    expect(mockInteraction.editReply).toHaveBeenCalledWith({
      content: "❌ This message already has the maximum of 20 reactions!",
    });
  });
});
