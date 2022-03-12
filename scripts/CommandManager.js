import * as path from "path";
import * as fs from "fs";
import { Debug } from "./Debug.js";
import { DiscordManager } from "./DiscordManager.js";
import { LOCAL_FOLDER, dirname } from "../globals.js";

const dir = path.join(dirname, LOCAL_FOLDER);
if (!fs.existsSync(dir)){
    fs.mkdirSync(dir);
}

const configFile = path.join(dirname, LOCAL_FOLDER, "config.json");
const COMPONENT = "CommandManager";

class _CommandManager {
    constructor () {
        this.channelCommands = {};
        this.dmCommands = {};
        this.invokeCommands = {};

        // commands containing private informations
        this.doNotDebug = [];
        this.currentCommand = null;

        this.interactions = {};

        this.config = null;
        this.loadConfig();
    }

    setChannelCommand (name, handler) {
        this.channelCommands[name] = handler;
    }

    setDmCommand (name, handler) {
        this.dmCommands[name] = handler;
    }

    setInvokeCommand (name, handler) {
        this.invokeCommands[name] = handler;
    }

    addIgnoreChannel (name) {
        if (this.doNotDebug.includes(name)) {
            return;
        }
        this.doNotDebug.push(name);
    }

    setInteraction (name, handler) {
        this.interactions[name] = handler;
    }

    async loadConfig () {
        if (!fs.existsSync(configFile)) {
            this.config = {};
            return;
        }

        const json = await fs.promises.readFile(configFile);
        this.config = JSON.parse(json);
    }

    async saveConfig () {
        const json = JSON.stringify(this.config, null, 2);
        await fs.promises.writeFile(configFile, json);
    }

    async invokeCommand (command, ...args) {
        const handler = this.invokeCommands[command];

        if (!handler) {
            return;
        }

        await handler.apply(this, args);
    }

    async execCommand (discordMessage, command, args, isDM) {
        if (!this.doNotDebug.includes(command)) {
            Debug.log(`command: ${command}, args: ${JSON.stringify(args)}`, COMPONENT);
        } else {
            Debug.log(`command: ${command}, args: <private>`, COMPONENT);
        }

        if (this.currentCommand) {
            DiscordManager.reply(discordMessage, "There is already a command running! Please wait until it's done and submit your command again");
            return;
        }

        const handler = isDM ? this.dmCommands[command] : this.channelCommands[command];

        if (!handler) {
            DiscordManager.reply(discordMessage, `The command "${command}" does not exist or is not enabled for this scope`);
            return;
        }

        this.currentCommand = command;

        try {
            await handler.call(this, discordMessage, ...args);
        } catch (err) {
            Debug.error(err.message);
        }

        this.currentCommand = null;
    }

    async execInteraction (name, interaction) {
        const handler = this.interactions[name];

        if (!handler) {
            await interaction.reply(`The command ${name} does not have a handler!`);
        } else {
            try {
                await handler.call(this, interaction);
            } catch (err) {
                Debug.error(err.message);
            }
        }
    }
}

export const CommandManager = new _CommandManager();
