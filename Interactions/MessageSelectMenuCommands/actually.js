import { MessageContextMenuCommandInteraction } from "discord.js";

export default {
  data: {
    name: 'React Nerd',
    type: 3
  },
  /**
   * @param {MessageContextMenuCommandInteraction} interaction
   */
  execute: async (interaction) => {
        await interaction.deferReply({ ephemeral: true });
        let gene =
      "<:actually:1085483052962173009> <:inerd:1085486860417110026> <:nerd:1085483964917096520> <:nerdbob:1085483238149070878> <:nerdd:1085486459244527657> <:nerdddd:1085486629902364703> <:nerddddd:1085486964096127028> <:nerdddddd:1085487061986988092> <:nerdy:1085487343663845397> <:nerdyy:1085488754229252237> <:nerdyyy:1085488822650945596> <:nerdyyyy:1085488900065214464> <:nerdyyyyy:1085488991870144512> <:nerdyyyyyy:1085489036749176996> <:nerdyz:1085489094198579200> <:padhaku:1085487174994112532> <:quote:1085483838840516629> <a:nerddd:1085483561404092476> <a:umactually:1085483295069966365> <:chodu:1085490222290190357>";

    let genesis = gene.split(" ");
    for (let i = 0; i < genesis.length; i++) {
      try {
        await interaction.targetMessage.react(genesis[i]);
      } catch (err) {
             console.log("An error occurred: ", err);

        return interaction.followUp({
          content: 'An error occurred while reacting to message :\n```\n' + err.message + '```',
          ephemeral: true
        });
       }    
    }
    await interaction.followUp({
          content: 'Reactions Added!',
          ephemeral: true
        });
  }
};