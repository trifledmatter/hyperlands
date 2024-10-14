import {
	type APIApplicationCommand,
	type APIApplicationCommandOption,
	ApplicationCommandOptionType,
	ApplicationCommandType
} from 'discord-api-types/v10';

export default {
	name: 'color',
	description: 'Select a color to add to your profile.',
	type: ApplicationCommandType.ChatInput,
	options: [
		{
			name: 'color',
			description: 'Choose your preferred color.',
			type: ApplicationCommandOptionType.String,
			required: true,
			choices: [
				{
					name: 'Blue',
					value: 'blue'
				},
				{
					name: 'Green',
					value: 'green'
				},
				{
					name: 'Yellow',
					value: 'yellow'
				},
				{
					name: 'Purple',
					value: 'purple'
				}
			]
		}
	] as APIApplicationCommandOption[],
	dm_permission: false
} as APIApplicationCommand;
