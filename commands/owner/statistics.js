import Discord from "discord.js";
import sendMessage from "../../util/sendMessage";
import logger from "../../util/logger";
import globalVars from "../../objects/globalVars.json" with { type: "json" };
import fs from "fs";
import isOwner from "../../util/isOwner";

export default async (client, interaction) => {
    try {
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
                if ([Discord.ChannelType.GuildVoice, Discord.ChannelType.GuildText].includes(channel.type)) channelCount += 1;
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

    } catch (e) {
        logger(e, client, interaction);
    };
};

export const config = {
    name: "statistics",
    aliases: [],
    description: "Print Ninigi stats.",
    serverID: ["759344085420605471"]
};