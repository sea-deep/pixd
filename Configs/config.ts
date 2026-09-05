import { env } from "../src/utilities/env.js";

export interface ConfigSchema {
  prefix: string;
  restricted: string[];
  color: number;
  music: {
    maxQueueSize: number;
    maxPlaylistSize: number;
    maxTrackDurationMs: number;
    inactivityMs: number;
  };
}

const config: ConfigSchema = {
  prefix: env.ENVIRONMENT === "prod" ? "p!" : "d!",
  restricted: [
    "720286639691399218",
    "1104345879588126811",
    "887265587854737479",
  ],
  color: 0x0e08e6,
  music: {
    maxQueueSize: 100,
    maxPlaylistSize: 50,
    maxTrackDurationMs: 4 * 60 * 60 * 1000,
    inactivityMs: 30_000,
  },
};

export default config;
