const sendMessage = require('../../util/sendMessage');

module.exports.run = async (client, message) => {
    try {
        const sendMessage = require('../../util/sendMessage');
        const { bank } = require('../../database/bank');
        const input = message.content.slice(1).trim();
        const [, , arguments] = input.match(/(\w+)\s*([\s\S]*)/);

        if (arguments.length < 1) return sendMessage(client, message, `Please specify a valid birthday in dd-mm format.`);

        let birthday = /^(0[1-9]|[12][0-9]|3[01])[- /.](0[1-9]|1[012])/.exec(arguments);

        if (!birthday) return sendMessage(client, message, `Please specify a valid birthday in dd-mm format.`);

        bank.currency.birthday(message.author.id, birthday[1] + birthday[2]);
        return sendMessage(client, message, `Successfully updated your birthday.`);

    } catch (e) {
        // log error
        const logger = require('../../util/logger');

        logger(e, client, message);
    };
};

module.exports.config = {
    name: "birthday",
    aliases: ["bday", "birth"],
    description: "Updates your birthday",
    options: [{
        name: "birthday",
        type: "STRING",
        description: "Birthday in \"dd-mm\" format.",
        required: true
    }]
};