let prefix = process.env.ENVIRONMENT === "prod" ? "p!" : "d!";

export default {
  prefix: prefix,
  restricted: [
    "720286639691399218",
    "1104345879588126811",
    "887265587854737479",
  ],
  nodes: [
    {
      name: "node4",
      host: "lavalinkv4-id.serenetia.com",
      password: "BatuManaBisa",
      port: 443,
      secure: true,
    },
    {
      name: "node5",
      host: "lavalinkv4-eu.serenetia.com",
      password: "BatuManaBisa",
      port: 443,
      secure: true,
    },
    {
      name: "node6",
      host: "lavalink.alfari.id",
      password: "catfein",
      port: 443,
      secure: true,
    },
  ],
};
