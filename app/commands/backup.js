const { Client, Intents, MessageEmbed, MessageActionRow, MessageButton, MessageAttachment } = require("discord.js");
const client = new Client({
  partials: ["CHANNEL"],
  intents: new Intents(32767)
});
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
const wait = require('util').promisify(setTimeout);

module.exports = {
  data: {
    name: "backup",
    description: "登録されている人を全員追加",
  },
  async execute(interaction) {
    const arr = []
    const configPath = './config.json';
    const configData = fs.readFileSync(configPath, 'utf8');
    const config = JSON.parse(configData);
   if((!config.admin_list.includes(interaction.user.id) && !config.white_list.includes(interaction.user.id)) || !interaction.member.permissions.has("ADMINISTRATOR")) return interaction.reply({ content: "コマンドの実行権限がありません", ephemeral: true })
    const json_ = fs.readFileSync("tokens.json", 'utf8')
    const jsonData = JSON.parse(json_)
    const list = jsonData.map(obj => Object.keys(obj)[0])
    config.call_now = Math.floor(Date.now()/1000)+list.length;
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
    let tokens = new MessageAttachment(Buffer.from(json_), `tokens.json`);
    const msg = await interaction.reply(`バックアップしています...\n終了予定:<t:${Math.floor(Date.now()/1000)+list.length}:R>`)
    const head = {
      'Authorization': `Bot ${process.env.DISCORD_BOT_TOKEN}`,
      'Content-Type': 'application/json'
    };
    let result = [0,0,0]
    let del_count = 0
    for (let i=list.length-1;i>=0;i--){
      const token = await getToken(list[i])
      const data = {
        access_token: token
      };
      axios.put(`https://discord.com/api/guilds/${interaction.guild.id}/members/${list[i]}`, data, {
        headers: head
      })
      .then(async (response) => {
        if(response.status == 201){
          result[0]++
        }else if(response.status == 204){
          result[1]++
        }
        console.log(`${i}:${response.status}`)
        arr.push(`${i}:${response.status}`)
      })
      .catch(err => {
        result[2]++
        if(err.response && err.response.status === 403){
          jsonData.splice(i, 1);
          del_count++;
        }
        console.log(`${i}:${err.response.status}`)
        arr.push(`${i}:${err.response.status}`)
      })
      await wait(1000)
      if(i == 0){
        console.log("終了")
        fs.writeFileSync("tokens.json", JSON.stringify(jsonData, null, 2), 'utf8');
        const configData_ = fs.readFileSync(configPath, 'utf8');
        const config_ = JSON.parse(configData);
        config_.call_now = false;
        let f = false
        for(let i=0;i<config_.call_count.length;i++){
          const entry = config_.call_count[i];
          if(entry.hasOwnProperty(interaction.guild.id)){
            const current = entry[interaction.guild.id]
            entry[interaction.guild.id] = current+1;
            f = true
          }
        }
        const json = `{ "${interaction.guild.id}": 1 }`
        if(f == false) config_.call_count.push(JSON.parse(json))
        fs.writeFileSync(configPath, JSON.stringify(config_, null, 2));
        const embed = new MessageEmbed()
        .setTitle(`バックアップ終了`)
        .setDescription(`バックアップ結果`)
        .addField("追加成功",`${result[0]}人`)
        .addField("追加済み",`${result[1]}人`)
        .addField("追加失敗",`${result[2]}人`)
        .setColor("RANDOM")
        .setTimestamp()
        interaction.channel.send({ embeds: [ embed ] })
      }
    }
  },
};

client.login(process.env.DISCORD_BOT_TOKEN)