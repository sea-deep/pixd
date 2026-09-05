import { join } from "node:path";

export function loaderPattern(folder) {
  const production = import.meta.url.includes("/dist/");
  const base = production ? join(process.cwd(), "dist") : process.cwd();
  const extensions = production ? "js" : "{js,ts}";
  return `${base.replace(/\\/g, "/")}/${folder}/**/*.${extensions}`;
}
