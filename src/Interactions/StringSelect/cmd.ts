import Component from "../../structures/Component.js";
import { updateHelp } from "../../services/HelpService.js";
export default new Component({ customId: "cmd", type: "stringSelect", execute: updateHelp });
