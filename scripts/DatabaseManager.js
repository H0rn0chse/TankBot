import * as fs from "fs";
import * as path from "path";
import Database from "better-sqlite3";

import { LOCAL_FOLDER, dirname } from "../globals.js";

const dir = path.join(dirname, LOCAL_FOLDER);
if (!fs.existsSync(dir)){
    fs.mkdirSync(dir);
}

class _DatabaseManager {
    constructor () {
        try {
            this.db = new Database("local/data.db", { fileMustExist: true });
        } catch (err) {
            this.db = new Database("local/data.db");
            this.setup();
        }
    }

    setup () {
        const stmt = this.db.prepare(`CREATE TABLE entries (
            timestamp INT,
            station TEXT,
            e5 INT,
            e10 INT,
            diesel INT
        );`);

        stmt.run();
    }

    addEntry (station, data, timestamp) {
        if (!this.addStmt) {
            this.addStmt = this.db.prepare(`INSERT INTO entries (
                timestamp,
                station,
                e5,
                e10,
                diesel
            ) VALUES (
                @timestamp,
                @station,
                @e5,
                @e10,
                @diesel
            );`);
        }

        const entryData = {
            e5: data.e5,
            e10: data.e10,
            diesel: data.diesel,
            timestamp,
            station,
        };

        this.addStmt.run(entryData);
    }

    getEntries (timestamp) {
        if (!this.getStmt) {
            this.getStmt = this.db.prepare(`
            SELECT *
            FROM entries
            WHERE timestamp > @timestamp
            ;`);
        }

        return this.getStmt.all({ timestamp });
    }

    getLastEntries (amount) {
        if (!this.getLastStmt) {
            this.getLastStmt = this.db.prepare(`
            SELECT *
            FROM entries
            ORDER BY
                timestamp DESC
            LIMIT @amount
            ;`);
        }

        return this.getLastStmt.all({ amount });
    }

    getLastEntry (stations) {
        const result = [];
        if (!this.lastStmt) {
            this.lastStmt = this.db.prepare(`
            SELECT *
            FROM entries
            WHERE station = @station
            ORDER BY
                timestamp DESC
            ;`);
        }

        stations.forEach((station) => {
            const row = this.lastStmt.get({ station });
            if (row) {
                result.push(row);
            }
        });

        return result;
    }
}

export const DatabaseManager = new _DatabaseManager();
