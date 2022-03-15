import { Debug } from "../Debug.js";
import { DiscordManager } from "../DiscordManager.js";

const COMPONENT = "commands/alarm";

export const setAlarm = {
    name: "set_alarm",
    data: {
        "name": "set_alarm",
        "type": 1,
        "description": "Set minimum value for price alarm. Set value to <=0 to remove it.",
        "options": [
            {
                "name": "min_value",
                "description": "The output channel",
                "type": 10,
                "required": true
            }
        ]
    },
    interaction: setAlarmInteraction
};

async function setAlarmInteraction (interaction) {
    if (!this.config.alarm) {
        this.config.alarm = {};
    }
    const userInput = interaction.options.getNumber("min_value");
    const value = _priceToInt(userInput);
    const user = interaction.user.id;

    if (value > 0) {
        this.config.alarm[user] = {
            minValue: value
        };
        await this.saveConfig();
        Debug.log(`Alarm was set to ${value} for ${user}`, COMPONENT);
        interaction.reply({ content: "Alarm was set", ephemeral: true });
    } else {
        delete this.config.alarm[user];
        await this.saveConfig();
        Debug.log(`Alarm was removed for ${user}`, COMPONENT);
        interaction.reply({ content: "Alarm was removed", ephemeral: true });
    }
}

export const checkAlarm = {
    name: "checkAlarm",
    invoke: invokeCheckAlarm
};

async function invokeCheckAlarm (stationName, lastPrice, newPrice) {
    // no alarm was set
    if (!this.config.alarm) {
        return;
    }

    const promises = Object.keys(this.config.alarm).map(async (userId) => {
        const data = this.config.alarm[userId];

        // ALARM
        if (newPrice <= data.minValue) {
            // was already set
            if (lastPrice <= data.minValue) {
                return;
            }

            //Set Alarm
            Debug.log(`Sending alarm to ${userId}`, COMPONENT);
            const message = `[ALARM]: ${stationName} hat den Preis für Super auf ${_intToPrice(newPrice)} gesenkt`;
            const user = await DiscordManager.getUser(userId);
            DiscordManager.dm(user, message);
        } else {
            // alarm was set with last check
            if (lastPrice <= data.minValue) {
                //Unset Alarm
                Debug.log(`Clearing alarm to ${userId}`, COMPONENT);
                const message = `[ENTWARNUNG]: ${stationName} hat den Preis für Super wieder auf ${_intToPrice(newPrice)} erhöht`;
                const user = await DiscordManager.getUser(userId);
                DiscordManager.dm(user, message);
            }
        }
    });
    return Promise.all(promises);
}

function _priceToInt (price) {
    // enforce 9 as third and last digit
    const formattedPrice = `${price.toFixed(2)}9`;
    const int = parseInt(formattedPrice.replaceAll(".", ""), 10);
    return int;
}

function _intToPrice (int) {
    return (int/ 1000).toFixed(3).slice(0, -1).replaceAll(".", ",");
}
