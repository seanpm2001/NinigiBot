exports.run = async (client, message, args = []) => {
    const logger = require('../../util/logger');
    // Import globals
    let globalVars = require('../../events/ready');
    try {
        const sendMessage = require('../../util/sendMessage');
        const isAdmin = require('../../util/isAdmin');
        let adminBool = await isAdmin(client, message.member);
        if (!message.member.permissions.has("MANAGE_MEMBERS") && !adminBool) return sendMessage(client, message, globalVars.lackPerms);

        // Default time the user is muted in minutes
        let muteTime = 60;

        // Get user
        if (!args[0]) return sendMessage(client, message, `Please provide a mentioned user as an argument.`);

        if (args[1]) {
            muteTime = args[1];
            if (isNaN(muteTime) || 1 > muteTime) return sendMessage(client, message, `Please provide a valid number.`);
            if (muteTime > 10080) muteTime = 10080;
        };

        let member;
        if (message.mentions && (message.mentions.members.size > 0 || message.mentions.repliedUser)) {
            member = message.mentions.members.first();
        };
        if (!member) {
            let memberID = args[0];
            try {
                member = await message.guild.members.fetch(memberID);
            } catch (e) {
                // console.log(e);
            };
        };
        if (!member) return sendMessage(client, message, `Please use a proper mention if you want to mute someone.`);

        // Check permissions
        let userRole = message.member.roles.highest;
        let targetRole = member.roles.highest;
        if (targetRole.position >= userRole.position && !adminBool) return sendMessage(client, message, `You don't have a high enough role to mute **${member.user.tag}** (${member.id}).`);

        // If already muted, unmute. If not, mute.
        let isMuted = member.roles.cache.find(r => r.name.toLowerCase() == muteRoleName);
        if (isMuted) {
            // Remove timeout (if possible)
            // await member.roles.remove(role);
            return sendMessage(client, message, `Unmuted **${member.user.tag}** (${member.id}).`);
        } else {
            // Timeout logic
            // await member.roles.add(role);
            // sendMessage(client, message, `Muted **${member.user.tag}** (${member.id}) for ${muteTime} minute(s).`);
            // // sets a timeout to unmute the user.
            // setTimeout(async () => { await member.roles.remove(role) }, muteTime * 60 * 1000);
        };

    } catch (e) {
        // Log error
        logger(e, client, message);
    };
};

module.exports.config = {
    name: "Mute",
    type: "USER"
};