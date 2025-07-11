const { Client, Intents, MessageEmbed, MessageActionRow, MessageButton } = require("discord.js");
const fs = require('fs');
const filePath = 'tokens.json';
const data = fs.readFileSync(filePath, 'utf8');
const tokensData = JSON.parse(data);
const totalMembers = tokensData.reduce((count, entry) => count + Object.keys(entry).length, 0);
module.exports = {
  data: {
    name: "backup-check",
    description: "バックアップできるメンバー数を表示します",
  },
  async execute(interaction) {
    if(require("config.json").call_now == true) return interaction.reply("現在バックアップが行われています")
    const embed = new MessageEmbed()
    .addField("バックアップ可能な人数","```" + `${totalMembers}人` + "```")
    .setColor("RANDOM")
    await interaction.reply({ embeds: [ embed ] })
  }
}