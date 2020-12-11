const Discord = require('discord.js');
const fetch = require('node-fetch');
require('dotenv').config();

const client = new Discord.Client();

client.on('ready', async () => {
  console.log(`Logged in as ${client.user.tag}`);
  const guilds = client.guilds.cache.map((guild) => guild.name).join(', ');
  console.log(`Bot active in guilds: ${guilds}`);
});

client.on('guildCreate', async (guild) => {
  console.log(`joined guild ${guild.name}`);
});

client.on('message', async (msg) => {
  const matched = msg.content.match(
    /(https*:\/\/)*(www.)*(reddit.com)\/r\/[^/]+\/comments\/([^/]+)(.*)/
  );
  if (matched) {
    const postID = matched[4];
    redditHandler(msg, postID);
  }
});

client.login();

const redditHandler = async (msg, postID) => {
  const url = `https://reddit.com/${postID}.json`;

  const response = await fetch(url);
  const json = await response.json();
  const data = json[0].data.children[0].data;

  const post = {
    title: data.title,
    subreddit: data.subreddit_name_prefixed,
    author: data.author,
    permalink: data.permalink,
    isVideo: data.is_video,
    imageURL: data.url,
    crosspost: !!data.crosspost_parent_list,
  };

  if (post.imageURL) {
    let embed = new Discord.MessageEmbed()
      .setColor('#ff4500')
      .setAuthor(msg.author.username, msg.author.avatarURL())
      .setTitle(post.title)
      .setURL(`https://reddit.com${post.permalink}`)
      .setDescription(`by /u/${post.author} at ${post.subreddit}`);

    console.log({
      guildName: msg.guild.name,
      post,
    });

    if (!post.isVideo && !post.crosspost) embed.setImage(post.imageURL);

    await msg.channel.send(embed);
    msg.delete();
  }
};
