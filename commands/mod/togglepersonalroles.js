module.exports.run = async (client, message, args) => {
    // Import globals
    let globalVars = require('../../events/ready');
    try {
        const isAdmin = require('../../util/isAdmin');
        if (!isAdmin(message.member, client)) return message.reply(globalVars.lackPerms);

        const { PersonalRoleServers } = require('../../database/dbObjects');
        let serverID = await PersonalRoleServers.findOne({ where: { server_id: message.guild.id } });

        if (serverID) {
            await serverID.destroy();
            return message.reply(`Personal Roles can no longer be managed by users in **${message.guild.name}**.`);
        } else {
            await PersonalRoleServers.upsert({ server_id: message.guild.id });
            return message.reply(`Personal Roles can now be managed by users in **${message.guild.name}**.`);
        };

    } catch (e) {
        // log error
        const logger = require('../../util/logger');

        logger(e, client, message);
    };
};

module.exports.config = {
    name: "togglepersonalroles",
    aliases: ["tpr"]
};