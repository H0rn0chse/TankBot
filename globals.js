import * as path from "path";
import { fileURLToPath } from "url";

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

export const REREGISTER_INTERACTIONS = false;

export const LOCAL_FOLDER = "local";
