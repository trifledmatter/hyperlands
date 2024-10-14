import type BaseClient from '#lib/BaseClient.js';
import Command from '#lib/structures/Command.js';
import { ChatInputCommandInteraction } from 'discord.js';
import { bold } from '@discordjs/formatters';

export default class extends Command {
	public constructor(client: BaseClient) {
		super(client, {
			name: 'color',
			description: 'Select a color to add to your profile.'
		});
	}

	public async execute(interaction: ChatInputCommandInteraction<'cached' | 'raw'>) {
		const color = interaction.options.getString('color', true);
		const member = interaction.guild?.members.cache.get(interaction.user.id);

		const roleIds = {
			blue: '1287055082004680818',
			green: '1287059217513189478',
			yellow: '1287059286635057152',
			purple: '1287059475290914994'
		};

		const colorRoles = Object.values(roleIds);

		if (!member) {
			return interaction.reply({
				content: 'There was an issue finding your member data.',
				ephemeral: true
			});
		}

		const currentColorRole = member.roles.cache.find((role) => colorRoles.includes(role.id));
		if (currentColorRole) {
			await member.roles.remove(currentColorRole, `Removing existing color role`);
		}

		const newColorRoleId = roleIds[color as keyof typeof roleIds];
		await member.roles.add(newColorRoleId, `Assigning new color role: ${color}`);

		return interaction.reply({
			content: `Your color role has been updated to ${bold(color)}!`,
			ephemeral: true
		});
	}
}
