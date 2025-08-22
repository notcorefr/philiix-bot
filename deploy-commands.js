const { REST, Routes, SlashCommandBuilder } = require('discord.js');

// Define commands to deploy
const commands = [
    new SlashCommandBuilder()
        .setName('ping')
        .setDescription('Replies with Pong')
        .toJSON(),
    new SlashCommandBuilder()
        .setName('serverinfo')
        .setDescription('Display information about the server')
        .toJSON(),
    new SlashCommandBuilder()
        .setName('userinfo')
        .setDescription('Display information about a user')
        .addUserOption(option =>
            option.setName('user')
                .setDescription('The user to get information about')
                .setRequired(false))
        .toJSON(),
    new SlashCommandBuilder()
        .setName('slap')
        .setDescription('Slap a user')
        .addUserOption(option =>
            option.setName('user')
                .setDescription('The user to slap')
                .setRequired(true))
        .toJSON(),
    new SlashCommandBuilder()
        .setName('kiss')
        .setDescription('Kiss a user')
        .addUserOption(option =>
            option.setName('user')
                .setDescription('The user to kiss')
                .setRequired(true))
        .toJSON(),
    new SlashCommandBuilder()
        .setName('hug')
        .setDescription('Hug a user')
        .addUserOption(option =>
            option.setName('user')
                .setDescription('The user to hug')
                .setRequired(true))
        .toJSON(),
    new SlashCommandBuilder()
        .setName('punch')
        .setDescription('Punch a user')
        .addUserOption(option =>
            option.setName('user')
                .setDescription('The user to punch')
                .setRequired(true))
        .toJSON(),
    new SlashCommandBuilder()
        .setName('help')
        .setDescription('Show all available commands')
        .toJSON(),
];

// Get environment variables
const token = process.env.DISCORD_BOT_TOKEN;
const clientId = process.env.DISCORD_CLIENT_ID;
const guildId = process.env.DISCORD_GUILD_ID; // Optional: for guild-specific commands

if (!token) {
    console.error('❌ No bot token provided! Please set the DISCORD_BOT_TOKEN environment variable.');
    process.exit(1);
}

if (!clientId) {
    console.error('❌ No client ID provided! Please set the DISCORD_CLIENT_ID environment variable.');
    process.exit(1);
}

// Construct and prepare an instance of the REST module
const rest = new REST().setToken(token);

// Deploy commands
(async () => {
    try {
        console.log(`🚀 Started refreshing ${commands.length} application (/) commands.`);

        let data;
        
        if (guildId) {
            // Deploy to specific guild (faster for testing)
            console.log(`📍 Deploying commands to guild: ${guildId}`);
            data = await rest.put(
                Routes.applicationGuildCommands(clientId, guildId),
                { body: commands },
            );
        } else {
            // Deploy globally (takes up to 1 hour to propagate)
            console.log('🌍 Deploying commands globally...');
            data = await rest.put(
                Routes.applicationCommands(clientId),
                { body: commands },
            );
        }

        console.log(`✅ Successfully reloaded ${data.length} application (/) commands.`);
        
        if (!guildId) {
            console.log('ℹ️ Global commands may take up to 1 hour to appear in all servers.');
        }
        
    } catch (error) {
        console.error('❌ Error deploying commands:', error);
        
        if (error.code === 50001) {
            console.error('💡 Missing Access: Make sure your bot has the "applications.commands" scope and appropriate permissions.');
        } else if (error.code === 10002) {
            console.error('💡 Unknown Application: Check that your DISCORD_CLIENT_ID is correct.');
        } else if (error.status === 401) {
            console.error('💡 Unauthorized: Check that your DISCORD_BOT_TOKEN is correct.');
        }
        
        process.exit(1);
    }
})();
