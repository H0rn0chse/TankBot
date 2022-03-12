import * as dotenv from "dotenv";
import fetch from "node-fetch";

import { REFRESH_TIMEOUT, RELEVANT_TYPES, STATIONS, TYPES } from "../globals.js";
import { DatabaseManager } from "./DatabaseManager.js";
import { CommandManager } from "./CommandManager.js";
import { Debug } from "./Debug.js";


dotenv.config();

const COMPONENT = "DataManger";
const baseUrl = "https://creativecommons.tankerkoenig.de/json";

class _DataManger {
    constructor () {
        this.token = null;
        this.stations = STATIONS;

        this.lastResponse = {};
    }

    setToken (token) {
        this.token = token;
    }

    async loadCache () {
        const stationIds = this.stations.map((station) => {
            return station.id;
        });
        stationIds.forEach((stationId) => {
            this.lastResponse[stationId] = null;
        });

        const lastEntries = DatabaseManager.getLastEntry(stationIds);
        lastEntries.forEach((row) => {
            this.lastResponse[row.station] = {
                e5: row.e5,
                e10: row.e10,
                diesel: row.diesel
            };
        });
    }

    startListen () {
        this.timer = setInterval(() => {
            this.fetchData();
        }, REFRESH_TIMEOUT);

        this.fetchData();
    }


    stopListen () {
        clearInterval(this.timer);
    }

    getPriceUrl () {
        let path = `${baseUrl}/prices.php?apikey=${this.token}&ids=`;
        this.stations.forEach((station) => {
            path += `${station.id},`;
        });
        if (path.endsWith(",")) {
            path = path.slice(0, -1);
        }
        console.log(path);

        return path;
    }

    fetchData () {
        Debug.log("Fetching data", COMPONENT);
        fetch(this.getPriceUrl())
            .then(res => res.json())
            .then(async (json) => {
                await this.checkData(json);
            })
            .catch((err) => {
                Debug.error("Data Fetch failed", COMPONENT);
                Debug.error(err, COMPONENT);
            });
    }

    async checkData (newData) {
        const timestamp = Date.now();
        console.log("============ OLD ============");
        console.log(this.lastResponse);
        console.log("============ NEW ============");
        console.log(newData);

        const outputRelevant = [];
        let dataChanged = false;

        Object.keys(newData.prices).forEach((station) => {
            const prices = newData.prices[station];
            const lastPrices = this.lastResponse[station];

            if (prices.status !== "open") {
                return;
            }

            const data = {
                e5: this._priceToInt(prices.e5),
                e10: this._priceToInt(prices.e10),
                diesel: this._priceToInt(prices.diesel)
            };

            if (lastPrices === null || (data.e5 !== lastPrices.e5 || data.e10 !== lastPrices.e10 || data.diesel !== lastPrices.diesel)) {
                DatabaseManager.addEntry(station, data, timestamp);
                dataChanged = true;
            }

            RELEVANT_TYPES.forEach((type) => {
                if (lastPrices === null || data[type] !== lastPrices[type]) {
                    outputRelevant.push(station);
                }
            });
        });

        if (dataChanged) {
            await this.loadCache();
        }

        if (outputRelevant.length) {
            CommandManager.invokeCommand("sendOutput", outputRelevant);
        }
    }

    getCurrentPrices () {
        const data = [];
        Object.keys(this.lastResponse).forEach((station) => {
            const lastPrices = this.lastResponse[station];
            if (lastPrices === null) {
                return;
            }

            const stationDetails = this.stations.find((details) => {
                return details.id === station;
            });

            const stationData = {
                id: station,
                name: stationDetails?.name || "",
                prices: []
            };

            RELEVANT_TYPES.forEach((type) => {
                stationData.prices.push({
                    name: TYPES[type],
                    value: this._intToPrice(lastPrices[type])
                });
            });

            data.push(stationData);
        });
        return data;
    }

    _priceToInt (price) {
        return parseInt(price.toString().replaceAll(".", ""), 10);
    }

    _intToPrice (int) {
        return (int / 1000).toFixed(3).slice(0, -1).replaceAll(".", ",");
    }
}

export const DataManger = new _DataManger();