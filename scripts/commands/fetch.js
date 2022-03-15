import { DataManger } from "../DataManager.js";

const COMPONENT = "commands/fetch";

export const fetch = {
    name: "fetch",
    data: {
        "name": "fetch",
        "type": 1,
        "description": "Fetch now for new data"
    },
    interaction: fetchInteraction
};

async function fetchInteraction (interaction) {
    await interaction.deferReply({ ephemeral: true });

    await DataManger.fetchData();

    interaction.editReply({ content: "Fetched new data", ephemeral: true });
}
