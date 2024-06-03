import Discord from "discord.js";
import logger from "../util/logger";
import { LogChannels } from '../database/dbServices/server.api';

export default async (client, role) => {
    try {
        let logChannel = await LogChannels.findOne({ where: { server_id: role.guild.id } });
        if (!logChannel) return;
        let log = role.guild.channels.cache.find(channel => channel.id == logChannel.channel_id);
        if (!log) return;

        let botMember = role.guild.members.me;
        if (log.permissionsFor(botMember).has(Discord.PermissionFlagsBits.SendMessages) && log.permissionsFor(botMember).has(Discord.PermissionFlagsBits.EmbedLinks)) {
            const fetchedLogs = await role.guild.fetchAuditLogs({
                limit: 1,
                type: Discord.AuditLogEvent.RoleDelete
            });
            let deleteLog = fetchedLogs.entries.first();
            if (deleteLog && deleteLog.createdTimestamp < (Date.now() - 5000)) deleteLog = null;
            let executor;
            if (deleteLog) {
                const { executor: deleteExecutor, target } = deleteLog;
                if (target.id !== role.id) return;
                executor = deleteExecutor;
            };
            // Role color
            let embedColor = role.hexColor;
            let roleColorText = role.hexColor;
            if (!embedColor || embedColor == "#000000") {
                embedColor = client.globalVars.embedColor;
                roleColorText = null;
            };
            let icon = role.guild.iconURL(client.globalVars.displayAvatarSettings);

            const deleteEmbed = new Discord.EmbedBuilder()
                .setColor(embedColor)
                .setThumbnail(icon)
                .setTitle(`Role Deleted ❌`)
                .setDescription(role.name)
                .setFooter({ text: role.id })
                .setTimestamp();
            if (roleColorText) deleteEmbed.addFields([{ name: 'Color:', value: role.hexColor, inline: true }]);
            if (executor) deleteEmbed.addFields([{ name: 'Deleted By:', value: `${executor} (${executor.id})`, inline: true }])
            return log.send({ embeds: [deleteEmbed] });
        } else if (log.permissionsFor(botMember).has(Discord.PermissionFlagsBits.SendMessages) && !log.permissionsFor(botMember).has(Discord.PermissionFlagsBits.EmbedLinks)) {
            try {
                return log.send({ content: `I lack permissions to send embeds in ${log}.` });
            } catch (e) {
                // console.log(e);
                return;
            };
        } else {
            return;
        };

    } catch (e) {
        // Log error
        logger(e, client);
    };
};