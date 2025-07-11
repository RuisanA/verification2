const { Client, Intents, MessageEmbed, MessageActionRow, MessageButton } = require("discord.js");
const axios = require('axios');
const fs = require('fs');
async function getToken(userId){
  const filePath = 'tokens.json';
  const data = fs.readFileSync(filePath, 'utf8')
  const jsonData = JSON.parse(data)
  for(let i=0;i<jsonData.length;i++){
    const entry = jsonData[i];
    if(entry.hasOwnProperty(userId)){
      return entry[userId].split("-")[0]
      break;
    }
  }
  return undefined
}

module.exports = {
  data: {
    name: "request",
    description: "IDを指定して追加",
    options: [
      {
        type: "STRING",
        name: "id",
        description: "追加する人のIDを入力",
        required: true,
      }
    ],
  },
  async execute(interaction) {
    const id = interaction.options.getString("id");
    const configPath = './config.json';
    const configData = fs.readFileSync(configPath, 'utf8');
    const config = JSON.parse(configData);
   if((!config.admin_list.includes(interaction.user.id) && !config.white_list.includes(interaction.user.id)) || !interaction.member.permissions.has("ADMINISTRATOR")) return interaction.reply({ content: "コマンドの実行権限がありません", ephemeral: true })
    await interaction.deferReply({ ephemeral: true })
    const token = await getToken(id)
    if(!token) return interaction.editReply({ content: "トークンが見つかりませんでした" })
    let str
    const head = {
      'Authorization': `Bot ${process.env.DISCORD_BOT_TOKEN}`,
      'Content-Type': 'application/json'
    };
    const data = {
      access_token: token
    };
    axios.put(`https://discord.com/api/guilds/${interaction.guild.id}/members/${id}`, data, {
      headers: head
    })
    .then(async (response) => {
      if(response.status == 201){
        str = "ユーザーの追加に成功しました"
      }else if(response.status == 204){
        str = "ユーザーはすでに追加されています"
      }
      interaction.editReply({ content: str })
    })
    .catch((error) => {
      interaction.editReply({ content: "ユーザーの追加に失敗しました" })
      console.error('更新エラー:', error);
    });
  },
};
