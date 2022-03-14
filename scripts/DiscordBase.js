import * as dotenv from "dotenv";
import { ChannelManager, Client } from "discord.js";
import fetch from "node-fetch";

import { CommandManager } from "./CommandManager.js";
import { Deferred } from "./Deferred.js";
import { REMOVE_ALL_INTERACTIONS } from "../globals.js";

dotenv.config();
const debugRequest = false;
const apiVersion = "v9";

export class DiscordBase {
    constructor () {
        this.botName = "!bot";
        this.guildId = "";
        this.sentMessages = [];
        this.readyDeferred = new Deferred();

        this.token = null;
        this.applicationId = process.env.DISCORD_APPLICATION_ID;
        this.client = new Client({ intents: [] });
        this.channelManager = new ChannelManager(this.client);

        this.client.once("ready", () => {
            this.readyDeferred.resolve();
            this.client.on("message", this.onMessage);
            this.client.on("interactionCreate", this.onInteraction);
        });
    }

    async _request (method, endpoint, body = "", headers = {}) {
        const url = `https://discord.com/api/${apiVersion}${endpoint}`;
        const options = {
            method,
            headers,
        };

        if (body) {
            if (typeof body !== "string") {
                options.body = JSON.stringify(body);
                options.headers["Content-Type"] = "application/json";
            } else {
                options.body = body;
            }
        }

        options.headers.Authorization = `Bot ${this.token}`;

        if (debugRequest) {
            console.log(url);
            console.log(options);
        }


        const response = await fetch(url, options);
        let result;
        try {
            result = await response.json();
        } catch (err) {
            result = {};
        }

        if (!response.ok) {
            console.error(`request failed: ${response.statusText}`);
            console.error(JSON.stringify(result, null, 4));
            throw new Error(`Request failed: ${response.statusText}`);
        }

        if (debugRequest) {
            console.log(`request successful: ${response.status}`);
            console.log(JSON.stringify(result, null, 4));
        }
        return result;
    }

    /**
     * https://discord.com/developers/docs/interactions/application-commands#registering-a-command
     * @param {object} body
     */
    async registerCommand (body) {
        await this._request("POST", `/applications/${this.applicationId}/guilds/${this.guildId}/commands`, body);
    }

    async deleteAllCommands () {
        const commands = await this._request("GET", `/applications/${this.applicationId}/guilds/${this.guildId}/commands`);
        for (const command of commands) {
            await this._request("DELETE", `/applications/${this.applicationId}/guilds/${this.guildId}/commands/${command.id}`);
        }
    }

    async login (token) {
        this.token = token;
        await this.client.login(token);
        await this.setStatus();
        if (REMOVE_ALL_INTERACTIONS) {
            await this.deleteAllCommands();
        }

        return this.readyDeferred.promise;
    }

    async setStatus (name = "Idling", type = "COMPETING") {
        await this.client.user.setActivity({
            name: name,
            type: type,
        });
    }

    onMessage (message) {
        const isDM = !message.guild;

        if (message.content.startsWith(this.botName)) {
            let [start, command, ...args] = message.content.split(" ");

            CommandManager.execCommand(message, command, args, isDM);

            if (!isDM) {
                //return message.delete({ timeout: 1000 });
            }
        }
    }

    async onInteraction (interaction) {
        if (!interaction.isCommand()) {
            return;
        }

        return CommandManager.execInteraction(interaction.commandName, interaction);
    }

    async reply (message, replyMessage, timeout = true) {
        const newMessage = await message.reply(replyMessage);
        if (timeout) {
            await newMessage.delete({ timeout: 5000 });
        }
    }

    async send (channel, message, timeout) {
        if (typeof channel === "string") {
            channel = await this.channelManager.fetch(channel);
        }
        const sentMessage = await channel.send(message);
        if (timeout) {
            return sentMessage.delete({ timeout: timeout * 1000 });
        } else if (timeout !== false) {
            this.sentMessages.push(sentMessage);
        }
    }

    async getUser (userId) {
        const user = await this.client.users.fetch(userId);
        return user;
    }

    async dm (user, message) {
        const channel = await user.createDM();
        return this.send(channel, message, false);
    }

    async deleteAllMessages () {
        if (this.sentMessages.length === 0) {
            return;
        }

        for (let i=0; i < this.sentMessages.length; i++) {
            const message = this.sentMessages[i];
            await message.delete();
        }
        this.sentMessages = [];
    }

    logoff () {
        this.client?.destroy();
    }
}
