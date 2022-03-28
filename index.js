import * as dotenv from "dotenv";
import * as fs from "fs";

import { dirname } from "./globals.js";
import { CommandManager } from "./scripts/CommandManager.js";
import { DiscordManager } from "./scripts/DiscordManager.js";
import { DataManger } from "./scripts/DataManager.js";

// commands
import { addDebug, removeDebug, sendDebug } from "./scripts/commands/debug.js";
import { addOutput, removeOutput, sendOutput } from "./scripts/commands/output.js";
import { stop } from "./scripts/commands/stop.js";
import { checkAlarm, setAlarm } from "./scripts/commands/alarm.js";
import { ping } from "./scripts/commands/ping.js";
import { fetch } from "./scripts/commands/fetch.js";
import { debugHistory } from "./scripts/commands/debugHistory.js";
import { stats } from "./scripts/commands/stats.js";
import { addDaily, removeDaily, sendDaily } from "./scripts/commands/daily.js";

dotenv.config();

process.on("SIGINT", () => {
    fs.appendFileSync(`${dirname}/process.log`, "Received SIGINT\n");
    try {
        DiscordManager.logoff();
        DataManger.stopListen();
    } catch (err) {
        console.error(err);
    }

    process.exit();
});

//emitted when an uncaught JavaScript exception bubbles
process.on("uncaughtException", (err) => {
    fs.appendFileSync(`${dirname}/process.log`, `Caught exception: ${err}\n${err.stack || " no stack"}\n`);
});

//emitted whenever a Promise is rejected and no error handler is attached to it
process.on("unhandledRejection", async (err, promise) => {
    fs.appendFileSync(`${dirname}/process.log`, `Unhandled Rejection: ${err}\n${err.stack || " no stack"}\n`);
});

const commands = [
    addDebug,
    removeDebug,
    sendDebug,
    addOutput,
    removeOutput,
    sendOutput,
    setAlarm,
    checkAlarm,
    stop,
    ping,
    fetch,
    debugHistory,
    stats,
    addDaily,
    removeDaily,
    sendDaily
];

DiscordManager.login(process.env.DISCORD_TOKEN)
    .then(() => {
        console.log("Discord login successful!");

        return DiscordManager.getAllCommands();
    })
    .then((registeredCommands) => {
        return registerCommands(commands, registeredCommands);
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

async function registerCommands (newCommands, oldCommands) {
    const newCommandMap = newCommands.reduce((map, command) => {
        map[command.name] = command;
        return map;
    }, {});

    const oldCommandMap = oldCommands.reduce((map, command) => {
        map[command.name] = command;
        return map;
    }, {});

    // delete unused commands
    console.log("🟦 Delete undefined interactions ==========================");
    for (const name in oldCommandMap) {
        const command = oldCommandMap[name];
        if (!newCommandMap[name]) {

            console.log(`🟨 Deleting command "${command.name}"`);
            DiscordManager.deleteCommand(command.id);
        }
    }

    // Update bot handlers
    console.log("🟦 Updating Bot handlers ==========================");
    for (const name in newCommandMap) {
        const command = newCommandMap[name];
        await registerCommand(command);
    }

    // Bulk Update interactions
    console.log("🟦 Bulk Update interactions ==========================");
    const interactionsRequest = newCommands.reduce((list, command) => {
        if (command.data && command.interaction) {
            const data = JSON.parse(JSON.stringify(command.data));
            const oldCOmmand = oldCommandMap[data.name];
            if (oldCOmmand) {
                data.id = oldCOmmand.id;
            }
            list.push(data);
        }
        return list;
    }, []);
    await DiscordManager.updateBulkCommands(interactionsRequest);
}

async function registerCommand (command) {
    if (command.name) {
        console.log(`Adding command "${command.name}"`);
        if (command.data && command.interaction) {
            console.log(" ...as interaction");
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
