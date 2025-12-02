import { Schema, InferSchemaType, Model } from 'mongoose';
import { modelSchema, bySchema } from './configs/Fields.js';
import Enums from '../func/Enums.js';
import { getDatabaseInstance } from '../config/database.js';

const logsSchema = new Schema(
  {
    model: { type: modelSchema, required: [true, 'Model is required'] },
    data: {},
    old: {},
    by: { type: bySchema, required: [true, 'Creator is required'] },
    action: {
      type: String,
      enum: Enums.logActions,
      required: [true, 'Action is required'],
    },
  },
  { timestamps: true }
);

// Extend with Document to get _id, save(), etc.
export type LogsDocument = InferSchemaType<typeof logsSchema>;
export type LogsTypes = Omit<
  InferSchemaType<typeof logsSchema>,
  'createdAt' | 'updatedAt' | '_id'
>;
const getLogsModel = (dbname: string): Model<LogsDocument> => {
  const db = getDatabaseInstance(dbname);
  return (
    (db.models.Logs as Model<LogsDocument>) ||
    db.model<LogsDocument>('Logs', logsSchema)
  );
};
export default getLogsModel;
