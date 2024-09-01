import pkg from "glob";
const { glob } = pkg;
import { pathToFileURL } from "node:url";
import { client } from "../index.js";

try {
  const Files = await glob(
    `${process.cwd().replace(/\\/g, "/")}/Events/Client/**/*.js`,
  );

  for (let i = 0; i < Files.length; i++) {
    Files[i] = pathToFileURL(Files[i]);

    const eventFile = await import(Files[i]);
    const eventFunction = eventFile.default;

    if (eventFunction.disabled) continue;

    const event = eventFunction.event || Files[i].split(".")[0];
    const emitter =
      (typeof eventFunction.emitter === "string"
        ? client[eventFunction.emitter]
        : eventFunction.emitter) || client;
    const once = eventFunction.once;

    try {
      emitter[once ? "once" : "on"](event, (...args) =>
        eventFunction.execute(...args, client),
      );
    } catch (error) {
      console.error(`[EventHandler] -`, error);
    }
  }
  console.info(`[INFO] - Events Loaded!\n`);
} catch (err) {
  console.error(`[EventHandler] -`, err);
}
