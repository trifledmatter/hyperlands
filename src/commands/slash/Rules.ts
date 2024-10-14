import type BaseClient from '#lib/BaseClient.js';
import Command from '#lib/structures/Command.js';
import { ActionRowBuilder, ButtonBuilder, EmbedBuilder } from '@discordjs/builders';
import { type APIMessageComponentEmoji, ButtonStyle, ComponentType } from 'discord-api-types/v10';
import { ButtonInteraction, ChatInputCommandInteraction, parseEmoji } from 'discord.js';
import { bold, quote } from '@discordjs/formatters';
import rulesData from '#src/data/rules.json';

interface Rule {
	name: string;
	title: string;
	author: string;
	description: string;
	tags: string[];
}

const rules: Rule[] = rulesData as Rule[];

export default class extends Command {
	public constructor(client: BaseClient) {
		super(client, {
			name: 'rules',
			description: 'Shows the server rules with pagination.'
		});
	}

	public async execute(interaction: ChatInputCommandInteraction<'cached' | 'raw'>) {
		let page = 0;
		const rulesPerPage = 1;
		const [previousId, nextId] = ['previous', 'next'].map((id) => `${id}-${interaction.id}`);
		const getInitialEmbed = () => {
			const embed = new EmbedBuilder()
				.setTitle('Server Rules')
				.setDescription(rules.map((rule, idx) => `${idx + 1}. ${bold(rule.title)}`).join('\n'))
				.setFooter({
					text: `Page ${page + 1}/${Math.ceil(rules.length / rulesPerPage)}`,
					iconURL: interaction.user.avatarURL() ?? undefined
				});

			return embed;
		};
		const getRuleDetailEmbed = (index: number) => {
			const rule = rules[index];
			const embed = new EmbedBuilder()
				.setTitle(`${rule?.title}`)
				.setDescription(`${quote(rule?.description ?? 'No description found')}`)
				.setFooter({
					text: `Rule ${index + 1} of ${rules.length}`,
					iconURL: interaction.user.avatarURL() ?? undefined
				});

			return embed;
		};
		const getButtonComponents = (p: number) =>
			new ActionRowBuilder<ButtonBuilder>().addComponents(
				new ButtonBuilder()
					.setCustomId(previousId ?? '')
					.setStyle(ButtonStyle.Secondary)
					.setEmoji(parseEmoji('◀️') as APIMessageComponentEmoji)
					.setDisabled(p === 0),
				new ButtonBuilder()
					.setCustomId(nextId ?? '')
					.setStyle(ButtonStyle.Secondary)
					.setEmoji(parseEmoji('▶️') as APIMessageComponentEmoji)
					.setDisabled(p >= rules.length - 1)
			);
		const embed = getInitialEmbed();
		const buttons = getButtonComponents(page);
		const reply = await interaction.reply({ embeds: [embed], components: [buttons], fetchReply: true });
		const filter = (i: ButtonInteraction) => i.user.id === interaction.user.id;
		const collector = reply.createMessageComponentCollector({
			filter,
			componentType: ComponentType.Button,
			time: 300_000
		});

		collector.on('collect', async (i) => {
			if (i.customId === previousId && page > 0) {
				page--;
			} else if (i.customId === nextId && page < rules.length - 1) {
				page++;
			}

			const currentEmbed = page === 0 ? getInitialEmbed() : getRuleDetailEmbed(page - 1);
			const currentButtons = getButtonComponents(page);

			await i.update({ embeds: [currentEmbed], components: [currentButtons] });
		});

		collector.on('end', async () => {
			const disabledButtons = buttons.setComponents(buttons.components.map((button) => button.setDisabled(true)));
			await reply.edit({ components: [disabledButtons] });
		});
	}
}
