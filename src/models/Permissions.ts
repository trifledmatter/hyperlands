import mongoose, { Schema, Document } from 'mongoose';
import { type CommandKind } from '#types/permissions';

interface IPermissionDocument extends Document {
	name: string;
	commands: string[];
	users: string[];
	subcommand: {
		kind: CommandKind;
		values: string[];
	};
	parameters: {
		type: string;
		data: string;
	}[];
}

const PermissionSchema = new Schema(
	{
		name: { type: String, required: true },
		commands: { type: [String], required: true },
		users: { type: [String], required: true },
		subcommand: {
			kind: { type: String, required: true },
			values: [{ type: String }]
		},
		parameters: [
			{
				type: { type: String },
				data: { type: String }
			}
		]
	},
	{ timestamps: true }
);

const PermissionModel = mongoose.model<IPermissionDocument>('Permission', PermissionSchema);

export default PermissionModel;
