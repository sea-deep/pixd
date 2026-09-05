import { describe, expect, it } from "vitest";
import config from "../Configs/config.js";
import { canDeleteMessage } from "../src/Interactions/Buttons/Image/deleteBtn.js";

describe("delete button authorization", () => {
  const mockClient = {
    color: 0x5865f2,
  } as any;

  it("allows bot owner to delete", async () => {
    const interaction = {
      user: { id: config.users.ownerId },
      guild: { id: "guild-1", ownerId: "guild-owner" },
      memberPermissions: { has: () => false },
      message: { channel: { messages: { cache: new Map() } } },
    } as any;

    expect(await canDeleteMessage(interaction, mockClient)).toBe(true);
  });

  it("allows server administrator to delete", async () => {
    const interaction = {
      user: { id: "admin-user" },
      guild: { id: "guild-1", ownerId: "guild-owner" },
      memberPermissions: { has: (perm: string) => perm === "Administrator" },
      message: { channel: { messages: { cache: new Map() } } },
    } as any;

    expect(await canDeleteMessage(interaction, mockClient)).toBe(true);
  });

  it("allows moderator with ManageMessages to delete", async () => {
    const interaction = {
      user: { id: "mod-user" },
      guild: { id: "guild-1", ownerId: "guild-owner" },
      memberPermissions: { has: (perm: string) => perm === "ManageMessages" },
      message: { channel: { messages: { cache: new Map() } } },
    } as any;

    expect(await canDeleteMessage(interaction, mockClient)).toBe(true);
  });

  it("allows server owner to delete", async () => {
    const interaction = {
      user: { id: "guild-owner" },
      guild: { id: "guild-1", ownerId: "guild-owner" },
      memberPermissions: { has: () => false },
      message: { channel: { messages: { cache: new Map() } } },
    } as any;

    expect(await canDeleteMessage(interaction, mockClient)).toBe(true);
  });

  it("allows command author via customId param to delete", async () => {
    const interaction = {
      user: { id: "author-user" },
      guild: { id: "guild-1", ownerId: "guild-owner" },
      memberPermissions: { has: () => false },
      message: { channel: { messages: { cache: new Map() } } },
    } as any;

    expect(await canDeleteMessage(interaction, mockClient, "author-user")).toBe(true);
  });

  it("allows command author via interactionMetadata to delete", async () => {
    const interaction = {
      user: { id: "slash-author" },
      guild: { id: "guild-1", ownerId: "guild-owner" },
      memberPermissions: { has: () => false },
      message: {
        interactionMetadata: { user: { id: "slash-author" } },
        channel: { messages: { cache: new Map() } },
      },
    } as any;

    expect(await canDeleteMessage(interaction, mockClient)).toBe(true);
  });

  it("allows command author via message reference to delete", async () => {
    const interaction = {
      user: { id: "prefix-author" },
      guild: { id: "guild-1", ownerId: "guild-owner" },
      memberPermissions: { has: () => false },
      message: {
        reference: { messageId: "msg-123" },
        channel: {
          messages: {
            cache: new Map([
              ["msg-123", { author: { id: "prefix-author" } }],
            ]),
          },
        },
      },
    } as any;

    expect(await canDeleteMessage(interaction, mockClient)).toBe(true);
  });

  it("allows user in DMs to delete", async () => {
    const interaction = {
      user: { id: "dm-user" },
      guild: null,
      memberPermissions: null,
      message: { channel: { messages: { cache: new Map() } } },
    } as any;

    expect(await canDeleteMessage(interaction, mockClient)).toBe(true);
  });

  it("rejects unauthorized random user", async () => {
    const interaction = {
      user: { id: "random-user" },
      guild: { id: "guild-1", ownerId: "guild-owner" },
      memberPermissions: { has: () => false },
      message: {
        interactionMetadata: { user: { id: "other-user" } },
        channel: { messages: { cache: new Map() } },
      },
    } as any;

    expect(await canDeleteMessage(interaction, mockClient, "other-user")).toBe(false);
  });
});
