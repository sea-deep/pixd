import { MessageContextMenuCommandInteraction } from "discord.js";

export default {
  data: {
    name: 'React Genesis',
    type: 3
  },
  /**
   * @param {MessageContextMenuCommandInteraction} interaction
   */
  execute: async (interaction) => {
    let gene =
      "<:blenderesis:977906362484916244> <:chipkalesis:975650941372084284> <:dnasis:973574876885573742> <:drawingesis:1019606581740060693> <:femalesis:973991771581333504> <:genesis:1020673182836994088> <:genebro:1020673070777761842> <:genesissfw:1070357577579376750> <:genesusu:979064159398412308> <:genussy:1020676354963935275> <:kushalesis:1019644439997722644> <:thanussy:1020678708329185340> <:thanosis:975616934982860870> <:speechesis:972860630442840116> <a:genesif:975053431091912784>";

    let genesis = gene.split(" ");
    for (let i = 0; i < genesis.length; i++) {
      try {
        await interaction.targetMessage.react(genesis[i]);
      } catch (err) {
        await interaction.reply({
          content: 'An error occurred while reacting to message :\n```\n' + err.message + '```',
          ephemeral: true
        });
      }
    }
  }
};