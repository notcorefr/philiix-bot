require('dotenv').config();
const { Client, GatewayIntentBits, Collection, Events, SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const express = require('express')
const app = express()
const port = 3000


// Keep Alive
app.get('/', (req, res) => {
  res.send({isWorking: true})
})

app.listen(port, () => {
  console.log(`Server Started On Port ${port}`)
})


// Create a new client instance
const client = new Client({ 
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ] 
});

// Create a collection to store commands
client.commands = new Collection();

// Bot prefix
const PREFIX = '!';

// AFK users storage
const afkUsers = new Map();

// GIF collections for interaction commands
const gifs = {
    slap: [
        'https://tenor.com/view/anime-slap-mad-gif-16057834',
        'https://tenor.com/view/no-gif-17226651476707151245',
        'https://tenor.com/view/chikku-neesan-girl-hit-wall-stfu-anime-girl-smack-gif-17078255',
        'https://tenor.com/view/chainsaw-man-csm-csm-anime-chainsaw-man-anime-denji-gif-26957270',
    ],
    kiss: [
        'https://media.giphy.com/media/G3va31oEEnIkM/giphy.gif',
        'https://media.giphy.com/media/FqBTvSNjNzeZG/giphy.gif',
        'https://media.giphy.com/media/zkppEMFvRX5FC/giphy.gif',
        'https://media.giphy.com/media/KH1CTZtw1iP3W/giphy.gif'
    ],
    hug: [
        'https://media.giphy.com/media/ZBQhoZC0nqknSviPqT/giphy.gif',
        'https://media.giphy.com/media/du3J3cXyzhj75IOgvA/giphy.gif',
        'https://media.giphy.com/media/42YlR8u9gV5Cw/giphy.gif',
        'https://media.giphy.com/media/l2QDM9Jnim1YVILXa/giphy.gif'
    ],
    punch: [
        'https://media.giphy.com/media/JLmiFYQv6QvLO/giphy.gif',
        'https://media.giphy.com/media/13HgwGsXF0aiGY/giphy.gif',
        'https://media.giphy.com/media/vLx6RAocLQAUw/giphy.gif',
        'https://media.giphy.com/media/fN3VqqYgMWbKg/giphy.gif'
    ]
};

// Function to get random GIF
function getRandomGif(action) {
    const actionGifs = gifs[action];
    return actionGifs[Math.floor(Math.random() * actionGifs.length)];
}


// Define the ping command
const pingCommand = {
    data: new SlashCommandBuilder()
        .setName('ping')
        .setDescription('Replies with Pong'),
    async execute(interaction) {
        try {
            // First, acknowledge the interaction immediately
            await interaction.deferReply();
            
            const apiLatency = Math.round(client.ws.ping);
            
            await interaction.editReply(
                `Pong!\n` +
                `Websocket heartbeat: ${apiLatency}ms`
            );
        } catch (error) {
            console.error('Error executing ping command:', error);
            
            const errorMessage = 'There was an error while executing this command!';
            
            try {
                if (interaction.deferred && !interaction.replied) {
                    await interaction.editReply({ content: errorMessage });
                } else if (!interaction.replied) {
                    await interaction.reply({ content: errorMessage, ephemeral: true });
                } else {
                    await interaction.followUp({ content: errorMessage, ephemeral: true });
                }
            } catch (followUpError) {
                console.error('Error sending error message:', followUpError);
            }
        }
    },
};

// Define the serverinfo command
const serverinfoCommand = {
    data: new SlashCommandBuilder()
        .setName('serverinfo')
        .setDescription('Display information about the server'),
    async execute(interaction) {
        try {
            await interaction.deferReply();
            
            const guild = interaction.guild;
            const embed = new EmbedBuilder()
                .setTitle(`${guild.name}`)
                .addFields(
                    { name: 'Server ID', value: guild.id, inline: true },
                    { name: 'Owner', value: `<@${guild.ownerId}>`, inline: true },
                    { name: 'Members', value: guild.memberCount.toString(), inline: true },
                    { name: 'Created', value: `<t:${Math.floor(guild.createdTimestamp / 1000)}:F>`, inline: true },
                    { name: 'Boost Level', value: guild.premiumTier.toString(), inline: true },
                    { name: 'Boosts', value: guild.premiumSubscriptionCount.toString(), inline: true }
                )
                .setColor(0x5865F2);

            if (guild.iconURL()) {
                embed.setThumbnail(guild.iconURL({ dynamic: true, size: 256 }));
            }

            if (guild.bannerURL()) {
                embed.setImage(guild.bannerURL({ dynamic: true, size: 1024 }));
            }

            await interaction.editReply({ embeds: [embed] });
        } catch (error) {
            console.error('Error executing serverinfo command:', error);
            
            const errorMessage = 'There was an error while executing this command!';
            
            try {
                if (interaction.deferred && !interaction.replied) {
                    await interaction.editReply({ content: errorMessage });
                } else if (!interaction.replied) {
                    await interaction.reply({ content: errorMessage, ephemeral: true });
                } else {
                    await interaction.followUp({ content: errorMessage, ephemeral: true });
                }
            } catch (followUpError) {
                console.error('Error sending error message:', followUpError);
            }
        }
    },
};

// Define the userinfo command
const userinfoCommand = {
    data: new SlashCommandBuilder()
        .setName('userinfo')
        .setDescription('Display information about a user')
        .addUserOption(option =>
            option.setName('user')
                .setDescription('The user to get information about')
                .setRequired(false)),
    async execute(interaction) {
        try {
            await interaction.deferReply();
            
            const user = interaction.options.getUser('user') || interaction.user;
            const member = await interaction.guild.members.fetch(user.id).catch(() => null);
            
            const embed = new EmbedBuilder()
                .setTitle(`${user.username}`)
                .addFields(
                    { name: 'User ID', value: user.id, inline: true },
                    { name: 'Account Created', value: `<t:${Math.floor(user.createdTimestamp / 1000)}:F>`, inline: true }
                )
                .setThumbnail(user.displayAvatarURL({ dynamic: true, size: 256 }))
                .setColor(0x5865F2);

            if (member) {
                const roles = member.roles.cache
                    .filter(role => role.name !== '@everyone')
                    .map(role => `<@&${role.id}>`)
                    .join(', ') || 'None';

                embed.addFields(
                    { name: 'Joined Server', value: `<t:${Math.floor(member.joinedTimestamp / 1000)}:F>`, inline: true },
                    { name: 'Nickname', value: member.nickname || 'None', inline: true },
                    { name: 'Roles', value: roles, inline: false }
                );
            }

            await interaction.editReply({ embeds: [embed] });
        } catch (error) {
            console.error('Error executing userinfo command:', error);
            
            const errorMessage = 'There was an error while executing this command!';
            
            try {
                if (interaction.deferred && !interaction.replied) {
                    await interaction.editReply({ content: errorMessage });
                } else if (!interaction.replied) {
                    await interaction.reply({ content: errorMessage, ephemeral: true });
                } else {
                    await interaction.followUp({ content: errorMessage, ephemeral: true });
                }
            } catch (followUpError) {
                console.error('Error sending error message:', followUpError);
            }
        }
    },
};

// Define interaction commands
const slapCommand = {
    data: new SlashCommandBuilder()
        .setName('slap')
        .setDescription('Slap a user')
        .addUserOption(option =>
            option.setName('user')
                .setDescription('The user to slap')
                .setRequired(true)),
    async execute(interaction) {
        try {
            await interaction.deferReply();
            const user = interaction.options.getUser('user');
            const gifUrl = getRandomGif('slap');
            
            const embed = new EmbedBuilder()
                .setDescription(`${interaction.user.username} slapped ${user.username}!`)
                .setImage(gifUrl)
                .setColor(0x5865F2);
                
            await interaction.editReply({ embeds: [embed] });
        } catch (error) {
            console.error('Error executing slap command:', error);
            const errorMessage = 'There was an error while executing this command!';
            if (interaction.deferred && !interaction.replied) {
                await interaction.editReply({ content: errorMessage });
            }
        }
    },
};

const kissCommand = {
    data: new SlashCommandBuilder()
        .setName('kiss')
        .setDescription('Kiss a user')
        .addUserOption(option =>
            option.setName('user')
                .setDescription('The user to kiss')
                .setRequired(true)),
    async execute(interaction) {
        try {
            await interaction.deferReply();
            const user = interaction.options.getUser('user');
            const gifUrl = getRandomGif('kiss');
            
            const embed = new EmbedBuilder()
                .setDescription(`${interaction.user.username} kissed ${user.username}!`)
                .setImage(gifUrl)
                .setColor(0x5865F2);
                
            await interaction.editReply({ embeds: [embed] });
        } catch (error) {
            console.error('Error executing kiss command:', error);
            const errorMessage = 'There was an error while executing this command!';
            if (interaction.deferred && !interaction.replied) {
                await interaction.editReply({ content: errorMessage });
            }
        }
    },
};

const hugCommand = {
    data: new SlashCommandBuilder()
        .setName('hug')
        .setDescription('Hug a user')
        .addUserOption(option =>
            option.setName('user')
                .setDescription('The user to hug')
                .setRequired(true)),
    async execute(interaction) {
        try {
            await interaction.deferReply();
            const user = interaction.options.getUser('user');
            const gifUrl = getRandomGif('hug');
            
            const embed = new EmbedBuilder()
                .setDescription(`${interaction.user.username} hugged ${user.username}!`)
                .setImage(gifUrl)
                .setColor(0x5865F2);
                
            await interaction.editReply({ embeds: [embed] });
        } catch (error) {
            console.error('Error executing hug command:', error);
            const errorMessage = 'There was an error while executing this command!';
            if (interaction.deferred && !interaction.replied) {
                await interaction.editReply({ content: errorMessage });
            }
        }
    },
};

const punchCommand = {
    data: new SlashCommandBuilder()
        .setName('punch')
        .setDescription('Punch a user')
        .addUserOption(option =>
            option.setName('user')
                .setDescription('The user to punch')
                .setRequired(true)),
    async execute(interaction) {
        try {
            await interaction.deferReply();
            const user = interaction.options.getUser('user');
            const gifUrl = getRandomGif('punch');
            
            const embed = new EmbedBuilder()
                .setDescription(`${interaction.user.username} punched ${user.username}!`)
                .setImage(gifUrl)
                .setColor(0x5865F2);
                
            await interaction.editReply({ embeds: [embed] });
        } catch (error) {
            console.error('Error executing punch command:', error);
            const errorMessage = 'There was an error while executing this command!';
            if (interaction.deferred && !interaction.replied) {
                await interaction.editReply({ content: errorMessage });
            }
        }
    },
};

const helpCommand = {
    data: new SlashCommandBuilder()
        .setName('help')
        .setDescription('Show all available commands'),
    async execute(interaction) {
        try {
            await interaction.deferReply();
            
            const embed = new EmbedBuilder()
                .setTitle('Bot Commands')
                .setDescription('Here are all available commands:')
                .addFields(
                    { name: 'Utility Commands', value: '`/ping` - Check bot latency\n`/serverinfo` - Show server information\n`/userinfo @user` - Show user information\n`/help` - Show this help message', inline: false },
                    { name: 'Interaction Commands', value: '`/slap @user` - Slap a user\n`/kiss @user` - Kiss a user\n`/hug @user` - Hug a user\n`/punch @user` - Punch a user', inline: false },
                    { name: 'Prefix Commands', value: 'You can also use `!` prefix with any command\nExample: `!ping`, `!slap @user`, `!help`', inline: false }
                )
                .setColor(0x5865F2)
                .setFooter({ text: 'Use / for slash commands or ! for prefix commands' });
                
            await interaction.editReply({ embeds: [embed] });
        } catch (error) {
            console.error('Error executing help command:', error);
            const errorMessage = 'There was an error while executing this command!';
            if (interaction.deferred && !interaction.replied) {
                await interaction.editReply({ content: errorMessage });
            }
        }
    },
};

// Add commands to collection
client.commands.set(pingCommand.data.name, pingCommand);
client.commands.set(serverinfoCommand.data.name, serverinfoCommand);
client.commands.set(userinfoCommand.data.name, userinfoCommand);
client.commands.set(slapCommand.data.name, slapCommand);
client.commands.set(kissCommand.data.name, kissCommand);
client.commands.set(hugCommand.data.name, hugCommand);
client.commands.set(punchCommand.data.name, punchCommand);
client.commands.set(helpCommand.data.name, helpCommand);

// When the client is ready, run this code once
client.once(Events.ClientReady, readyClient => {
    console.log(`✅ Ready! Logged in as ${readyClient.user.tag}`);
    console.log(`🤖 Bot is online and ready to respond to slash commands!`);
    console.log(`📊 Serving ${client.guilds.cache.size} guilds`);

    
});

// Handle slash command interactions
client.on(Events.InteractionCreate, async interaction => {
    // Only handle slash commands
    if (!interaction.isChatInputCommand()) return;

    const command = client.commands.get(interaction.commandName);

    if (!command) {
        console.error(`❌ No command matching ${interaction.commandName} was found.`);
        return;
    }

    try {
        console.log(`🔧 Executing command: ${interaction.commandName} by ${interaction.user.tag}`);
        await command.execute(interaction);
    } catch (error) {
        console.error('❌ Error executing command:', error);
        
        const errorMessage = 'There was an error while executing this command!';
        
        try {
            if (interaction.replied || interaction.deferred) {
                await interaction.followUp({ content: errorMessage, ephemeral: true });
            } else {
                await interaction.reply({ content: errorMessage, ephemeral: true });
            }
        } catch (followUpError) {
            console.error('❌ Error sending error message:', followUpError);
        }
    }
});

// Handle prefix commands
client.on(Events.MessageCreate, async message => {
    if (message.author.bot) return;

    // Check if user is AFK and remove AFK status if they speak
    if (afkUsers.has(message.author.id) && !message.content.startsWith(PREFIX)) {
        const afkData = afkUsers.get(message.author.id);
        const member = message.guild.members.cache.get(message.author.id);
        
        if (member) {
            try {
                await member.setNickname(afkData.originalNick);
                afkUsers.delete(message.author.id);
                
                const afkDuration = Math.floor((Date.now() - afkData.timestamp) / 1000);
                const embed = new EmbedBuilder()
                    .setDescription(`🔔 Welcome back ${message.author.username}! You were AFK for ${afkDuration} seconds.\nReason: ${afkData.reason}`)
                    .setColor(0x5865F2);
                await message.reply({ embeds: [embed] });
            } catch (error) {
                console.error('Error removing AFK:', error);
            }
        }
    }

    // Check mentions for AFK users
    if (message.mentions.users.size > 0) {
        for (const mentionedUser of message.mentions.users.values()) {
            if (afkUsers.has(mentionedUser.id)) {
                const afkData = afkUsers.get(mentionedUser.id);
                const afkDuration = Math.floor((Date.now() - afkData.timestamp) / 1000);
                const embed = new EmbedBuilder()
                    .setDescription(`💤 ${mentionedUser.username} is currently AFK (${afkDuration}s ago): ${afkData.reason}`)
                    .setColor(0xFFFF00);
                await message.reply({ embeds: [embed] });
                break; // Only show one AFK notification per message
            }
        }
    }

    // Ignore messages that don't start with prefix
    if (!message.content.startsWith(PREFIX)) return;

    // Parse command and arguments
    const args = message.content.slice(PREFIX.length).trim().split(/ +/);
    const commandName = args.shift().toLowerCase();

    try {
        console.log(`Executing prefix command: ${commandName} by ${message.author.tag}`);

        if (commandName === 'ping') {
            const apiLatency = Math.round(client.ws.ping);
            await message.reply(`Pong!\nWebsocket heartbeat: ${apiLatency}ms`);
        }

        else if (commandName === 'serverinfo') {
            const guild = message.guild;
            const embed = new EmbedBuilder()
                .setTitle(`${guild.name}`)
                .addFields(
                    { name: 'Server ID', value: guild.id, inline: true },
                    { name: 'Owner', value: `<@${guild.ownerId}>`, inline: true },
                    { name: 'Members', value: guild.memberCount.toString(), inline: true },
                    { name: 'Created', value: `<t:${Math.floor(guild.createdTimestamp / 1000)}:F>`, inline: true },
                    { name: 'Boost Level', value: guild.premiumTier.toString(), inline: true },
                    { name: 'Boosts', value: guild.premiumSubscriptionCount.toString(), inline: true }
                )
                .setColor(0x5865F2);

            if (guild.iconURL()) {
                embed.setThumbnail(guild.iconURL({ dynamic: true, size: 256 }));
            }

            if (guild.bannerURL()) {
                embed.setImage(guild.bannerURL({ dynamic: true, size: 1024 }));
            }

            await message.reply({ embeds: [embed] });
        }

        else if (commandName === 'userinfo') {
            const targetUser = message.mentions.users.first() || message.author;
            const member = await message.guild.members.fetch(targetUser.id).catch(() => null);
            
            const embed = new EmbedBuilder()
                .setTitle(`${targetUser.username}`)
                .addFields(
                    { name: 'User ID', value: targetUser.id, inline: true },
                    { name: 'Account Created', value: `<t:${Math.floor(targetUser.createdTimestamp / 1000)}:F>`, inline: true }
                )
                .setThumbnail(targetUser.displayAvatarURL({ dynamic: true, size: 256 }))
                .setColor(0x5865F2);

            if (member) {
                const roles = member.roles.cache
                    .filter(role => role.name !== '@everyone')
                    .map(role => `<@&${role.id}>`)
                    .join(', ') || 'None';

                embed.addFields(
                    { name: 'Joined Server', value: `<t:${Math.floor(member.joinedTimestamp / 1000)}:F>`, inline: true },
                    { name: 'Nickname', value: member.nickname || 'None', inline: true },
                    { name: 'Roles', value: roles, inline: false }
                );
            }

            await message.reply({ embeds: [embed] });
        }

        else if (commandName === 'slap') {
            const targetUser = message.mentions.users.first();
            if (!targetUser) {
                await message.reply('Please mention a user to slap!');
                return;
            }
            const gifUrl = getRandomGif('slap');
            const embed = new EmbedBuilder()
                .setDescription(`${message.author.username} slapped ${targetUser.username}!`)
                .setImage(gifUrl)
                .setColor(0x5865F2);
            await message.reply({ embeds: [embed] });
        }

        else if (commandName === 'kiss') {
            const targetUser = message.mentions.users.first();
            if (!targetUser) {
                await message.reply('Please mention a user to kiss!');
                return;
            }
            const gifUrl = getRandomGif('kiss');
            const embed = new EmbedBuilder()
                .setDescription(`${message.author.username} kissed ${targetUser.username}!`)
                .setImage(gifUrl)
                .setColor(0x5865F2);
            await message.reply({ embeds: [embed] });
        }

        else if (commandName === 'hug') {
            const targetUser = message.mentions.users.first();
            if (!targetUser) {
                await message.reply('Please mention a user to hug!');
                return;
            }
            const gifUrl = getRandomGif('hug');
            const embed = new EmbedBuilder()
                .setDescription(`${message.author.username} hugged ${targetUser.username}!`)
                .setImage(gifUrl)
                .setColor(0x5865F2);
            await message.reply({ embeds: [embed] });
        }

        else if (commandName === 'punch') {
            const targetUser = message.mentions.users.first();
            if (!targetUser) {
                await message.reply('Please mention a user to punch!');
                return;
            }
            const gifUrl = getRandomGif('punch');
            const embed = new EmbedBuilder()
                .setDescription(`${message.author.username} punched ${targetUser.username}!`)
                .setImage(gifUrl)
                .setColor(0x5865F2);
            await message.reply({ embeds: [embed] });
        }

        else if (commandName === 'afk') {
            const reason = args.slice(0).join(' ') || 'No reason provided';
            const member = message.guild.members.cache.get(message.author.id);
            
            if (!member) {
                await message.reply('Could not find your server member info!');
                return;
            }

            try {
                // Store original nickname
                const originalNick = member.nickname || member.user.username;
                afkUsers.set(message.author.id, {
                    reason: reason,
                    originalNick: originalNick,
                    timestamp: Date.now()
                });

                // Set AFK nickname
                const afkNick = `[AFK] ${originalNick}`;
                await member.setNickname(afkNick);

                const embed = new EmbedBuilder()
                    .setDescription(`✅ You are now AFK: ${reason}`)
                    .setColor(0x5865F2);
                await message.reply({ embeds: [embed] });
            } catch (error) {
                console.error('Error setting AFK:', error);
                await message.reply('Could not set your AFK status. I might not have permission to change nicknames.');
            }
        }

        else if (commandName === 'help') {
            const embed = new EmbedBuilder()
                .setTitle('Bot Commands')
                .setDescription('Here are all available commands:')
                .addFields(
                    { name: 'Utility Commands', value: '`/ping` - Check bot latency\n`/serverinfo` - Show server information\n`/userinfo @user` - Show user information\n`/help` - Show this help message', inline: false },
                    { name: 'Interaction Commands', value: '`/slap @user` - Slap a user\n`/kiss @user` - Kiss a user\n`/hug @user` - Hug a user\n`/punch @user` - Punch a user', inline: false },
                    { name: 'AFK System', value: '`/afk [reason]` - Set yourself as AFK\nSpeaking in chat will remove your AFK status', inline: false },
                    { name: 'Prefix Commands', value: 'You can also use `!` prefix with any command\nExample: `!ping`, `!slap @user`, `!afk sleeping`', inline: false }
                )
                .setColor(0x5865F2)
                .setFooter({ text: 'Use / for slash commands or ! for prefix commands' });
            await message.reply({ embeds: [embed] });
        }

    } catch (error) {
        console.error('Error executing prefix command:', error);
        await message.reply('There was an error while executing this command!');
    }
});

// Handle errors
client.on(Events.Error, error => {
    console.error('❌ Discord client error:', error);
});

client.on(Events.Warn, warning => {
    console.warn('⚠️ Discord client warning:', warning);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', error => {
    console.error('❌ Unhandled promise rejection:', error);
});

// Handle uncaught exceptions
process.on('uncaughtException', error => {
    console.error('❌ Uncaught exception:', error);
    process.exit(1);
});

// Get bot token from environment variables
const token = process.env.DISCORD_BOT_TOKEN;

if (!token) {
    console.error('❌ No bot token provided! Please set the DISCORD_BOT_TOKEN environment variable.');
    process.exit(1);
}

// Log in to Discord with your client's token
client.login(token).catch(error => {
    console.error('❌ Failed to login to Discord:', error);
    process.exit(1);
});
