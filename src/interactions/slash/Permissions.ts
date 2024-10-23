import {
	ApplicationCommandOptionType,
	ApplicationCommandType,
	type APIApplicationCommand,
	type APIApplicationCommandOption
} from 'discord.js';

export default {
	name: 'permission',
	description: 'Manage permissions for the server!',
	type: ApplicationCommandType.ChatInput,
	dm_permission: false,
	options: [
		{
			name: 'data',
			description: 'Provide input data to the permissions command!',
			type: ApplicationCommandOptionType.String,
			required: true
		}
	] as APIApplicationCommandOption[]
} as APIApplicationCommand;
