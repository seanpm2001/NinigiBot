exports.run = async (client, interaction) => {
    const logger = require('../../util/logger');
    // Import globals
    let globalVars = require('../../events/ready');
    try {
        const sendMessage = require('../../util/sendMessage');
        const api_user = require('../../database/dbServices/user.api');

        let ephemeral = true;
        await interaction.deferReply({ ephemeral: ephemeral });
        let day = interaction.options.getInteger("day");
        let month = interaction.options.getInteger("month");

        if (day < 1 || day > 31 || month < 1 || month > 12) return sendMessage({ client: client, interaction: interaction, content: `Please specify a valid birthday.` });
        // Birthdays are stored as string DDMM instead of being seperated by a -
        if (day < 10) day = `0${day}`;
        if (month < 10) month = `0${month}`;
        api_user.setBirthday(interaction.user.id, birthday[1] + birthday[2]);

        return sendMessage({ client: client, interaction: interaction, content: `Updated your birthday to \`${day}-${month}\` (dd-mm).` });

    } catch (e) {
        // Log error
        logger(e, client, interaction);
    };
};

module.exports.config = {
    name: "birthday",
    description: "Update your birthday.",
    options: [{
        name: "day",
        type: "INTEGER",
        description: "Birth day of the month.",
        required: true
    }, {
        name: "month",
        type: "INTEGER",
        description: "Birth month of the year.",
        required: true
    }]
};