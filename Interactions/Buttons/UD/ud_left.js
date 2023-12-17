export default {
  name: 'ud_left',
  execute: (interaction) => {
    const msg= interaction.message;
    const btn = msg.components[0].components[1].label;
    const currentPage = parseInt(btn.split("/")[0]) - 1;
    const maxPage = parseInt(btn.split("/")[1]) - 1;
    let goto = currentPage - 1;
    if(currentPage == 0) {goto = maxPage}
   }
}