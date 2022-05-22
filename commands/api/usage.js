exports.run = async (client, interaction, args = interaction.options._hoistedOptions) => {
    const logger = require('../../util/logger');
    // Import globals
    let globalVars = require('../../events/ready');
    try {
        // When converting to slash commands: add support for options below!
        const sendMessage = require('../../util/sendMessage');
        const Discord = require("discord.js");
        const axios = require("axios");
        let JSONresponse;

        let ephemeralArg = args.find(element => element.name == "ephemeral");
        if (ephemeralArg) ephemeral = ephemeralArg.value;

        // Initialize function, Usage stats API: https://www.smogon.com/forums/threads/usage-stats-api.3661849 (Some of this code is inspired by: https://github.com/DaWoblefet/BoTTT-III)
        const getData = async url => {
            try {
                const response = await axios.get(url);
                JSONresponse = response.data;
                lastMonthRank = JSONresponse.rank;
                wasSuccessful = true;
            } catch (error) {
                wasSuccessful = false;
                if (error.response.status = "404") {
                    if (error.response.statusText === "Service Unavailable") {
                        text = "Unable to communicate with the usage stats API. Tell fingerprint it's not working: https://www.smogon.com/forums/members/fingerprint.510904/";
                    } else {
                        text = "No usage data found for " + pokemon + ".";
                    };
                } else {
                    // console.log(error);
                };
            };
        };

        let pokemon = args.find(element => element.name == "pokemon").value;

        let format = "gen8vgc2022";
        let formatArg = args.find(element => element.name == "format");
        if (formatArg) format = formatArg.value;

        let monthArg = args.find(element => element.name == "month");
        let yearArg = args.find(element => element.name == "year");
        // Indexing makes it 1 lower than the "natural" number associated with a month, but we want last month's data anyways so that works itself out
        const date = new Date();
        let month = date.getMonth();
        if (month == 0) month = 12;
        let stringCurrentMonth = month;
        if (stringCurrentMonth < 10) stringCurrentMonth = "0" + stringCurrentMonth;
        if (monthArg) {
            if (monthArg.value < 13 && monthArg.value > 0) month = monthArg.value;
        };
        let stringMonth = month;
        if (stringMonth < 10) stringMonth = "0" + stringMonth;
        let year = date.getFullYear();
        if (yearArg) {
            if (yearArg.value > 2013 && yearArg.value < (year + 1)) year = yearArg.value; // Smogon stats only exist from 2014 onwards
        };

        let rating = "1500";
        let ratingTresholds = [0, 1500, 1630, 1760];
        if (format == "gen8ou") ratingTresholds = [0, 1500, 1695, 1825]; // OU has different rating tresholds
        let ratingArg = args.find(element => element.name == "rating");
        if (ratingArg) {
            if (ratingTresholds.includes(ratingArg.value)) rating = ratingArg.value;
        };

        let wasSuccessful = true;
        let triedLastMonth = false;
        let searchURL = `https://smogon-usage-stats.herokuapp.com/${year}/${stringMonth}/${format}/${rating}/${pokemon}`;

        await getData(searchURL);
        return useData();

        async function useData() {
            if (wasSuccessful) {
                // console.log(JSONresponse);
                if (Object.keys(JSONresponse.moves).length == 0) return sendMessage({ client: client, interaction: interaction, content: `Sorry, but ${JSONresponse.pokemon} only has ${JSONresponse.usage} usage (${JSONresponse.raw} total uses) in ${JSONresponse.tier} (${stringMonth}/${year}) so there's not enough data to form an embed!` });

                let moveStats = "";
                for await (const [key, value] of Object.entries(JSONresponse.moves)) {
                    moveStats = `${moveStats}\n${key}: ${value}`;
                };
                let itemStats = "";
                for await (const [key, value] of Object.entries(JSONresponse.items)) {
                    itemStats = `${itemStats}\n${key}: ${value}`;
                };
                let abilityStats = "";
                for await (const [key, value] of Object.entries(JSONresponse.abilities)) {
                    abilityStats = `${abilityStats}\n${key}: ${value}`;
                };
                let spreadStats = "";
                for await (const [key, value] of Object.entries(JSONresponse.spreads)) {
                    if (typeof value == "object") {
                        spreadStats = `${spreadStats}\n${key}:`;
                        for await (const [key2, value2] of Object.entries(value)) {
                            spreadStats = `${spreadStats}\n${key2}: ${value2}`;
                        };
                    } else {
                        spreadStats = `${spreadStats}\n${key}: ${value}`;
                    };
                };
                let teammateStats = "";
                for await (const [key, value] of Object.entries(JSONresponse.teammates)) {
                    teammateStats = `${teammateStats}\n${key}: ${value}`;
                };

                let usageEmbed = new Discord.MessageEmbed()
                    .setColor(globalVars.embedColor)
                    .setAuthor({ name: `${JSONresponse.pokemon} ${JSONresponse.tier} ${rating}+ (${stringMonth}/${year})` })
                    .setDescription(`#${JSONresponse.rank} | ${JSONresponse.usage} | ${JSONresponse.raw} uses`)
                    .addField("Moves:", moveStats, true)
                    .addField("Items:", itemStats, true)
                    .addField("Abilities:", abilityStats, true)
                    .addField("Spreads:", spreadStats, true)
                    .addField("Teammates:", teammateStats, true);

                return sendMessage({ client: client, interaction: interaction, embeds: usageEmbed });

                // Try month-1 in case it's early in the month and last month's stats haven't been posted yet :)
                // Downside to this approach is that it will try fetching on typos twice
            } else if (triedLastMonth == false && year == date.getYear() && month == stringCurrentMonth) {
                month = month - 1;
                if (month == 0) month = 12;
                stringMonth = month;
                if (stringMonth < 10) stringMonth = "0" + stringMonth;
                triedLastMonth = true;
                searchURL = `https://smogon-usage-stats.herokuapp.com/${year}/${stringMonth}/${format}/${rating}/${pokemon}`;

                await getData(searchURL);
                return useData();

            } else {
                // make generic embed to guide people to usage statistics :)
                // Buttons
                let usageButtons = new Discord.MessageActionRow()
                    .addComponents(new Discord.MessageButton({ label: 'Pikalytics', style: 'LINK', url: "https://pikalytics.com" }))
                    .addComponents(new Discord.MessageButton({ label: 'Showdown Usage', style: 'LINK', url: `https://www.smogon.com/stats/` }))
                    .addComponents(new Discord.MessageButton({ label: 'Showdown Usage (Detailed)', style: 'LINK', url: `https://www.smogon.com/stats/${year}-${stringMonth}/moveset/${format}-${rating}.txt` }));

                let replyText = `Sorry! Could not successfully fetch data for the inputs you provided. The most common reasons for this are spelling mistakes and a lack of Smogon data.
Here are some usage resources you might find usefull instead:`;

                return sendMessage({ client: client, interaction: interaction, content: replyText, components: usageButtons, ephemeral: ephemeral });
            };
        };

    } catch (e) {
        // Log error
        logger(e, client, interaction);
    };
};

module.exports.config = {
    name: "usage",
    aliases: [],
    description: "Shows Pokémon usage data.",
    options: [{
        name: "pokemon",
        type: "STRING",
        description: "Pokémon to get data on.",
        autocomplete: true,
        required: true
    }, {
        name: "format",
        type: "STRING",
        description: "Format to get data from.",
        autocomplete: true
    }, {
        name: "month",
        type: "INTEGER",
        description: "Month to get data from."
    }, {
        name: "year",
        type: "INTEGER",
        description: "Year to get data from."
    }, {
        name: "rating",
        type: "INTEGER",
        description: "Minimum rating to get data from.",
        autocomplete: true
    }, {
        name: "ephemeral",
        type: "BOOLEAN",
        description: "Whether this command is only visible to you."
    }]
};