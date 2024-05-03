const Discord = require("discord.js");
exports.run = async (client, interaction, logger, globalVars) => {
    try {
        const sendMessage = require('../../util/sendMessage');
        const fs = require("fs");
        const isOwner = require('../../util/isOwner');
        let ownerBool = await isOwner(client, interaction.user);
        if (!ownerBool) return sendMessage({ client: client, interaction: interaction, content: globalVars.lackPerms });

        let ephemeral = true;
        await interaction.deferReply({ ephemeral: ephemeral });

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
        await fs.writeFile('name.csv', csv, 'utf8', function (err) {
            if (err) {
                resultString = "An error occured while writing JSON Object to a CSV file."
            } else {
                console.log('It\'s saved!');
            }
        });
        return sendMessage({ client: client, interaction: interaction, content: `wah wah wah` });

    } catch (e) {
        // Log error
        logger(e, client, interaction);
    };
};

module.exports.config = {
    name: "statistics",
    aliases: [],
    description: "Print Ninigi stats.",
    serverID: ["759344085420605471"]
};