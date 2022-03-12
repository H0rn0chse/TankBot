import * as dotenv from "dotenv";
import { DiscordBase } from "./DiscordBase.js";

dotenv.config();

class _DiscordManager extends DiscordBase {
    constructor () {
        super();
        this.botName = "!tanky";
        this.guildId = process.env.DISCORD_GUILD_ID;
    }
}

export const DiscordManager = new _DiscordManager();
