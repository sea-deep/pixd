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
      name: "node1",
      host: "lavahatry4.techbyte.host",
      password: "NAIGLAVA-dash.techbyte.host",
      port: 3000,
      secure: false,
    },

    // {
    //   name: "node2",
    //   host: "45.89.99.118",
    //   password: "winkle@team",
    //   port: 8000,
    //   secure: false,
    // },
    // {
    //   name: "node2",
    //   host: "lavalink.alfari.id",
    //   password: "catfein",
    //   port: 443,
    //   secure: true,
    // },
    
  ],
};
