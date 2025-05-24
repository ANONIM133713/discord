require('dotenv').config();
const { Client, GatewayIntentBits, Partials, EmbedBuilder } = require('discord.js');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildMessageReactions,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers
  ],
  partials: [Partials.Message, Partials.Channel, Partials.Reaction]
});

const roles = [
  { roleId: '1356368758415036670', emojiName: 'unranked', emojiId: '1356371524986212363', name: 'unranked' },
  { roleId: '1356369017308446960', emojiName: 'iron',     emojiId: '1356372040205992098', name: 'iron' },
  { roleId: '1356368987365179555', emojiName: 'bronze',   emojiId: '1356372555459461331', name: 'bronze' },
  { roleId: '1356368896650907768', emojiName: 'silver',   emojiId: '1356372725605728427', name: 'silver' },
  { roleId: '1356369160862695674', emojiName: 'gold',     emojiId: '1356372915444121690', name: 'gold' },
  { roleId: '1356369209675874425', emojiName: 'platinum', emojiId: '1356373075708477600', name: 'platinum' },
  { roleId: '1356369306438598806', emojiName: 'diamond',  emojiId: '1356373546447667340', name: 'diamond' },
  { roleId: '1356369510633832509', emojiName: 'ascendant',emojiId: '1356373722814091444', name: 'ascendant' },
  { roleId: '1375648531808915466', emojiName: 'immortal', emojiId: '1356374106458820824', name: 'immortal' },
  { roleId: '1356369603303047390', emojiName: 'radiant',  emojiId: '1356374362411896967', name: 'radiant' }
];

// Mapowanie emoji do roli
const reactionRoles = {};
roles.forEach(r => {
  reactionRoles[`${r.emojiName}:${r.emojiId}`] = r.roleId;
});

client.once('ready', () => {
  console.log(`Zalogowano jako ${client.user.tag}`);
});

// Komenda do wysłania embeda z reakcjami
client.on('messageCreate', async message => {
  if (message.author.bot) return;
  if (message.content === '!rangi') {
    const description = roles.map(
      r => `<:${r.emojiName}:${r.emojiId}> - **${r.name}**`
    ).join('\n');

    const embed = new EmbedBuilder()
      .setTitle('Wybierz swoją rangę!')
      .setDescription(description)
      .setColor(0x00AE86);

    const sentMessage = await message.channel.send({ embeds: [embed] });

    for (const r of roles) {
      const emoji = message.guild.emojis.cache.get(r.emojiId);
      if (emoji) await sentMessage.react(emoji);
      else console.log(`Nie znaleziono emoji: ${r.emojiName}:${r.emojiId}`);
    }
  }
});

// Obsługa dodania reakcji z automatycznym usuwaniem poprzedniej
client.on('messageReactionAdd', async (reaction, user) => {
  if (user.bot) return;
  if (reaction.message.partial) await reaction.message.fetch();
  if (reaction.partial) await reaction.fetch();

  const emojiKey = reaction.emoji.id
    ? `${reaction.emoji.name}:${reaction.emoji.id}`
    : reaction.emoji.name;

  const newRoleId = reactionRoles[emojiKey];
  if (!newRoleId) return;

  const guild = reaction.message.guild;
  const member = await guild.members.fetch(user.id);

  // Usuń inne reakcje użytkownika z tej wiadomości (z tej grupy emoji)
  for (const role of roles) {
    if (role.emojiId !== reaction.emoji.id) {
      const otherReaction = reaction.message.reactions.cache.find(r =>
        r.emoji.id === role.emojiId
      );
      if (otherReaction && otherReaction.users.cache.has(user.id)) {
        await otherReaction.users.remove(user.id).catch(() => {});
      }
    }
  }

  // Poczekaj chwilę, aż reakcje zostaną usunięte (ważne przy szybkim klikaniu)
  await new Promise(res => setTimeout(res, 500));

  // Usuń inne role z tej grupy
  for (const role of roles) {
    if (role.roleId !== newRoleId && member.roles.cache.has(role.roleId)) {
      await member.roles.remove(role.roleId).catch(() => {});
    }
  }

  // Nadaj nową rolę, jeśli jeszcze jej nie ma
  if (!member.roles.cache.has(newRoleId)) {
    await member.roles.add(newRoleId).catch(() => {});
  }
});

// (Opcjonalnie) Obsługa usuwania reakcji - usuwanie roli
client.on('messageReactionRemove', async (reaction, user) => {
  if (user.bot) return;
  if (reaction.message.partial) await reaction.message.fetch();
  if (reaction.partial) await reaction.fetch();

  const emojiKey = reaction.emoji.id
    ? `${reaction.emoji.name}:${reaction.emoji.id}`
    : reaction.emoji.name;

  const roleId = reactionRoles[emojiKey];
  if (!roleId) return;

  const guild = reaction.message.guild;
  const member = await guild.members.fetch(user.id);

  if (member.roles.cache.has(roleId)) {
    await member.roles.remove(roleId).catch(() => {});
  }
});

client.login(process.env.DISCORD_TOKEN);