import { DataManger } from "../DataManager.js";
import { DiscordManager } from "../DiscordManager.js";

const COMPONENT = "commands/output";

export const addOutput = {
    name: "add_output",
    data: {
        "name": "add_output",
        "type": 1,
        "description": "Add a channel as text output",
        "options": [
            {
                "name": "channel",
                "description": "The output channel",
                "type": 7,
                "channel_types": [0],
                "required": true
            }
        ]
    },
    interaction: addOutputInteraction
};

async function addOutputInteraction (interaction) {
    const channel = interaction.options.getChannel("channel");

    if (!Array.isArray(this.config.outputChannels)) {
        this.config.outputChannels = [];
    }

    if (!this.config.outputChannels.includes(channel.id)) {
        this.config.outputChannels.push(channel.id);
    }
    await this.saveConfig();
    interaction.reply({ content: "Added Output Channel", ephemeral: true });
}

export const removeOutput = {
    name: "remove_output",
    data: {
        "name": "remove_output",
        "type": 1,
        "description": "Removes a channel from output",
        "options": [
            {
                "name": "channel",
                "description": "The output channel",
                "type": 7,
                "channel_types": [0],
                "required": true
            }
        ]
    },
    interaction: removeOutputInteraction
};

async function removeOutputInteraction (interaction) {
    const channel = interaction.options.getChannel("channel");
    const result = await removeOutputHandler.call(this, channel.id);

    if (result) {
        interaction.reply({ content: "Removed Output Channel", ephemeral: true });
    } else {
        interaction.reply({ content: "Channel was not registered as output", ephemeral: true });
    }

}

async function removeOutputHandler (channelId) {
    if (!Array.isArray(this.config.outputChannels)) {
        return;
    }
    const index = this.config.outputChannels.findIndex((channel) => {
        return channel === channelId;
    });
    if (index > -1) {
        this.config.outputChannels.splice(index, 1);
    } else {
        return false;
    }
    await this.saveConfig();
    return true;
}

export const sendOutput = {
    name: "sendOutput",
    invoke: sendOutputInvoke
};

async function sendOutputInvoke (relevantStations) {
    if (!Array.isArray(this.config.outputChannels)) {
        return;
    }

    const details = DataManger.getCurrentPrices();

    const promises = details.map((detail) => {
        if (!relevantStations.includes(detail.id)) {
            return;
        }

        let msg = `${detail.name}: `;
        detail.prices.forEach((price) => {
            msg += `${price.name}: ${price.value}₉ | `;
        });

        if (detail.prices.length) {
            msg = msg.slice(0, -3);
        }

        const promises = this.config.outputChannels.map((channel) => {
            return DiscordManager.send(channel, msg, false);
        });
        return Promise.all(promises);
    });
    return Promise.all(promises);
}

