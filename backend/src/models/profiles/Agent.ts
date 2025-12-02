import { Model } from 'mongoose';
import { getDatabaseInstance } from '../../config/database.js';
import profileSchema, { DocumentProfile } from './profile.js';

// Pick only some fields
export type AgentCreationDocument = Pick<
  DocumentProfile,
  'name' | 'surname' | 'email' | 'phone' | 'role' | 'sex'
>;

// Function to get the model for a specifc database
const getAgentModel = (): Model<DocumentProfile> => {
  const db = getDatabaseInstance('application');
  return (
    (db.models.Agent as Model<DocumentProfile>) ||
    db.model<DocumentProfile>('Agent', profileSchema)
  );
};

export default getAgentModel;
