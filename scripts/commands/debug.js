import { DiscordManager } from "../DiscordManager.js";

export const addDebug = {
    name: "add_debug",
    data: {
        "name": "add_debug",
        "type": 1,
        "description": "Add a channel as debug output",
        "options": [
            {
                "name": "channel",
                "description": "The debug channel",
                "type": 7,
                "channel_types": [0],
                "required": true
            }
        ]
    },
    //channel: addDebugChannel,
    interaction: addDebugInteraction
};

async function addDebugInteraction (interaction) {
    const channel = interaction.options.getChannel("channel");
    await addDebugHandler.call(this, channel.id);
    interaction.reply({ content: "Added Debug Channel", ephemeral: true });
}

async function addDebugChannel (discordMessage) {
    const channelId = discordMessage.channel.id;
    await addDebugHandler.call(this, channelId);
}

async function addDebugHandler (channelId) {
    if (!Array.isArray(this.config.debugChannels)) {
        this.config.debugChannels = [];
    }

    if (!this.config.debugChannels.includes(channelId)) {
        this.config.debugChannels.push(channelId);
    }
    await this.saveConfig();
}


export const removeDebug = {
    name: "remove_debug",
    data: {
        "name": "remove_debug",
        "type": 1,
        "description": "Removes a channel from debug",
        "options": [
            {
                "name": "channel",
                "description": "The debug channel",
                "type": 7,
                "channel_types": [0],
                "required": true
            }
        ]
    },
    //channel: removeDebugChannel,
    interaction: removeDebugInteraction
};

async function removeDebugInteraction (interaction) {
    const channel = interaction.options.getChannel("channel");
    const result = await removeDebugHandler.call(this, channel.id);
    if (result) {
        interaction.reply({ content: "Removed Debug Channel", ephemeral: true });
    } else {
        interaction.reply({ content: "Channel was not registered as debug", ephemeral: true });
    }

}

async function removeDebugChannel (discordMessage) {
    const channelId = discordMessage.channel.id;
    await removeDebugHandler.call(this, channelId);
}

async function removeDebugHandler (channelId) {
    if (!Array.isArray(this.config.debugChannels)) {
        return;
    }
    const index = this.config.debugChannels.findIndex((channel) => {
        return channel === channelId;
    });
    if (index > -1) {
        this.config.debugChannels.splice(index, 1);
    } else {
        return false;
    }
    await this.saveConfig();
    return true;
}

export const sendDebug = {
    name: "sendDebug",
    invoke: sendDebugInvoke
};

async function sendDebugInvoke (msg) {
    if (!Array.isArray(this.config.debugChannels)) {
        return;
    }
    this.config.debugChannels.forEach((channel) => {
        DiscordManager.send(channel, msg);
    });
}

