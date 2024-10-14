import type BaseClient from '#lib/BaseClient.js';
import Command from '#lib/structures/Command.js';
import { ActionRowBuilder, ButtonBuilder, EmbedBuilder } from '@discordjs/builders';
import { type APIMessageComponentEmoji, ButtonStyle, ComponentType } from 'discord-api-types/v10';
import { ButtonInteraction, ChatInputCommandInteraction, parseEmoji } from 'discord.js';
import { bold, quote } from '@discordjs/formatters';

interface Rule {
	name: string;
	title: string;
	author: string;
	description: string;
	tags: string[];
}

const rules: Rule[] = [
	{
		name: 'no-promoting-or-harassment',
		title: 'Do not promote, coordinate, or engage in harassment',
		author: 'tmp.st',
		description:
			'We do not allow any type of harassing behavior, including sustained bullying, sexual harassment, ban or block evasion, or coordinating server joins for the purpose of harassing server members (“server raiding”)',
		tags: ['discord-official-guidelines']
	},
	{
		name: 'no-threats',
		title: 'Do not threaten to harm another individual or group of people.',
		author: 'tmp.st',
		description: 'This includes direct, indirect, and suggestive threats.',
		tags: ['discord-official-guidelines']
	},
	{
		name: 'no-doxxing-or-dox-threats',
		title:
			'Do not share or threaten to share the personally identifiable information (pii) of an individual without consent',
		author: 'tmp.st',
		description:
			'This includes providing services that facilitate doxxing, such as buying or selling doxxes or compiling doxxes for others.',
		tags: ['discord-official-guidelines']
	},
	{
		name: 'no-hate-speech',
		title: 'Do not use hate speech or engage in other hateful conduct',
		author: 'tmp.st',
		description:
			'This includes the use of hate symbols, imagery, and claims that deny the history of mass human atrocities. We consider hate speech to be any form of expression that either attacks other people or promotes hatred or violence against them based on their protected characteristics.',
		tags: ['discord-official-guidelines']
	},
	{
		name: 'no-violent-extremism',
		title: 'Do not organize, promote, or support violent extremism',
		author: 'tmp.st',
		description:
			'This also includes coordinating violent acts; glorifying or promoting violence or the perpetrators of violent acts; and promoting conspiracy theories that could encourage or incite violence against others.',
		tags: ['discord-official-guidelines']
	},
	{
		name: 'no-normalize-child-abuse',
		title:
			'Do not solicit, share, or make any attempt to distribute content that depicts, promotes, or attempts to normalize child sexual abuse',
		author: 'tmp.st',
		description:
			'Also, do not post content or engage in conduct that in any way sexualizes children. This includes real as well as manipulated media, animation (such as lolicon), and any type of digital creation (note that this includes AI-generated media).  We report child sexual abuse material (CSAM) and grooming to the National Center for Missing & Exploited Children, which may subsequently work with local law enforcement.',
		tags: ['discord-official-guidelines']
	},
	{
		name: 'no-underage-sexual-conduct',
		title:
			'If you are under the age of 18, do not engage in sexual conduct or any conduct that puts your online or physical safety at risk',
		author: 'tmp.st',
		description:
			'This includes consensual sexual interactions between teens, as well as any encouragement or coordination of potentially risky behaviors, such as vigilantism.   We want teens to be able to express themselves freely on Discord as much as possible, but given the risks associated with online dating, we will remove spaces that encourage or facilitate dating between teens.',
		tags: ['discord-official-guidelines']
	},
	{
		name: 'no-available-nsfw-content-to-minors',
		title:
			'Do not solicit sexual content from or engage in any sexual conduct with anyone under the age of 18 or make sexually explicit content available to anyone under the age of 18',
		author: 'tmp.st',
		description:
			'You must be age 18 or older to engage with adult content on Discord.   Server owners must apply an age-restricted label to any channels that contain sexually explicit content.  Users may not post sexually explicit content in any space that cannot be age-restricted, including in avatars, custom statuses or bios, server banners, server icons, invite splashes, emoji, and stickers.',
		tags: ['discord-official-guidelines']
	},
	{
		name: 'no-nsfw-without-consent',
		title:
			'Do not share, distribute, or create sexually explicit or sexually suggestive content of other people without the subject’s consent.',
		author: 'tmp.st',
		description:
			'This includes the non-consensual distribution of intimate media that was created either with or without an individual’s consent',
		tags: ['discord-official-guidelines']
	},
	{
		name: 'no-self-harm',
		title: 'Do not share content that glorifies, promotes, or normalizes suicide or other acts of physical self-harm',
		author: 'tmp.st',
		description:
			'This includes content that encourages others to cut, burn, or starve themselves, as well as content that normalizes eating disorders, such as anorexia and bulimia. Self-harm acts or threats used as a form of emotional manipulation or coercion are also prohibited.',
		tags: ['discord-official-guidelines']
	}
] as Rule[];

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
					.setDisabled(p >= rules.length)
			);
		const embed = getInitialEmbed();
		const buttons = getButtonComponents(page);
		const reply = await interaction.reply({
			embeds: [embed],
			components: [buttons],
			fetchReply: true,
			ephemeral: true
		});
		const filter = (i: ButtonInteraction) => i.user.id === interaction.user.id;
		const collector = reply.createMessageComponentCollector({
			filter,
			componentType: ComponentType.Button,
			time: 300_000
		});

		collector.on('collect', async (i) => {
			if (i.customId === previousId && page > 0) {
				page--;
			} else if (i.customId === nextId && page < rules.length) {
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
