import {
    EmbedBuilder,
    SlashCommandBuilder,
    SlashCommandStringOption,
    SlashCommandBooleanOption,
    SlashCommandSubcommandBuilder,
    SlashCommandSubcommandGroupBuilder,
    bold,
    time,
    TimestampStyles
} from "discord.js";
import axios from "axios";
import sendMessage from "../../util/sendMessage.js";
import normalizeString from "../../util/string/normalizeString.js";
import globalVars from "../../objects/globalVars.json" with { type: "json" };

const api = "https://helldiverstrainingmanual.com/api/v1/";
const liberationString = "Liberation";
const defenseString = "Defense";

export default async (interaction, ephemeral) => {
    let ephemeralArg = interaction.options.getBoolean("ephemeral");
    if (ephemeralArg !== null) ephemeral = ephemeralArg;
    // Can be split off to only proc on successfull data retrievals but this is cleaner for now. 
    // This command isn't popular anyways
    let campaignStatus = await axios.get(`${api}war/campaign`);

    await interaction.deferReply({ ephemeral: ephemeral });
    let helldiversEmbed = new EmbedBuilder()
        .setColor(globalVars.embedColor);

    switch (interaction.options.getSubcommand()) {
        case "planet":
            let inputPlanet = interaction.options.getString("name");
            let planetsResponse = await axios.get(`${api}planets`);
            let planetsData = planetsResponse.data;
            let planetObject = Object.entries(planetsData).find(([key, value]) => normalizeString(value.name) == normalizeString(inputPlanet));
            if (!planetObject) return sendMessage({ interaction: interaction, content: "Could not find the specified planet." });
            let planetIndex = planetObject[0];
            planetObject = planetObject[1];
            let planetSector = `${planetObject.sector} Sector`;
            // Campaign status data is of all planets, so always requested and then checked if requested planet is in the data
            let campaignStatusPlanet = campaignStatus.data.find(planet => planet.planetIndex == planetIndex);
            let campaignStatusString = "";
            if (campaignStatusPlanet) {
                campaignStatusString = `${liberationString} vs. ${campaignStatusPlanet.faction}`;
                if (campaignStatusPlanet.defense == true) campaignStatusString = campaignStatusString.replace(liberationString, defenseString);
                campaignStatusString += `\nProgress: ${Math.round(campaignStatusPlanet.percentage * 100) / 100}%\nHelldivers: ${campaignStatusPlanet.players}`;
                if (campaignStatusPlanet.expireDateTime) campaignStatusString += `\nWithdrawal ${time(Math.floor(campaignStatusPlanet.expireDateTime), TimestampStyles.RelativeTime)}`;
            };
            let planetBiome = null;
            if (planetObject.biome) {
                planetBiome = planetObject.biome.slug.charAt(0).toUpperCase() + planetObject.biome.slug.slice(1); // Capitalize first letter
                helldiversEmbed.addFields([{ name: `${planetBiome} Biome:`, value: planetObject.biome.description, inline: false }]);
            };
            // Environmental effects like earthquakes, extreme weather effects etc.
            let environmentals = "None.";
            if (planetObject.environmentals && planetObject.environmentals.length > 0) {
                environmentals = "";
                planetObject.environmentals.forEach(environmental => {
                    environmentals += `${bold(`${environmental.name}:`)} ${environmental.description}\n`;
                });
            };
            helldiversEmbed
                .setTitle(`${planetObject.name} - ${planetSector}`)
                .addFields([{ name: "Environmentals:", value: environmentals, inline: true }]);
            if (campaignStatusPlanet) helldiversEmbed.addFields([{ name: "Campaign Status:", value: campaignStatusString, inline: false }]);
            break;
        case "campaign":
            campaignStatus = campaignStatus.data;
            await campaignStatus.forEach(async planet => {
                let planetStatusTitle = planet.name;
                if (planet.majorOrder) planetStatusTitle += ` (Major Order)`;
                let planetStatusString = `${liberationString} vs. ${planet.faction}`;
                if (planet.defense == true) planetStatusString = planetStatusString.replace(liberationString, defenseString);
                planetStatusString += `\nProgress: ${Math.round(planet.percentage * 100) / 100}%\nHelldivers: ${planet.players}`;
                if (planet.expireDateTime) planetStatusString += `\nWithdrawal ${time(Math.floor(planet.expireDateTime), TimestampStyles.RelativeTime)}`;
                // Only add field if there are no fields or fields are under 25
                if (!helldiversEmbed.data.fields || helldiversEmbed.data.fields.length < 25) {
                    helldiversEmbed.addFields([{ name: `${planet.name}`, value: planetStatusString, inline: true }]);
                } else {
                    helldiversEmbed.setFooter({ text: "More planets are currently available but could not fit in this embed." });
                };
            });
            helldiversEmbed.setTitle("Campaign Status");
            break;
    };
    return sendMessage({ interaction: interaction, embeds: helldiversEmbed, ephemeral: ephemeral });
};

// String options
const planetOption = new SlashCommandStringOption()
    .setName("name")
    .setDescription("Specify planet by name.")
    .setAutocomplete(true)
    .setRequired(true);
// Boolean options
const ephemeralOption = new SlashCommandBooleanOption()
    .setName("ephemeral")
    .setDescription(globalVars.ephemeralOptionDescription);
// Subcommands
const planetSubcommand = new SlashCommandSubcommandBuilder()
    .setName("planet")
    .setDescription("Get info on a planet.")
    .addStringOption(planetOption)
    .addBooleanOption(ephemeralOption);
const campaignSubcommand = new SlashCommandSubcommandBuilder()
    .setName("campaign")
    .setDescription("Get info on current campaigns.")
    .addBooleanOption(ephemeralOption);
// Subcommand groups
const helldivers2SubcommandGroup = new SlashCommandSubcommandGroupBuilder()
    .setName("2")
    .setDescription("Helldivers 2.")
    .addSubcommand(planetSubcommand)
    .addSubcommand(campaignSubcommand);
// Full command
export const commandObject = new SlashCommandBuilder()
    .setName("helldivers")
    .setDescription("Shows Helldivers info.")
    .addSubcommandGroup(helldivers2SubcommandGroup);