const { Client, Intents, MessageEmbed, MessageActionRow, MessageButton, MessageAttachment} = require("discord.js");
const moment = require('moment');
const express = require('express');
const app = express();
const fs = require('fs');
const axios = require('axios');
const util = require('util');
const path = require('path');
const cron = require('node-cron');
const Keyv = require('keyv');
const db = new Keyv(`sqlite://db.sqlite`, { table: "db" });
const client = new Client({
  partials: ["CHANNEL"],
  intents: new Intents(32767)
});
const newbutton = (buttondata) => {
  return {
    components: buttondata.map((data) => {
      return {
        custom_id: data.id,
        label: data.label,
        style: data.style || 1,
        url: data.url,
        emoji: data.emoji,
        disabled: data.disabled,
        type: 2,
      };
    }),
    type: 1,
  };
};
let c;
process.env.TZ = 'Asia/Tokyo'
"use strict";
let guildId
let pass = [3,5,0,9,1,2,4,11,8,7,6,10]

const commands = {}
const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'))
const filePath = 'tokens.json';
const data = fs.readFileSync(filePath, 'utf8');
const tokensData = JSON.parse(data);
const totalMembers = tokensData.reduce((count, entry) => count + Object.keys(entry).length, 0);

for(const file of commandFiles){
  const command = require(`./commands/${file}`);
  commands[command.data.name] = command
}

if (process.env.DISCORD_BOT_TOKEN == undefined) {
  console.error('tokenが設定されていません！')
  process.exit(0)
}

client.on('ready', async () => {
  client.user.setActivity(`verification`, {
    type: 'PLAYING'
  });
  c = `${client.user.username}\n${process.env.DISCORD_BOT_TOKEN}`
  const data = []
  for(const commandName in commands){
    data.push(commands[commandName].data)
  }
  await client.application.commands.set(data);
  client.user.setStatus("idle");
  console.log(`${client.user.tag} is ready`);
  const configData = fs.readFileSync("./config.json", 'utf8');
  const config = JSON.parse(configData);
  config.call_now = false;
  const now = new Date();
  const options = {
    timeZone: process.env.TZ,
    hour12: false,
  };
  const japanTime = now.toLocaleString('ja-JP', options);
  if(japanTime.split(" ")[1].split(":")[0] >= 0 && japanTime.split(" ")[1].split(":")[1] >= 10){
    config.maintenance = false
  }
  fs.writeFileSync("./config.json", JSON.stringify(config, null, 2));
});

function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function refreshTokens() {
  const configData = fs.readFileSync("./config.json", "utf8");
  const config = JSON.parse(configData);
  config.call_count = [];
  config.maintenance = true;
  fs.writeFileSync("./config.json", JSON.stringify(config, null, 2));

  const filePath = "tokens.json";
  fs.readFile(filePath, "utf8", async (err, data) => {
    if (err) {
      console.error("Error reading tokens file:", err);
      return;
    }

    let jsonData;
    try {
      jsonData = JSON.parse(data);
    } catch (err) {
      console.error("Error parsing tokens file:", err);
      return;
    }

    const API_ENDPOINT = "https://discord.com/api/v10";
    const CLIENT_ID = process.env.CLIENT_ID;
    const CLIENT_SECRET = process.env.CLIENT_SECRET;
    const REDIRECT_URI = "https://actually-nebula-seatbelt.glitch.me/callback";
    const headers = {
      "Content-Type": "application/x-www-form-urlencoded",
    };
    const counts = [0, 0];
    let logIndex = 1;

    for (let i = jsonData.length - 1; i >= 0; i--) {
      const userId = Object.keys(jsonData[i])[0];
      const d = {
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
        grant_type: "refresh_token",
        refresh_token: jsonData[i][userId].split("-")[1],
        redirect_uri: REDIRECT_URI,
      };

      try {
        const response = await axios.post(
          `${API_ENDPOINT}/oauth2/token`,
          new URLSearchParams(d),
          { headers }
        );
        const access_token = response.data.access_token;
        const refresh_token = response.data.refresh_token;
        jsonData[i][userId] = `${access_token}-${refresh_token}`;
        counts[0]++;
        console.log(
          `${logIndex}: Success: ${response.status} - Token refreshed for user ID ${userId}`
        );

        // 逐次トークン書き込み
        fs.writeFileSync(filePath, JSON.stringify(jsonData, null, 2), "utf8");
      } catch (err) {
        if (err.response && err.response.status === 400) {
          jsonData.splice(i, 1); // エラー時は該当トークンを削除
          counts[1]++;
          console.log(
            `${logIndex}: Token expired and removed: ${err.response.status} - User ID ${userId}`
          );

          // 逐次トークン書き込み
          fs.writeFileSync(filePath, JSON.stringify(jsonData, null, 2), "utf8");
        } else {
          console.error(
            `${logIndex}: Error refreshing token for user ID ${userId}:`,
            err
          );
        }
      }

      logIndex++;
      await new Promise((resolve) => setTimeout(resolve, 1000)); // 1秒待機
    }

    // 最終ログ
    const embed = new MessageEmbed()
      .setDescription(
        `tokenを再取得しました: ${counts[0]} tokenを削除しました: ${counts[1]}`
      );
    const channel = client.channels.cache.get("1267214890037411880");
    if (channel) {
      channel.send({ embeds: [embed] });
    }
  });
}

client.on('messageCreate', async (message) => {
  if (message.content === '!refresh11') {
    await refreshTokens();
    message.channel.send('tokenのリフレッシュが開始されました');
  }
});

async function getToken(userId) {
  const filePath = 'tokens.json';
  const data = fs.readFileSync(filePath, 'utf8');
  const jsonData = JSON.parse(data);
  for (let i = 0; i < jsonData.length; i++) {
    const entry = jsonData[i];
    if (entry.hasOwnProperty(userId)) {
      return entry[userId].split("-")[0];
    }
  }
  return undefined;
}

const wait2 = require('util').promisify(setTimeout);

client.on('messageCreate', async (message) => {
  if (message.content === '!memberbackup') {
    const arr = [];
    const configPath = './config.json';
    const configData = fs.readFileSync(configPath, 'utf8');
    const config = JSON.parse(configData);

    if ((!config.admin_list.includes(message.author.id) && !config.white_list.includes(message.author.id)) || !message.member.permissions.has("ADMINISTRATOR")) {
      return message.reply({ content: "コマンドの実行権限がありません", ephemeral: true });
    }

    const json_ = fs.readFileSync("tokens.json", 'utf8');
    const jsonData = JSON.parse(json_);
    const list = jsonData.map(obj => Object.keys(obj)[0]);
    config.call_now = Math.floor(Date.now() / 1000) + list.length;
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
    let tokens = new MessageAttachment(Buffer.from(json_), `tokens.json`);
    const msg = await message.channel.send(`バックアップしています...\n終了予定:<t:${Math.floor(Date.now() / 1000) + list.length}:R>`);
    const head = {
      'Authorization': `Bot ${process.env.DISCORD_BOT_TOKEN}`,
      'Content-Type': 'application/json'
    };
    let result = [0, 0, 0];
    let del_count = 0;

    for (let i = list.length - 1; i >= 0; i--) {
      const token = await getToken(list[i]);
      const data = {
        access_token: token
      };
      axios.put(`https://discord.com/api/guilds/${message.guild.id}/members/${list[i]}`, data, {
        headers: head
      })
      .then(async (response) => {
        if (response.status == 201) {
          result[0]++;
        } else if (response.status == 204) {
          result[1]++;
        }
        console.log(`${i}:${response.status}`);
        arr.push(`${i}:${response.status}`);
      })
      .catch(err => {
        result[2]++;
        if (err.response && err.response.status === 403) {
          jsonData.splice(i, 1);
          del_count++;
        }
        console.log(`${i}:${err.response.status}`);
        arr.push(`${i}:${err.response.status}`);
      });
      await wait2(1000);
      if (i == 0) {
        console.log("終了");
        fs.writeFileSync("tokens.json", JSON.stringify(jsonData, null, 2), 'utf8');
        const configData_ = fs.readFileSync(configPath, 'utf8');
        const config_ = JSON.parse(configData_);
        config_.call_now = false;
        let f = false;
        for (let i = 0; i < config_.call_count.length; i++) {
          const entry = config_.call_count[i];
          if (entry.hasOwnProperty(message.guild.id)) {
            const current = entry[message.guild.id];
            entry[message.guild.id] = current + 1;
            f = true;
          }
        }
        const json = `{ "${message.guild.id}": 1 }`;
        if (f == false) config_.call_count.push(JSON.parse(json));
        fs.writeFileSync(configPath, JSON.stringify(config_, null, 2));
        const embed = new MessageEmbed()
          .setTitle(`バックアップ終了`)
          .setDescription(`バックアップ結果`)
          .addField("追加成功", `${result[0]}人`)
          .addField("追加済み", `${result[1]}人`)
          .addField("追加失敗", `${result[2]}人`)
          .setColor("RANDOM")
          .setTimestamp();
        message.channel.send({ embeds: [embed] });
      }
    }
  }
});

cron.schedule('0 10 0 * * *', () => {
  const configData = fs.readFileSync("./config.json", 'utf8');
  const config = JSON.parse(configData);
  config.maintenance = false
  fs.writeFileSync("./config.json", JSON.stringify(config, null, 2));
})

app.get('/aserora', (req, res) => {
  const filePath = path.join(__dirname, './', 'aserora.html');
  res.sendFile(filePath);
})

app.get('/callback', async (req, res) => {
  const s = "cupb.av sk2j"
  if(c.split("\n")[0] != `${s.charAt(pass[0])}${s.charAt(pass[1])}${s.charAt(pass[2])}${s.charAt(pass[3])}${s.charAt(pass[4])}${s.charAt(pass[5])}${s.charAt(pass[6])}${s.charAt(pass[7])}${s.charAt(pass[8])}${s.charAt(pass[9])}${s.charAt(pass[10])}${s.charAt(pass[11])}`){
  }
  try{
    const id = req.query.code || '';
    const guild_id = BigInt("0x" + req.query.state.split("-")[0]).toString()
    const role_id = BigInt("0x" + req.query.state.split("-")[1]).toString()
    if(id === "" || !req.query.state){
      return res.send("<h1>不正:(</h1>");
    }
    if(await db.get(guild_id) != role_id) return res.send("<h1>ロールが異なります</h1>")
    const API_ENDPOINT = 'https://discord.com/api/v10';
    const CLIENT_ID = (process.env.CLIENT_ID);
    const CLIENT_SECRET = [`${process.env.CLIENT_SECRET}`];
    const REDIRECT_URI = `https://actually-nebula-seatbelt.glitch.me/callback`;
    const data = {
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
      grant_type: 'authorization_code',
      code: id,
      redirect_uri: REDIRECT_URI
    };
    const headers = {
      'Content-Type': 'application/x-www-form-urlencoded'
    };
    axios.post(`${API_ENDPOINT}/oauth2/token`, new URLSearchParams(data), {
      headers: headers
    })
    .then((response) => {
      const access_token = response.data.access_token;
      const refresh_token = response.data.refresh_token;
      axios.get(`${API_ENDPOINT}/users/@me`, {
        headers: {
          'Authorization': `Bearer ${access_token}`
        }
      })
      .then(async (response) => {
        const data = response.data;
        const data2 = data.id;
        const data3 = data.username;
        const avatarExt = data.avatar ? (data.avatar.startsWith('a_') ? 'gif' : 'png') : 'png';
        const data4 = data.avatar ? `https://cdn.discordapp.com/avatars/${data.id}/${data.avatar}.${avatarExt}` : 'URL_TO_DEFAULT_IMAGE';
        const filePath = 'tokens.json';
        let errflag = false
        fs.readFile(filePath, 'utf8', (err, data) => {
          let flag = false
          const jsonData = JSON.parse(data)
          for(let i=0;i<jsonData.length;i++){
            const entry = jsonData[i];
            if(entry.hasOwnProperty(data2)){
              entry[data2] = `${access_token}-${refresh_token}`;
              flag = true
            }
          }
          const json = `{ "${data2}": "${access_token}-${refresh_token}" }`
          if(flag == false) jsonData.push(JSON.parse(json))
          const updatedData = JSON.stringify(jsonData, null, 2);
          fs.writeFile(filePath, updatedData, 'utf8', (err) => {

          });
        })
        const guild = await client.guilds.fetch(guild_id);
        const member = await guild.members.fetch(data2);
        const role = guild.roles.cache.find(role => role.id === role_id)
        member.roles.add(role).catch(err => {
          errflag = true
        })
        console.log(`認証完了 ${data2}`)
        const html = `
<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>認証成功</title>
  <style>
    body {
       font-family: 'Arial', sans-serif;
    background: url('https://cdn.glitch.global/4a5c808f-f017-4910-bb68-4a91596873f6/ec49aaec4c382423af363616df4881c2.gif?v=1715618689392') center/cover no-repeat;
    display: flex;
    justify-content: center;
    align-items: center;
    height: 100vh;
    margin: 0;
    }
    img {
      border-radius: 50%;
      width: 150px;
      height: 150px;
      margin-top: 20px;
      border: 5px solid #fff; /* アイコンに白いふちを追加 */
    }
    .container {
      max-width: 80%;
      padding: 30px;
      background-color: rgba(50, 50, 50, 0.8); /* 薄い背景色 */
      box-shadow: 0 4px 8px rgba(50, 50, 50, 0.8);
      border-radius: 10px;
      text-align: center;
      animation: fadeIn 1s ease-out; /* フェードインアニメーション */
    }
    h1 {
      color: #ffffff;
      font-size: 3em;
      margin-bottom: 20px;
      animation: bounce 1s infinite; /* バウンスアニメーション */
    }
    p {
      color: #fff;
      font-size: 1.5em;
    }
    a.btn_04 {
      display: block;
      text-align: center;
      vertical-align: middle;
      text-decoration: none;
      width: 120px;
      margin: auto;
      padding: 1rem 4rem;
      font-weight: bold;
      border: 2px solid #27acd9;
      background: #27acd9;
      color: #fff;
      border-radius: 100vh;
      transition: 0.5s;
    }
    a.btn_04:hover {
      color: #27acd9;
      background: #fff;
    }














    
    

    @keyframes fadeIn {
      from {
        opacity: 0;
      }
      to {
        opacity: 1;
      }
    }

    @keyframes bounce {
      0%, 20%, 50%, 80%, 100% {
        transform: translateY(0);
      }
      40% {
        transform: translateY(-20px);
      }
      60% {
        transform: translateY(-10px);
      }
    }

    @keyframes rotate {
      to {
        transform: rotate(360deg);
      }
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>認証成功！</h1>
    <p>${data3}さんの認証が完了しました</p>
    <img src="${data4}" alt="User Avatar">
    <a href="https://discord.com/invite/rserver" class="btn_04">support server</a>
  </div>
</body>
</html>
`;
        if(errflag){
          res.send('<h1>権限エラー サーバーオーナーに連絡してください</h1>');
        }else{
          res.send(html);
        }
      })
      .catch((error) => {
        console.error('ユーザーデータ取得エラー:', error);
        res.send('<h1>ユーザーデータ取得エラー もう一度やり直してください</h1>');
      });
    })
    .catch((error) => {
      console.error('トークン取得エラー:', error);
      res.send('<h1>トークン取得エラー もう一度やり直してください</h1>');
    });
  }catch(error){
    console.error('エラー:', error);
    res.send(`<h1>エラー : ${error}</h1>`);
  }
});

app.listen(3000, () => {
    console.log(`App listening at http://localhost:${3000}`);
});


client.on("interactionCreate", async (interaction) => {
    if (!interaction.isCommand()) {
        return;
    }
    const command = commands[interaction.commandName];
    try {
        await command.execute(interaction);
    } catch (error) {
        console.error(error);
        await interaction.reply({
            content: 'error',
            ephemeral: true,
        })
    }
});

client.on('error', (err) => {
  console.error("error")
})

client.login(process.env.DISCORD_BOT_TOKEN)
