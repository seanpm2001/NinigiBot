import {
    SlashCommandBooleanOption,
    SlashCommandBuilder
} from "discord.js";
import logger from "../../util/logger.js";
import sendMessage from "../../util/sendMessage.js";
import globalVars from "../../objects/globalVars.json" with { type: "json" };
import { getMoney } from "../../database/dbServices/user.api.js";

export default async (interaction, ephemeral) => {
    try {
        let ephemeralArg = interaction.options.getBoolean("ephemeral");
        if (ephemeralArg !== null) ephemeral = ephemeralArg;
        let dbBalance = await getMoney(interaction.user.id);
        return sendMessage({ client: interaction.client, interaction: interaction, content: `You have ${Math.floor(dbBalance)}${globalVars.currency}.`, ephemeral: ephemeral });

    } catch (e) {
        logger({ exception: e, interaction: interaction });
    };
};

// Boolean options
const ephemeralOption = new SlashCommandBooleanOption()
    .setName("ephemeral")
    .setDescription(globalVars.ephemeralOptionDescription);
// Final command
export const commandObject = new SlashCommandBuilder()
    .setName("balance")
    .setDescription("Shows how much money you have.")
    .addBooleanOption(ephemeralOption);