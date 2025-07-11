const { Client, Intents, MessageEmbed, MessageActionRow, MessageButton } = require("discord.js");
const client = new Client({
  partials: ["CHANNEL"],
  intents: new Intents(32767)
});
// 特定のユーザーのID
const allowedUserId = "1178414826184265819"; // 例: "123456789012345678"

module.exports = {
  data: {
    name: "bot退出",
    description: "このボットを鯖から抜けさせます ※管理者専用※",
  },
  async execute(interaction) {
    try {
      // コマンドを実行したユーザーのIDを取得
      const userId = interaction.user.id;

      // 特定のユーザーであるかを確認
      if (userId === allowedUserId) {
        // コマンドを実行したサーバーからボットを退出
        await interaction.reply("サーバーから退出しました。");
        await interaction.guild.leave();
      } else {
        // 特定のユーザーでない場合はエラーメッセージを返すなどの処理
        await interaction.reply("このコマンドは許可されていません。");
      }
    } catch (error) {
      console.error(error);
    }
  }
};

client.login(process.env.DISCORD_BOT_TOKEN)

