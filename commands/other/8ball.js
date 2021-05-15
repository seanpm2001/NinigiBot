exports.run = async (client, message) => {
    // Import globals
    let globalVars = require('../../events/ready');
    try {
        let args = message.content.split(` `);
        const { Prefixes } = require('../../database/dbObjects');
        let prefix = await Prefixes.findOne({ where: { server_id: message.guild.id } });
        if (prefix) {
            prefix = prefix.prefix;
        } else {
            prefix = globalVars.prefix;
        };

        let commandName = "8ball";
        if (!message.content.toLowerCase().startsWith(`${prefix}8ball`)) commandName = "Magic Conch";

        if (!args[1]) return message.channel.send(`> You need to provide something for the ${commandName} to consider.`);

        const answers = ["Maybe someday", "Nothing", "Neither", "I don't think so", "No", "Yes", "Try asking again", "Definitely", "Probably not"];
        const randomAnswer = answers[Math.floor(Math.random() * answers.length)];

        return message.channel.send(`> The ${commandName} says: "${randomAnswer}.".`);

    } catch (e) {
        // log error
        const logger = require('../../util/logger');

        logger(e, client, message);
    };
};

module.exports.config = {
    name: "8ball",
    aliases: ["magicconch", "mc"],
    description: "Ask the magic 8ball for knowledge.",
    options: [{
        name: "Question.",
        type: "STRING",
        description: "Your burning question.",
        required: true
    }]
};
