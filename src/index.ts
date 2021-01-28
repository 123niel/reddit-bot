import { Client, Message, MessageEmbed } from 'discord.js'
import fetch from 'node-fetch'

require('dotenv').config();

const client = new Client();

client.on('ready', async () => {
  console.log(`Logged in as ${client.user?.tag}`);
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

const redditHandler = async (msg: Message, postID: String) => {
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
    const embed = new MessageEmbed()
      .setColor('#ff4500')
      .setAuthor(msg.author.username, msg.author.avatarURL() || "")
      .setTitle(`${post.subreddit} - ${post.title}`)
      .setURL(`https://reddit.com${post.permalink}`)
      .setFooter(`by /u/${post.author}`);

    console.log({
      guildName: msg.guild?.name,
      userName: msg.author.username,
      post,
    });

    if (!post.isVideo && !post.crosspost) embed.setImage(post.imageURL);

    await msg.channel.send(embed);
    msg.delete();
  }
};
