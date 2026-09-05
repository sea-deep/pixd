import { resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

/**
 * Resolves directory scanning patterns for ESM glob loaders,
 * dynamically adjusting for typescript source (.ts) in dev and compiled JS (.js) in production.
 */
export function getLoaderPattern(folderName: string): string {
  const distRoot = resolve(process.cwd(), "dist");
  const entryPath = process.argv[1] ? resolve(process.argv[1]) : "";
  const modulePath = fileURLToPath(import.meta.url);
  const isProd = process.env.NODE_ENV === "production"
    || entryPath.startsWith(`${distRoot}${sep}`)
    || modulePath.startsWith(`${distRoot}${sep}`);
  const baseDir = isProd ? "dist/src" : "src";
  const extensions = isProd ? "js" : "{ts,js}";
  return `${process.cwd().replace(/\\/g, "/")}/${baseDir}/${folderName}/**/*.${extensions}`;
}
