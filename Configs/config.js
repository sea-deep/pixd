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
      host: "lava-v4.ajieblogs.eu.org",
      password: "https://dsc.gg/ajidevserver",
      port: 443,
      secure: true,
    },
<<<<<<< HEAD
    // {
    //   name: "node2",
    //   host: "lavalink.alfari.id",
    //   password: "catfein",
    //   port: 443,
    //   secure: true,
    // },
    
=======



    
    {
      name: "node2",
      host: "lavalink.alfari.id",
      password: "catfein",
      port: 443,
      secure: true,
    },
>>>>>>> 7402bc4 (Auto Update)
  ],
};
