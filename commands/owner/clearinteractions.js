exports.run = async (client, interaction, args = interaction.options._hoistedOptions) => {
    const logger = require('../../util/logger');
    // Import globals
    let globalVars = require('../../events/ready');
    try {
        const sendMessage = require('../../util/sendMessage');
        if (message.member.id !== client.config.ownerID) return sendMessage({ client: client, interaction: interaction, content: globalVars.lackPerms });


        await sendMessage({ client: client, interaction: interaction, content: `Removing all slash commands, context menus etc. might take a while. It might take up to an hour for them to vanish on Discord's end.` })
        // Delete all global commands
        await client.application.commands.set([]);

        // Delete all guild commands
        await client.guilds.cache.forEach(guild => {
            try {
                guild.commands.set([]);
            } catch (e) {
                // console.log(e);
            };
        });

        return sendMessage({ client: client, interaction: interaction, content: `Removed all slash commands, context menus etc.` });

    } catch (e) {
        // Log error
        logger(e, client, interaction);
    };
};

module.exports.config = {
    name: "clearinteractions",
    description: "Clears all slash commands and other interactions.",
    serverID: "759344085420605471"
};