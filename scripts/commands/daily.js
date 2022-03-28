import { STATIONS } from "../../globals.js";
import { DatabaseManager } from "../DatabaseManager.js";
import { Debug } from "../Debug.js";
import { DiscordManager } from "../DiscordManager.js";

const COMPONENT = "commands/daily";

export const addDaily = {
    name: "add_daily",
    data: {
        "name": "add_daily",
        "type": 1,
        "description": "Register for the daily report"
    },
    interaction: addDailyInteraction
};

async function addDailyInteraction (interaction) {
    if (!this.config.daily) {
        this.config.daily = {};
    }
    const user = interaction.user.id;

    this.config.daily[user] = {
        lastDaily: Date.now()
    };
    await this.saveConfig();
    Debug.log(`${user} was registered for daily`, COMPONENT);
    interaction.reply({ content: "Registered to daily report", ephemeral: true });
}

export const removeDaily = {
    name: "remove_daily",
    data: {
        "name": "remove_daily",
        "type": 1,
        "description": "Unregister from the daily report"
    },
    interaction: removeDailyInteraction
};

async function removeDailyInteraction (interaction) {
    if (!this.config.daily) {
        this.config.daily = {};
    }
    const user = interaction.user.id;

    delete this.config.daily[user];
    await this.saveConfig();
    Debug.log(`${user} was unregistered from daily`, COMPONENT);
    interaction.reply({ content: "Unregistered from daily report", ephemeral: true });
}

export const sendDaily = {
    name: "sendDaily",
    invoke: invokeSendDaily
};

async function invokeSendDaily () {
    // no daily was set
    if (!this.config.daily) {
        return;
    }

    const promises = Object.keys(this.config.daily).map(async (userId) => {
        const data = this.config.daily[userId];

        const now = new Date();
        const lastDaily = new Date(data.lastDaily);

        // no daily required
        if (now.getDate() === lastDaily.getDate()) {
            return;
        }

        // update daily timestamp
        data.lastDaily = now.getTime();
        await this.saveConfig();
        Debug.log(`Sending daily to ${userId}`, COMPONENT);

        let message = "";
        const day_ms = 24 * 60 * 60 * 1000;
        const today = getToday();
        const timestamp = today.getTime() - day_ms;
        const result = await DatabaseManager.getEntries(timestamp);

        STATIONS.forEach((station) => {
            message += `\n**${station.name}**`;

            const entries = result.filter((entry) => {
                return entry.station === station.id;
            });

            if (!entries.length) {
                return;
            }

            const highValue = getHigh(entries, "e5");
            const lowValue = getLow(entries, "e5");

            entries.forEach((entry) => {
                if (entry.e5 === highValue) {
                    message += `\n${getClock(entry.timestamp)}    ${intToPrice(entry.e5)} (max)`;
                } else if (entry.e5 === lowValue) {
                    message += `\n${getClock(entry.timestamp)}    ${intToPrice(entry.e5)} (min)`;
                } else {
                    message += `\n${getClock(entry.timestamp)}    ${intToPrice(entry.e5)}`;
                }
            });

        });

        const user = await DiscordManager.getUser(userId);
        await DiscordManager.dm(user, message);
    });
    return Promise.all(promises);
}

function getClock (timestamp) {
    const date = new Date(timestamp);
    const hours = date.getHours().toString().padStart(2, "0");
    const mins = date.getMinutes().toString().padStart(2, "0");
    return `${hours}:${mins}`;
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

function getToday () {
    const now = new Date();
    const day = (now.getDate()).toString().padStart(2, "0");
    const month = (now.getMonth() + 1).toString().padStart(2, "0");
    const year = now.getFullYear().toString();
    const dateString = `${month}.${day}.${year}`;
    const today = new Date(dateString);
    return today;
}

function intToPrice (int) {
    return (int/ 1000).toFixed(3).slice(0, -1).replaceAll(".", ",");
}
