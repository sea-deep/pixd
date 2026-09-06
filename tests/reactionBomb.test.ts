import { describe, expect, it, vi, beforeEach } from "vitest";
import ReactionBombService from "../src/services/ReactionBombService.js";
import actuallyHybrid from "../src/HybridCommands/XUV/actually.js";
import geneticsHybrid from "../src/HybridCommands/XUV/genetics.js";
import actuallyContext from "../src/Interactions/MessageContextMenus/actually.js";
import geneticsContext from "../src/Interactions/MessageContextMenus/genetics.js";
import emote from "../Configs/emote.js";

describe("ReactionBombService & Attack Commands", () => {
  beforeEach(() => {
    // Reset private locks and cooldowns between tests
    (ReactionBombService as any).activeMessageLocks.clear();
    (ReactionBombService as any).userCooldowns.clear();
  });

  describe("Emoji Configurations", () => {
    it("has valid nerd and genesis emoji arrays", () => {
      expect(emote.nerdEmojis).toHaveLength(20);
      expect(emote.genesisEmojis).toHaveLength(15);
      for (const e of [...emote.nerdEmojis, ...emote.genesisEmojis]) {
        expect(e).toMatch(/^<(a?):[a-zA-Z0-9_]+:\d+>$/);
      }
    });
  });

  describe("Target Message Resolution", () => {
    it("resolves from a Discord message URL across channels", async () => {
      const mockTarget = { id: "999999", content: "Target announcement" };
      const mockChannel = {
        messages: {
          fetch: vi.fn(async (id: string) => (id === "999999" ? mockTarget : null)),
        },
      };
      const mockClient = {
        channels: {
          fetch: vi.fn(async (id: string) => (id === "456456" ? mockChannel : null)),
        },
      };

      const mockCtx = {
        client: mockClient,
        channel: null,
      } as any;

      const { message, error } = await ReactionBombService.resolveTarget(
        mockCtx,
        "https://discord.com/channels/123123/456456/999999"
      );

      expect(error).toBeUndefined();
      expect(message).toBe(mockTarget);
      expect(mockClient.channels.fetch).toHaveBeenCalledWith("456456");
      expect(mockChannel.messages.fetch).toHaveBeenCalledWith("999999");
    });

    it("resolves from a message ID in the current channel", async () => {
      const mockTarget = { id: "888888888888888888" };
      const mockChannel = {
        messages: {
          fetch: vi.fn(async (id: string) => (id === "888888888888888888" ? mockTarget : null)),
        },
      };
      const mockCtx = {
        channel: mockChannel,
      } as any;

      const { message, error } = await ReactionBombService.resolveTarget(
        mockCtx,
        "888888888888888888"
      );

      expect(error).toBeUndefined();
      expect(message).toBe(mockTarget);
      expect(mockChannel.messages.fetch).toHaveBeenCalledWith("888888888888888888");
    });

    it("falls back to previous message in channel when no input is given", async () => {
      const mockPrev = { id: "777777" };
      const mockChannel = {
        messages: {
          fetch: vi.fn(async () => ({
            first: () => mockPrev,
          })),
        },
      };
      const mockCtx = {
        channel: mockChannel,
      } as any;

      const { message, error } = await ReactionBombService.resolveTarget(mockCtx, "");
      expect(error).toBeUndefined();
      expect(message).toBe(mockPrev);
    });
  });

  describe("Concurrency & Rate Limit Protection", () => {
    it("rejects concurrent reactions on the exact same target message", async () => {
      const mockMessage = {
        id: "msg_lock_test",
        reactions: { cache: new Map() },
        react: vi.fn(async () => new Promise((resolve) => setTimeout(resolve, 50))),
      } as any;

      // First user begins deployment
      const promise1 = ReactionBombService.deploy("user_1", mockMessage, ["<:a:111>"]);

      // Second user attempts to deploy on the exact same message while locked
      const result2 = await ReactionBombService.deploy("user_2", mockMessage, ["<:b:222>"]);

      expect(result2.success).toBe(false);
      expect(result2.error).toContain("already receiving a reaction barrage");

      await promise1;
    });

    it("rejects execution if user triggers within cooldown window", async () => {
      const mockMessage1 = {
        id: "msg_cd_1",
        reactions: { cache: new Map() },
        react: vi.fn(async () => ({})),
      } as any;
      const mockMessage2 = {
        id: "msg_cd_2",
        reactions: { cache: new Map() },
        react: vi.fn(async () => ({})),
      } as any;

      const result1 = await ReactionBombService.deploy("spam_user", mockMessage1, ["<:a:1>"]);
      expect(result1.success).toBe(true);

      const result2 = await ReactionBombService.deploy("spam_user", mockMessage2, ["<:b:2>"]);
      expect(result2.success).toBe(false);
      expect(result2.error).toContain("You're doing that too fast!");
    });

    it("respects Discord 20-reaction cap by filling only remaining slots", async () => {
      const mockMessage = {
        id: "msg_cap_test",
        reactions: {
          cache: { size: 17 }, // 17 existing -> only 3 slots available
        },
        react: vi.fn(async () => ({})),
      } as any;

      const result = await ReactionBombService.deploy("user_cap", mockMessage, emote.nerdEmojis);

      expect(result.success).toBe(true);
      expect(result.reactedCount).toBe(3); // Exactly 20 - 17 = 3
      expect(mockMessage.react).toHaveBeenCalledTimes(3);
    });

    it("aborts if message already has 20 reactions", async () => {
      const mockMessage = {
        id: "msg_full_test",
        reactions: { cache: { size: 20 } },
        react: vi.fn(),
      } as any;

      const result = await ReactionBombService.deploy("user_full", mockMessage, emote.nerdEmojis);

      expect(result.success).toBe(false);
      expect(result.reactedCount).toBe(0);
      expect(result.error).toContain("maximum of 20 reactions");
      expect(mockMessage.react).not.toHaveBeenCalled();
    });
  });

  describe("Hybrid Commands & Context Menus", () => {
    it("actually hybrid command has aliases and executes safely", () => {
      expect(actuallyHybrid.name).toBe("actually");
      expect(actuallyHybrid.aliases).toContain("nerd");
      expect(actuallyHybrid.options).toHaveLength(1);
    });

    it("genetics hybrid command has aliases and executes safely", () => {
      expect(geneticsHybrid.name).toBe("genetics");
      expect(geneticsHybrid.aliases).toContain("g");
      expect(geneticsHybrid.options).toHaveLength(1);
    });

    it("context menus are registered with correct names", () => {
      expect(actuallyContext.name).toBe("React Nerd");
      expect(geneticsContext.name).toBe("React Genesis");
    });
  });
});
