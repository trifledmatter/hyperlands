export type CommandKind = 'node' | 'user' | 'command' | 'undefined';
export interface IPermissionData {
	command: 'permission';
	subcommand: {
		kind: CommandKind;
		values: string[];
	};
	parameters: {
		type: string;
		data: string;
	}[];
	errors: string[];
}

export interface IPermissionCommandData {
	name: string;
	arguments: string[];
}
