import { DatabaseManager } from "../DatabaseManager.js";

const COMPONENT = "commands/debugHistory";

export const debugHistory = {
    name: "debug_history",
    data: {
        "name": "debug_history",
        "type": 1,
        "description": "Returns the 10 latest entries"
    },
    interaction: historyInteraction
};

async function historyInteraction (interaction) {
    await interaction.deferReply({ ephemeral: true });

    const result = await DatabaseManager.getLastEntries(10);

    interaction.editReply({ content: JSON.stringify(result, null, 4), ephemeral: true });
}
