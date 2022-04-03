import { error, log, warn } from "console";
import * as path from "path";
import { fileURLToPath } from "url";

const debug = true;

export const console = {
    log: (...args) => {
        if (debug) {
            log(...args);
        }
    },
    warn: (...args) => {
        if (debug) {
            warn(...args);
        }
    },
    error: (...args) => {
        if (debug) {
            error(...args);
        }
    }
};

const filename = fileURLToPath(import.meta.url);
export const dirname = path.dirname(filename);

export const REFRESH_TIMEOUT = 1000 * 60 * 5;

export const STATIONS = [{
    id: "c9c0ebcc-5e86-4e4c-8d59-f985c9b2121c",
    name: "Total (Richtung Drehscheibe)"
}, {
    id: "938c082c-e2c6-4292-8b2c-cdf83036e555",
    name: "Esso (Richtung Bahnhof)"
}];

export const RELEVANT_TYPES = [
    "e5"
];

export const TYPES = {
    e5: "Super",
    e10: "Super E10",
    diesel: "Diesel"
};

export const LOCAL_FOLDER = "local";

export const ACTIVITY_TYPES = {
    PLAYING: "PLAYING",
    STREAMING: "STREAMING",
    LISTENING: "LISTENING",
    WATCHING: "WATCHING",
    CUSTOM: "CUSTOM",
    COMPETING: "COMPETING",
};
