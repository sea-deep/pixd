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
      "name": "Node1",
      "host": "lavalinkv4-id.serenetia.com",
      "port": 443,
      "password": "https://dsc.gg/ajidevserver",
      "secure": true
    },

  

    // {
    //   name: "node2",
    //   host: "lavalink.alfari.id",
    //   password: "catfein",
    //   port: 443,
    //   secure: true,
    // },
  ],
};
