import * as dotenv from "dotenv";

import { CommandManager } from "./scripts/CommandManager.js";
import { DiscordManager } from "./scripts/DiscordManager.js";
import { DataManger } from "./scripts/DataManager.js";

// commands
import { addDebug, removeDebug, sendDebug } from "./scripts/commands/debug.js";
import { addOutput, removeOutput, sendOutput } from "./scripts/commands/output.js";
import { stop } from "./scripts/commands/stop.js";
import { REREGISTER_INTERACTIONS } from "./globals.js";

dotenv.config();

const commands = [
    addDebug,
    removeDebug,
    sendDebug,
    addOutput,
    removeOutput,
    sendOutput,
    stop
];

DiscordManager.login(process.env.DISCORD_TOKEN)
    .then(() => {
        console.log("Discord login successful!");

        return commands.reduce(async (chain, command) => {
            await chain;
            await registerCommand(command);
        }, Promise.resolve());
    })
    .then(() => {
        console.log("Discord interactions update successful!");
        DataManger.setToken(process.env.TANKERKOENIG_API_KEY);
        return DataManger.loadCache();
    })
    .then(() => {
        console.log("DataManager successfully loaded!");
        DataManger.startListen();
    })
    .then(() => {
        console.log("DataManager is now listening...");
    })
    .catch((err) => {
        console.error(err);
    });

process.on("SIGINT", () => {
    //DataManger.stopListen();
    DiscordManager.logoff();
    process.exit();
});

async function registerCommand (command) {
    if (command.name) {
        console.log(`Adding command "${command.name}"`);
        if (command.data && command.interaction) {
            console.log(" ...as interaction");
            if (REREGISTER_INTERACTIONS) {
                await DiscordManager.registerCommand(command.data);
            }
            CommandManager.setInteraction(command.name, command.interaction);
        }

        if (command.invoke) {
            console.log(" ...as invoke");
            CommandManager.setInvokeCommand(command.name, command.invoke);
        }

        if (command.doNotDebug) {
            console.log(" ...as no debug");
            CommandManager.addIgnoreChannel(command.name);
        }

        // might not work due to command changes
        if (command.channel) {
            console.log(" ...as channel");
            CommandManager.setChannelCommand(command.name, command.channel);
        }

        if (command.dm) {
            console.log(" ...as dm");
            CommandManager.setDmCommand(command.name, command.dm);
        }
    }
}
