import { describe, expect, it, vi } from "vitest";
import HybridCommand from "../src/structures/HybridCommand.js";
import MessageCommand from "../src/structures/MessageCommand.js";
import messageCreateEvent from "../src/events/Client/messageCreate.js";
import config from "../Configs/config.js";

describe("argsSeparator metadata and messageCreate handling", () => {
  it("defaults argsSeparator to space in HybridCommand", () => {
    const cmd = new HybridCommand({
      name: "test",
      description: "test command",
      execute: vi.fn(),
    });
    expect(cmd.argsSeparator).toBe(" ");
  });

  it("supports custom argsSeparator in HybridCommand", () => {
    const cmd = new HybridCommand({
      name: "test",
      description: "test command",
      argsSeparator: ",",
      execute: vi.fn(),
    });
    expect(cmd.argsSeparator).toBe(",");
  });

  it("defaults argsSeparator to space in MessageCommand", () => {
    const cmd = new MessageCommand({
      name: "test",
      description: "test command",
      execute: vi.fn(),
    });
    expect(cmd.argsSeparator).toBe(" ");
  });

  it("supports custom argsSeparator in MessageCommand", () => {
    const cmd = new MessageCommand({
      name: "test",
      description: "test command",
      argsSeparator: "|",
      execute: vi.fn(),
    });
    expect(cmd.argsSeparator).toBe("|");
  });

  it("splits prefix command arguments using custom delimiter in messageCreate", async () => {
    const executeMock = vi.fn();
    const cmd = new HybridCommand({
      name: "play",
      description: "play command",
      argsSeparator: ",",
      execute: executeMock,
    });

    const client = {
      prefixCommands: new Map([["play", cmd]]),
    } as any;

    const message = {
      author: { bot: false, id: "user-1" },
      content: `${config.commands.prefix}play everytime we touch, soundcloud`,
      reply: vi.fn(),
    } as any;

    await (messageCreateEvent.execute as any)(message, client);

    expect(executeMock).toHaveBeenCalledOnce();
    const ctx = executeMock.mock.calls[0][0];
    expect(ctx.args).toEqual(["everytime we touch", "soundcloud"]);
  });
});
