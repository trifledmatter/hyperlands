import { type APIApplicationCommand, ApplicationCommandType } from 'discord-api-types/v10';

export default {
	name: 'rules',
	description: 'Displays the server rules.',
	type: ApplicationCommandType.ChatInput,
	dm_permission: false
} as APIApplicationCommand;
