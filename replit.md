# Discord Developer Badge Bot

## Overview

A minimal Discord bot implementation designed specifically to help users qualify for Discord's developer badge program. The bot features a single `/ping` slash command that demonstrates proper Discord.js integration, command handling, and error management. The project follows a simple, focused architecture with clear separation between command deployment and bot runtime logic.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Bot Architecture
- **Single-file bot implementation**: Main bot logic contained in `index.js` with straightforward event handling
- **Command system**: Uses Discord.js Collection to store and manage slash commands
- **Modular command structure**: Commands defined as objects with data and execute properties for easy extension
- **Error handling**: Comprehensive try-catch blocks with proper Discord interaction state management

### Command Deployment
- **Separate deployment script**: `deploy-commands.js` handles slash command registration independently from bot runtime
- **Flexible deployment modes**: Supports both guild-specific (testing) and global command deployment
- **Environment-driven configuration**: Uses environment variables for sensitive data and deployment targets

### Technology Stack
- **Runtime**: Node.js (v16.9.0+)
- **Discord API**: Discord.js v14.x for modern Discord API interaction
- **Package management**: npm with standard package.json configuration

### Configuration Management
- **Environment variables**: Bot token, client ID, and optional guild ID stored as environment variables
- **dotenv integration**: Supports .env files for local development (dependency included)
- **Validation**: Startup checks ensure required environment variables are present

## External Dependencies

### Core Dependencies
- **discord.js**: Primary Discord API wrapper providing bot functionality, slash command builders, and client management
- **dotenv**: Environment variable management for secure configuration

### Discord Platform Integration
- **Discord Developer Portal**: Required for bot registration and token generation
- **Discord Gateway**: WebSocket connection for real-time bot events and interactions
- **Discord REST API**: HTTP endpoints for command deployment and message operations

### Runtime Requirements
- **Node.js runtime**: Minimum version 16.9.0 for Discord.js compatibility
- **npm ecosystem**: Standard package management and dependency resolution