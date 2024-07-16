import { ChannelType } from "discord.js";
import fs from "fs";
import sendMessage from "../../util/sendMessage";
import isOwner from "../../util/isOwner";
import globalVars from "../../objects/globalVars.json" with { type: "json" };

export default async (client, interaction) => {
    let ownerBool = await isOwner(client, interaction.user);
    if (!ownerBool) return sendMessage({ client: client, interaction: interaction, content: globalVars.lackPerms });

    let ephemeral = true;
    await interaction.deferReply({ ephemeral: ephemeral });
    // Decide on format: CSV or JSON?
    let dataObject = {
        "Guild_ID": [],
        "Guild_Name": [],
        "Guild_Created_At": [],
        "Guild_Region": [],
        "Guild_Owner": [],
        "Guild_Member_Count": [],
        "Guild_Channel_Count": [],
        "Guild_Role_Count": [],
        "Guild_Emoji_Count": [],
        "Guild_Boost_Count": [],
        "Ninigi_Joined_At": []
    }
    await client.guilds.fetch();
    await client.guilds.cache.forEach(async guild => {
        dataObject.Guild_ID.push(guild.id);
        dataObject.Guild_Name.push(guild.name);
        dataObject.Guild_Created_At.push(guild.createdAt);
        dataObject.Guild_Region.push(guild.preferredLocale);
        let guildOwner = await guild.fetchOwner();
        dataObject.Guild_Owner.push(guildOwner.user.tag);
        dataObject.Guild_Member_Count.push(guild.memberCount);
        let allGuildChannels = await guild.channels.fetch();
        let channelCount = 0;
        await allGuildChannels.forEach(async channel => {
            if ([ChannelType.GuildVoice, ChannelType.GuildText].includes(channel.type)) channelCount += 1;
        });
        dataObject.Guild_Channel_Count.push(channelCount);
        dataObject.Guild_Role_Count.push(guild.roles.cache.size);
        dataObject.Guild_Emoji_Count.push(guild.emojis.cache.size);
        dataObject.Guild_Boost_Count.push(guild.premiumSubscriptionCount);
    });
    let csvObject = {
        "rows": []
    };
    for await (const [key, value] of Object.entries(dataObject)) {
        csvObject.rows.push([key].concat(value));
    };
    let csv = `"${csvObject.rows.join('"\n"').replace(/,/g, '","')}"`;
    let resultString = ""
    fs.writeFile('name.csv', csv, 'utf8', function (err) {
        if (err) {
            resultString = "An error occured while writing JSON object to a CSV file."
        } else {
            resultString = "Successfully wrote JSON to CSV file."
        }
    });
    return sendMessage({ client: client, interaction: interaction, content: resultString, files: [] });
};

export const guildID = config.devServerID;

// Final command
export const commandObject = new SlashCommandBuilder()
    .setName("statistics")
    .setDescription("Print Ninigi stats.")
    .setDMPermission(false);