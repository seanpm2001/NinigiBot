module.exports.run = async (client, message) => {
    // Import globals
    let globalVars = require('../../events/ready');
    try {
        const isAdmin = require('../../util/isAdmin');
        if (!message.member.permissions.has("KICK_MEMBERS") && !isAdmin(message.member, client)) return message.reply(globalVars.lackPerms);

        const args = message.content.split(' ');

        let member = message.mentions.members.first();
        let user = message.mentions.users.first();
        if (!member || !user) return message.reply(`Please mention someone to kick.`);

        let userRole = message.member.roles.highest;
        let targetRole = member.roles.highest;
        if (targetRole.position >= userRole.position && message.guild.ownerID !== message.author.id) return message.reply(`You don't have a high enough role to kick ${user.tag}.`);

        let reason = "Not specified.";
        if (args[2]) {
            reason = args.slice(2, args.length + 1);
            reason = reason.join(' ');
        };

        let kickReturn = `Successfully kicked ${user.tag} for reason: \`${reason}\`. (DM Succeeded)`;
        try {
            await user.send(`You've been kicked from **${message.guild.name}** for the following reason: \`${reason}\``);
        } catch (e) {
            // console.log(e);
            kickReturn = `Successfully kicked ${user.tag} for reason: \`${reason}\`. (DM Failed)`;
        };
        await member.kick([`${reason} -${message.author.tag}`]);
        return message.reply(kickReturn);

    } catch (e) {
        // log error
        const logger = require('../../util/logger');

        logger(e, client, message);
    };
};

module.exports.config = {
    name: "kick",
    aliases: [],
    description: "Kick a target user from the server.",
    options: [{
        name: "user-mention",
        type: "MENTIONABLE",
        description: "Specify user by mention."
    }, {
        name: "user-id",
        type: "STRING",
        description: "Specify user by ID."
    }]
};
