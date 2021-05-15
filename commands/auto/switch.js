module.exports.run = async (client, message) => {
    try {
        const { bank } = require('../../database/bank');
        const input = message.content.slice(1).trim();
        const [, , arguments] = input.match(/(\w+)\s*([\s\S]*)/);

        let switchCodeGet = bank.currency.getSwitchCode(message.author.id);

        if (arguments.length < 1) {
            if (switchCodeGet && switchCodeGet !== "None") return message.reply(`Your Nintendo Switch friend code is ${switchCodeGet}.`)
            return message.reply(`Please specify a valid Nintendo Switch friend code.`);
        };
        let switchcode = /^(?:SW)?[- ]?([0-9]{4})[- ]?([0-9]{4})[- ]?([0-9]{4})$/.exec(arguments);

        if (!switchcode) return message.reply(`Please specify a valid Nintendo Switch friend code.`);

        switchcode = `SW-${switchcode[1]}-${switchcode[2]}-${switchcode[3]}`;
        bank.currency.switchCode(message.author.id, switchcode);
        return message.reply(`Successfully updated your Nintendo Switch friend code.`)

    } catch (e) {
        // log error
        const logger = require('../../util/logger');

        logger(e, client, message);
    };
};

module.exports.config = {
    name: "switch",
    aliases: ["fc", "friendcode"],
    description: "Updates your Switch friend code.",
    options: [{
        name: "switch-fc",
        type: "STRING",
        description: "SW-1234-1234-1234"
    }]
};