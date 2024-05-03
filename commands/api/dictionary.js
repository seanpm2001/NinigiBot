const Discord = require("discord.js");
exports.run = async (client, interaction, logger, globalVars, ephemeral = true) => {
    try {
        const sendMessage = require('../../util/sendMessage');
        const axios = require("axios");
        let api = "https://api.dictionaryapi.dev/api/v2/";

        let ephemeralArg = interaction.options.getBoolean("ephemeral");
        if (ephemeralArg !== null) ephemeral = ephemeralArg;
        await interaction.deferReply({ ephemeral: ephemeral });
        let dictionaryEmbed = new Discord.EmbedBuilder()
            .setColor(globalVars.embedColor);

        let inputWord = interaction.options.getString("word");
        let inputWordType = interaction.options.getString("wordtype");

        try {
            wordStatus = await Promise.race([
                axios.get(`${api}entries/en/${inputWord}`),
                new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 5000))
            ]);
            wordStatus = wordStatus.data;
        } catch (error) {
            let errorEmbed = new Discord.EmbedBuilder()
                .setColor('#FF0000')
                .setTitle("Error")
                .setDescription("Word not found.");
            return sendMessage({ client: client, interaction: interaction, embeds: errorEmbed, ephemeral: ephemeral });
        };

        let wordMeaning;
        outerLoop:
        for (let i = 0; i < wordStatus.length; i++) {
            if (inputWordType) {
                for (let meaning of wordStatus[i].meanings) {
                    if (meaning.partOfSpeech.toLowerCase() === inputWordType.toLowerCase()) {
                        wordMeaning = meaning;
                        break outerLoop;
                    };
                };
            };
        };
        if (!wordMeaning) wordMeaning = wordStatus[0].meanings[0];

        let wordStatusTitle = wordStatus[0].word;
        let wordPhonetic = wordStatus[0].phonetic;
        await wordMeaning.definitions.forEach(definition => {
            let wordDefinition = definition.definition;
            let wordExample = definition.example;
            let wordSynonyms = definition.synonyms;
            let wordAntonyms = definition.antonyms;
            let wordDefinitionString = "";
            if (wordExample) wordDefinitionString += `Example: ${wordExample}\n`;
            if (wordSynonyms.length > 0) wordDefinitionString += `Synonyms: ${wordSynonyms.join(', ')}\n`;
            if (wordAntonyms.length > 0) wordDefinitionString += `Antonyms: ${wordAntonyms.join(', ')}\n`;
            if (wordDefinitionString.length == 0) wordDefinitionString = "No example, synonyms or antonyms found.";
            dictionaryEmbed.addFields([{ name: definition.definition, value: wordDefinitionString, inline: false }]);
        });
        let wordType = wordMeaning.partOfSpeech;
        let wordSourceUrls = wordStatus[0].sourceUrls;

        dictionaryEmbed
            .setTitle(`${wordStatusTitle}, ${wordType}`)
            .setURL(wordSourceUrls[0])
            .setDescription(wordPhonetic);

        return sendMessage({ client: client, interaction: interaction, embeds: dictionaryEmbed, ephemeral: ephemeral });

    } catch (e) {
        // Log error
        logger(e, client, interaction);
    };
};

module.exports.config = {
    name: "dictionary",
    description: `Get definition of a word.`,
    options: [{
        name: "word",
        type: Discord.ApplicationCommandOptionType.String,
        description: "Specify word to look up.",
        required: true
    }, {
        name: "wordtype",
        type: Discord.ApplicationCommandOptionType.String,
        description: "Select type of word",
        choices: [
            { name: "noun", value: "noun" },
            { name: "verb", value: "verb" },
            { name: "adjective", value: "adjective" }
        ]
    }, {
        name: "ephemeral",
        type: Discord.ApplicationCommandOptionType.Boolean,
        description: "Whether the reply will be private."
    }]
};