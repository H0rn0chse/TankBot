const COMPONENT = "commands/ping";

export const ping = {
    name: "ping",
    data: {
        "name": "ping",
        "type": 1,
        "description": "Ping!",
        "options": []
    },
    interaction: pingInteraction
};

async function pingInteraction (interaction) {
    interaction.reply({ content: "pong!", ephemeral: true });
}
