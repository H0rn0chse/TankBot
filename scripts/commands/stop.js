import { DiscordManager } from "../DiscordManager.js";

export const stop = {
    name: "stop",
    data: {
        "name": "stop",
        "type": 1,
        "description": "Bot Shutdown"
    },
    interaction: stopInteraction,
    invoke: stopHandler
};

function stopInteraction (interaction) {
    interaction.reply({ content:"Shutting Down in 5 seconds...", ephemeral: true });

    setTimeout(stopHandler, 5000);
}

function stopHandler () {
    DiscordManager.logoff();
    process.exit();
}
