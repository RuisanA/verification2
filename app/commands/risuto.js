const { Client, Intents, MessageEmbed, MessageActionRow, MessageButton } = require("discord.js");
const axios = require('axios');
const fs = require('fs');

module.exports = {
  data: {
    name: "showlist",
    description: "権限を持っている人の一覧を表示します",
  },
  async execute(interaction) {
    const configData = fs.readFileSync("config.json", 'utf8');
    const config = JSON.parse(configData);
    const admin = config.admin_list
    if(!admin.includes(interaction.user.id)) return interaction.reply({ content: "BOT管理者しか使えません", ephemeral: true })
    const embed = new MessageEmbed()
    .setTitle("ホワイトリスト:")
    .setDescription(`>>> ${config.white_list.map(id => `<@${id}>`).join("\n")}`)
    .setColor("RANDOM")
    interaction.reply({ embeds: [ embed ], ephemeral: true })
  },
};
