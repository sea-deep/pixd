import { describe, expect, it } from "vitest";
import { PermissionsBitField } from "discord.js";
import {
  REQUIRED_BOT_PERMISSIONS,
  REQUIRED_BOT_PERMISSIONS_BITFIELD,
  REQUIRED_BOT_SCOPES,
  generateInviteUrl,
} from "../src/helpers/inviteHelper.js";
import { env } from "../src/utilities/env.js";

describe("inviteHelper", () => {
  it("calculates the correct bitfield for all evaluated bot permissions", () => {
    expect(REQUIRED_BOT_PERMISSIONS_BITFIELD).toBe("281357446208");

    const resolved = new PermissionsBitField(BigInt(REQUIRED_BOT_PERMISSIONS_BITFIELD));
    for (const perm of REQUIRED_BOT_PERMISSIONS) {
      expect(resolved.has(perm)).toBe(true);
    }
  });

  it("includes all essential functional permissions and excludes dangerous ones", () => {
    const resolved = new PermissionsBitField(BigInt(REQUIRED_BOT_PERMISSIONS_BITFIELD));

    // Essential permissions
    expect(resolved.has("ViewChannel")).toBe(true);
    expect(resolved.has("SendMessages")).toBe(true);
    expect(resolved.has("SendMessagesInThreads")).toBe(true);
    expect(resolved.has("ManageMessages")).toBe(true);
    expect(resolved.has("EmbedLinks")).toBe(true);
    expect(resolved.has("AttachFiles")).toBe(true);
    expect(resolved.has("ReadMessageHistory")).toBe(true);
    expect(resolved.has("AddReactions")).toBe(true);
    expect(resolved.has("UseExternalEmojis")).toBe(true);
    expect(resolved.has("Connect")).toBe(true);
    expect(resolved.has("Speak")).toBe(true);
    expect(resolved.has("UseVAD")).toBe(true);
    expect(resolved.has("UseApplicationCommands")).toBe(true);
    expect(resolved.has("RequestToSpeak")).toBe(true);

    // Dangerous/unnecessary permissions that must NOT be requested
    expect(resolved.has("Administrator")).toBe(false);
    expect(resolved.has("MentionEveryone")).toBe(false);
    expect(resolved.has("ManageGuild")).toBe(false);
    expect(resolved.has("ManageRoles")).toBe(false);
    expect(resolved.has("ManageChannels")).toBe(false);
    expect(resolved.has("KickMembers")).toBe(false);
    expect(resolved.has("BanMembers")).toBe(false);
  });

  it("includes bot and applications.commands scopes", () => {
    expect(REQUIRED_BOT_SCOPES).toContain("bot");
    expect(REQUIRED_BOT_SCOPES).toContain("applications.commands");
  });

  it("generates a valid invite URL with default env.CLIENT_ID", () => {
    const urlString = generateInviteUrl();
    const url = new URL(urlString);

    expect(url.origin).toBe("https://discord.com");
    expect(url.pathname).toBe("/oauth2/authorize");
    expect(url.searchParams.get("client_id")).toBe(env.CLIENT_ID);
    expect(url.searchParams.get("permissions")).toBe("281357446208");
    expect(url.searchParams.get("scope")).toBe("bot applications.commands");
  });

  it("generates a valid invite URL with an explicit clientId", () => {
    const customId = "999888777666555444";
    const urlString = generateInviteUrl(customId);
    const url = new URL(urlString);

    expect(url.searchParams.get("client_id")).toBe(customId);
    expect(url.searchParams.get("permissions")).toBe("281357446208");
    expect(url.searchParams.get("scope")).toBe("bot applications.commands");
  });

  it("binds /invite route in express app to redirect to the generated invite URL", async () => {
    const { app } = await import("../src/services/webServer.js");
    const stack = (app.router || (app as any)._router)?.stack || [];
    const inviteLayer = stack.find(
      (layer: any) => layer.route && layer.route.path === "/invite"
    );

    expect(inviteLayer).toBeDefined();

    let redirectedUrl = "";
    const fakeRes = {
      redirect: (target: string) => {
        redirectedUrl = target;
      },
    };

    const handler = inviteLayer.route.stack[0].handle;
    handler({} as any, fakeRes as any);

    expect(redirectedUrl).toBe(generateInviteUrl());
  });
});
