import type BaseClient from '#lib/BaseClient.js';
import Command from '#lib/structures/Command.js';
import type { ChatInputCommandInteraction } from 'discord.js';
import {
	type CommandKind,
	type IPermissionCommandData as _CommandData,
	type IPermissionData
} from '#types/permissions';
import mongoose from 'mongoose';
import PermissionModel from '#models/Permissions.js';

class PermissionHandler {
	private readonly subcommandMap: Record<string, CommandKind> = {
		node: 'node',
		user: 'user',
		command: 'command'
	};

	private readonly nodeActions = ['create', 'remove', 'list', 'require', 'forget', 'dev'];
	private readonly userActions = ['check', 'add', 'remove'];
	private readonly commandActions = ['check', 'add', 'remove'];

	public constructor() {
		this.connectDB().catch((err) => console.error(err));
	}

	private async connectDB(): Promise<void> {
		try {
			await mongoose.connect(process.env.MONGO_URI!);
			console.log('Connected to MongoDB for Permissions');
		} catch (err) {
			console.error('Error connecting to permissions database:', err);
		}
	}

	public async generatePermissionData(command_data: string): Promise<IPermissionData> {
		const data: IPermissionData = this.initializePermissionData();
		const parts = command_data.replace(/^\//, '').trim().split(/\s+/);

		if (parts.length <= 1) {
			data.errors.push('Arguments not provided for command "permission"');
			return data;
		}

		if (parts[0] !== 'permission') {
			data.errors.push('Invalid command');
			return data;
		}

		const subcommandKey = parts[1] ?? '';
		if (parts.length > 1 && this.subcommandMap[subcommandKey]) {
			data.subcommand.kind = this.subcommandMap[subcommandKey]!;
		} else {
			data.errors.push('Invalid subcommand');
			return data;
		}

		switch (data.subcommand.kind) {
			case 'node':
				await this.processNodeCommand(parts, data);
				break;
			case 'user':
				await this.processUserCommand(parts, data);
				break;
			case 'command':
				await this.processCommand(parts, data);
				break;
			default:
				data.errors.push('Unsupported subcommand');
		}

		return data;
	}

	public async fetchPermissionData(data: _CommandData): Promise<IPermissionData> {
		if (data.arguments.length === 0) {
			return {
				command: 'permission',
				subcommand: {
					kind: 'undefined',
					values: []
				},
				parameters: [],
				errors: ['Arguments empty or missing for command "/permission"']
			};
		}

		return this.generatePermissionData(`/permission ${data.arguments.join(' ')}`);
	}

	private async processNodeCommand(parts: string[], data: IPermissionData): Promise<void> {
		const action = parts[2] ?? '';
		if (!this.nodeActions.includes(action)) {
			data.errors.push('Invalid node action');
			return;
		}

		data.subcommand.values = [action];
		const permissions = await PermissionModel.find();

		switch (action) {
			case 'create':
				if (parts[3]) {
					const permissionName = parts[3];
					const permissionExists = await PermissionModel.findOne({ name: permissionName });
					if (permissionExists) {
						data.errors.push(`Permission node ${permissionName} already exists`);
					} else {
						await PermissionModel.create({ name: permissionName });
						data.parameters.push({ type: 'permission-name', data: permissionName });
					}
				} else {
					data.errors.push('Missing permission name');
				}
				break;

			case 'remove':
				if (parts[3]) {
					const permissionName = parts[3];
					const result = await PermissionModel.deleteOne({ name: permissionName });
					if (result.deletedCount === 0) {
						data.errors.push(`Permission node ${permissionName} does not exist`);
					} else {
						data.parameters.push({ type: 'permission-name', data: permissionName });
					}
				} else {
					data.errors.push('Missing permission name');
				}
				break;

			case 'list':
				data.parameters.push({ type: 'permissions-list', data: permissions.map((p) => p.name).join(', ') });
				break;

			case 'require':
			case 'forget':
				this.processRequireForget(parts, data);
				break;

			case 'dev':
				if (['reset', 'reset_all'].includes(parts[3]!)) {
					data.subcommand.values.push(parts[3]!);
				} else {
					data.errors.push('Invalid dev action');
				}
				break;

			default:
				data.errors.push('Invalid action for node');
		}
	}

	private async processUserCommand(parts: string[], data: IPermissionData): Promise<void> {
		const action = parts[2] ?? '';
		if (!this.userActions.includes(action)) {
			data.errors.push('Invalid user action');
			return;
		}

		data.subcommand.values = [action];

		switch (action) {
			case 'check':
				if (parts[3]) {
					const userId = parts[3];
					const permissions = await PermissionModel.find({ users: userId });
					data.parameters.push({ type: 'user_id', data: userId });
					data.parameters.push({
						type: 'user_permissions',
						data: permissions.map((p) => p.name).join(', ') || 'No permissions found'
					});
				} else {
					data.errors.push('Missing user ID');
				}
				break;

			case 'add':
			case 'remove':
				await this.processAddRemoveUser(parts, data);
				break;

			default:
				data.errors.push('Invalid user action');
		}
	}

	private async processCommand(parts: string[], data: IPermissionData): Promise<void> {
		const action = parts[2] ?? '';
		if (!this.commandActions.includes(action)) {
			data.errors.push('Invalid command action');
			return;
		}

		data.subcommand.values = [action];

		switch (action) {
			case 'check':
				if (parts[3]) {
					const commandName = parts[3];
					const permissions = await PermissionModel.find({ commands: commandName });
					data.parameters.push({ type: 'command_name', data: commandName });
					data.parameters.push({
						type: 'command_permissions',
						data: permissions.map((p) => p.name).join(', ') || 'No permissions found'
					});
				} else {
					data.errors.push('Missing command name');
				}
				break;

			case 'add':
			case 'remove':
				await this.processAddRemoveCommand(parts, data);
				break;

			default:
				data.errors.push('Invalid command action');
		}
	}

	private processRequireForget(parts: string[], data: IPermissionData): void {
		if (parts[3]) {
			data.parameters.push({ type: 'command_name', data: parts[3] });
		}
		if (parts[4]) {
			data.parameters.push({ type: 'permission_name', data: parts[4] });
		} else {
			data.errors.push('Missing permission or command name');
		}
	}

	private async processAddRemoveUser(parts: string[], data: IPermissionData): Promise<void> {
		const action = parts[2];
		if (parts[3]) {
			const userId = parts[3];
			const permissionName = parts[4];
			const permission = await PermissionModel.findOne({ name: permissionName });

			if (!permission) {
				data.errors.push(`Permission node ${permissionName} does not exist`);
				return;
			}

			if (action === 'add') {
				if (!permission.users.includes(userId)) {
					permission.users.push(userId);
					await permission.save();
				}
			} else if (action === 'remove') {
				permission.users = permission.users.filter((id) => id !== userId);
				await permission.save();
			}

			data.parameters.push({ type: 'user_id', data: userId });
			data.parameters.push({ type: 'permission_node', data: permissionName! });
		} else {
			data.errors.push('Missing user ID or permission node');
		}
	}

	private async processAddRemoveCommand(parts: string[], data: IPermissionData): Promise<void> {
		const action = parts[2];
		if (parts[3]) {
			const commandName = parts[3];
			const permissionName = parts[4];
			const permission = await PermissionModel.findOne({ name: permissionName });

			if (!permission) {
				data.errors.push(`Permission node ${permissionName} does not exist`);
				return;
			}

			if (action === 'add') {
				if (!permission.commands.includes(commandName)) {
					permission.commands.push(commandName);
					await permission.save();
				}
			} else if (action === 'remove') {
				permission.commands = permission.commands.filter((cmd) => cmd !== commandName);
				await permission.save();
			}

			data.parameters.push({ type: 'command_name', data: commandName });
			data.parameters.push({ type: 'permission_node', data: permissionName! });
		} else {
			data.errors.push('Missing command name or permission node');
		}
	}

	private initializePermissionData(): IPermissionData {
		return {
			command: 'permission',
			subcommand: {
				kind: 'undefined',
				values: []
			},
			parameters: [],
			errors: []
		};
	}
}

export default class extends Command {
	public constructor(client: BaseClient) {
		super(client, {
			name: 'permission',
			description: 'Manage permissions for the server!'
		});
	}

	public override async execute(interaction: ChatInputCommandInteraction<'cached' | 'raw'>) {
		const handler = new PermissionHandler();

		const commandData = {
			name: '/permission',
			arguments: interaction.options.getString('data', true).split(' ')
		} satisfies _CommandData;

		if (!commandData) {
			return interaction.reply({
				content: 'Could not locate command details for action `/permission`'
			});
		}

		const permissionData = await handler.fetchPermissionData(commandData);
		let responseContent = `Errors: ${permissionData.errors.length} \nCommand: ${permissionData.command} \nParameters: ${permissionData.parameters.map((v) => `data: ${v.data}, type: ${v.type}`).join(', ')}`;

		if (permissionData.errors.length > 0) {
			permissionData.errors.forEach((err) => {
				responseContent += `\nError: ${err}`;
			});
		}

		return interaction.reply({
			content: responseContent,
			ephemeral: true
		});
	}
}
