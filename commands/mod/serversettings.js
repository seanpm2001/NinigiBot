exports.run = async (client, interaction, logger, globalVars) => {
    try {
        const sendMessage = require('../../util/sendMessage');
        const textChannelTypes = require('../../objects/discord/textChannelTypes.json');
        const isAdmin = require('../../util/isAdmin');
        let adminBool = isAdmin(client, interaction.member);
        const { StarboardChannels } = require('../../database/dbServices/server.api');
        const { StarboardLimits } = require('../../database/dbServices/server.api');
        if (!interaction.member.permissions.has("MANAGE_CHANNELS") && !adminBool) return sendMessage({ client: client, interaction: interaction, content: globalVars.lackPerms });

        let ephemeral = true;
        await interaction.deferReply({ ephemeral: ephemeral });
        let disableBool = false;
        let disableArg = interaction.options.getBoolean("disable");
        if (disableArg === true) disableBool = disableArg;
        let channelArg = interaction.options.getChannel("channel");
        switch (interaction.options.getSubcommand()) {
            case "starboard":
                let oldStarboardChannel = await StarboardChannels.findOne({ where: { server_id: interaction.guild.id } });
                let oldStarLimitDB = await StarboardLimits.findOne({ where: { server_id: interaction.guild.id } });
                let starlimit = null;
                if (oldStarLimitDB) {
                    starlimit = oldStarLimitDB.star_limit;
                } else {
                    starlimit = globalVars.starboardLimit;
                };
                if (!Object.keys(textChannelTypes).includes(channelArg.type)) return sendMessage({ client: client, interaction: interaction, content: `No text can be sent to ${channelArg}'s type (${channelArg.type}) of channel. Please select a text channel.` })
                let starlimitArg = interaction.options.getInteger("starlimit");
                if (starlimitArg) {
                    starlimit = starlimitArg;
                    if (oldStarLimitDB) await oldStarLimitDB.destroy();
                    await StarboardLimits.upsert({ server_id: interaction.guild.id, star_limit: starlimit });
                };
                // Database
                if (oldStarboardChannel) await oldStarboardChannel.destroy();
                if (disableBool) return sendMessage({ client: client, interaction: interaction, content: `Disabled starboard functionality.` });
                await StarboardChannels.upsert({ server_id: interaction.guild.id, channel_id: channelArg.id });
                return sendMessage({ client: client, interaction: interaction, content: `${channelArg} is now **${interaction.guild.name}**'s starboard. ${starlimit} stars are required for a message to appear there.` });
                break;
            case "log":
                const { LogChannels } = require('../../database/dbServices/server.api');
                let oldLogChannel = await LogChannels.findOne({ where: { server_id: interaction.guild.id } });
                let channelArg = interaction.options.getChannel("channel");
                if (!Object.keys(textChannelTypes).includes(channelArg.type)) return sendMessage({ client: client, interaction: interaction, content: `No text can be sent to ${channelArg}'s type (${channelArg.type}) of channel. Please select a text channel.` })
                if (oldLogChannel) await oldLogChannel.destroy();
                if (disableBool) return sendMessage({ client: client, interaction: interaction, content: `Disabled logging functionality in **${interaction.guild.name}**.` });
                await LogChannels.upsert({ server_id: interaction.guild.id, channel_id: channelArg.id });
                return sendMessage({ client: client, interaction: interaction, content: `Logging has been added to ${channelArg}.` });
                break;
            case "automod":
                let scamKeywords = [
                    "http.?:\/\/(dicsord-nitro|discrod-egifts|steamnitro|discordgift|discordc|discorcl|dizcord|dicsord|dlscord|dlcsorcl|dlisocrd|djscord-airdrops).(com|org|ru|click|gift|net)",// Discord gift links
                    // "http.?:\/\/.*\.ru", // Russian websites, should fix, re-add and enable this for any servers that aren't russian when language is done. Currently matches any URL containing "ru" after a period. Can't seem to replicate this on online regex testers though
                    "http.?:\/\/gidthub.com"
                ];
                let advertisementKeywords = [
                    "discord.gg",
                    "bit.ly",
                    "twitch.tv"
                ];
                let autoModObject = {
                    name: `Ninigi AutoMod`,
                    enabled: true,
                    eventType: 1,
                    triggerType: 1,
                    triggerMetadata:
                    {
                        regexPatterns: scamKeywords
                    },
                    actions: [
                        {
                            type: 1,
                            metadata: {
                                customMessage: `Blocked by ${client.user.username} AutoMod rule.`,
                                channel: channelArg.id
                            }
                        },
                        {
                            type: 2,
                            metadata: {
                                channel: channelArg.id
                            }
                        },
                        {
                            type: 3,
                            metadata: {
                                durationSeconds: 3600 // 1 hour
                            }
                        }
                    ],
                    reason: `Requested by ${interaction.user.username}.`
                };
                // TESTING
                const { ModEnabledServers } = require('../../database/dbServices/server.api');
                const isOwner = require('../../util/isOwner');
                let ownerBool = await isOwner(client, interaction.user);
                let allGuilds = await client.guilds.fetch();
                if (ownerBool) {
                    await allGuilds.forEach(async (guild) => {
                        let automodServerID = await ModEnabledServers.findOne({ where: { server_id: guild.id } });
                        if (automodServerID) {
                            console.log(guild.name);
                            try {
                                await interaction.guild.autoModerationRules.create(autoModObject);
                                console.log(`Added AutoMod rule to ${guild.name}`);
                            } catch (e) {
                                console.log(`Failed to add AutoMod rule to ${guild.name}`);
                            };
                        };
                    })
                    ////
                } else {
                    if (interaction.options.getBoolean("advertisement")) autoModObject.triggerMetadata.keywordFilter = advertisementKeywords;
                    try {
                        await interaction.guild.autoModerationRules.create(autoModObject);
                    } catch (e) {
                        // console.log(e);
                        return sendMessage({ client: client, interaction: interaction, content: `Failed to add AutoMod rule. Make sure **${interaction.guild.name}** does not already have the maximum amount of AutoMod rules.` });
                    }
                    return sendMessage({ client: client, interaction: interaction, content: `AutoMod rules added to **${interaction.guild.name}**.\nAutoMod notiications will be sent to <#${interaction.channel.id}>.` });
                };
                break;
            case "togglepersonalroles":
                const { PersonalRoleServers } = require('../../database/dbServices/server.api');
                let personalRolesServerID = await PersonalRoleServers.findOne({ where: { server_id: interaction.guild.id } });
                // Database
                if (personalRolesServerID) {
                    await personalRolesServerID.destroy();
                    return sendMessage({ client: client, interaction: interaction, content: `Personal Roles can no longer be managed by users in **${interaction.guild.name}**.` });
                } else {
                    await PersonalRoleServers.upsert({ server_id: interaction.guild.id });
                    return sendMessage({ client: client, interaction: interaction, content: `Personal Roles can now be managed by users in **${interaction.guild.name}**.` });
                };
                break;
        };

    } catch (e) {
        // Log error
        logger(e, client, interaction);
    };
};

module.exports.config = {
    name: "serversettings",
    description: "Change server settings.",
    options: [{
        name: "starboard",
        type: "SUB_COMMAND",
        description: "Choose a starboard channel.",
        options: [{
            name: "channel",
            type: "CHANNEL",
            description: "Specify channel.",
            required: true
        }, {
            name: "starlimit",
            type: "INTEGER",
            description: "Required amount of stars on a message.",
            minValue: 1
        }, {
            name: "disable",
            type: "BOOLEAN",
            description: "Disable starboard."
        }]
    }, {
        name: "log",
        type: "SUB_COMMAND",
        description: "Choose a channel to log to.",
        options: [{
            name: "channel",
            type: "CHANNEL",
            description: "Specify channel.",
            required: true
        }, {
            name: "disable",
            type: "BOOLEAN",
            description: "Disable logging."
        }]
    }, {
        name: "automod",
        type: "SUB_COMMAND",
        description: "Adds bot's AutoMod rules to this server.",
        options: [{
            name: "channel",
            type: "CHANNEL",
            description: "Specify channel.",
            required: true
        }, {
            name: "advertisement",
            type: "BOOLEAN",
            description: "Enable AutoMod for advertisements."
        }]
    }, {
        name: "togglepersonalroles",
        type: "SUB_COMMAND",
        description: "Toggle personal roles in this server."
    }]
};