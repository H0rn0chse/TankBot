import { STATIONS } from "../../globals.js";
import { DatabaseManager } from "../DatabaseManager.js";

const COMPONENT = "commands/stats";

export const stats = {
    name: "stats",
    data: {
        "name": "stats",
        "type": 1,
        "description": "Returns statistics of the last 7 days"
    },
    interaction: statsInteraction
};

function getToday () {
    const now = new Date();
    const day = now.getDate().toString().padStart(2, "0");
    const month = (now.getMonth() + 1).toString().padStart(2, "0");
    const year = now.getFullYear().toString();
    const dateString = `${month}.${day}.${year}`;
    const today = new Date(dateString);
    return today;
}

async function statsInteraction (interaction) {
    await interaction.deferReply({ ephemeral: true });

    let response = "";
    const day_ms = 24 * 60 * 60 * 1000;
    const seven_days_ms = 7 * day_ms;
    const today = getToday();
    const timestamp = today.getTime() - seven_days_ms;

    const result = await DatabaseManager.getEntries(timestamp);

    STATIONS.forEach((station) => {
        response += `\n**${station.name}**`;
        for (let i = 0; i < 7; i++) {
            const start = getStartDate(today, i);

            const end = getEndDate(today, i);
            const entries = filterEntries(result, station.id, start.getTime(), end.getTime());

            if (entries.length === 0) {
                return;
            }

            response += `\n${getDayName(start)}    ⇩${intToPrice(getLow(entries, "e5"))}    ⇧${intToPrice(getHigh(entries, "e5"))}`;
        }
    });

    interaction.editReply({ content: response, ephemeral: true });
}

function intToPrice (int) {
    return (int/ 1000).toFixed(3).slice(0, -1).replaceAll(".", ",");
}

function getLow (entries, category) {
    return entries.reduce((min, entry) => {
        if (entry[category] < min) {
            return entry[category];
        }
        return min;
    }, 9999);
}

function getHigh (entries, category) {
    return entries.reduce((max, entry) => {
        if (entry[category] > max) {
            return entry[category];
        }
        return max;
    }, 0);
}

function getDayName (date) {
    return date.toLocaleString("de", { weekday: "long" });
}

function getStartDate (today, offset) {
    const start = new Date(today.getTime());
    start.setDate(today.getDate() - offset);
    start.setHours(0, 0, 0, 0);
    return start;
}

function getEndDate (today, offset) {
    const dayBefore = getStartDate(today, offset - 1);
    const end = new Date(dayBefore.getTime() - 1);
    return end;
}

function filterEntries (entries, station, start, end) {
    return entries.filter((entry) => {
        return entry.station === station
        && entry.timestamp >= start
        && entry.timestamp <= end;
    });
}


