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
      "name": "MYHM.Space",
      "password": "d.gg/therepublic",
      "host": "ll3.myhm.space",
      "port": 443,
      "secure": true
    }

    // {
    //   name: "node2",
    //   host: "lavalink.alfari.id",
    //   password: "catfein",
    //   port: 443,
    //   secure: true,
    // },
  ],
};
