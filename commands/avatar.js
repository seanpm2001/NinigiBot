module.exports.run = async (bot, client, message, args) => {
    let msg = await message.channel.send("Using Psychic to find the desired image...");
    let target = message.mentions.users.first() || message.author;

    await message.channel.send({
        files: [
            {
                attachment: target.displayAvatarURL,
                name: "avatar.png"
            }
        ]
    })
    msg.delete();
};

module.exports.help = {
    name: "Avatar",
    description: "Shows a user's avatar.",
    usage: `avatar [@user]`
};