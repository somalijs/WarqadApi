import { Model, Schema, HydratedDocument } from 'mongoose';
import { getDatabaseInstance } from '../../config/database.js';
import profileSchema, { ProfileFields, ProfileMethods } from './profile.js';

// 1️⃣ Extend the profile schema with `app`
const userSchema = profileSchema.clone().add({
  app: {
    type: Schema.Types.ObjectId,
    ref: 'App',
    required: [true, 'App is required'],
  },
  stores: {
    type: [Schema.Types.ObjectId],
    ref: 'Store',
    required: [true, 'Stores are required'],
  },
});

// 2️⃣ Extend the fields interface to include `app`
export interface UserFields extends ProfileFields {
  app: Schema.Types.ObjectId;
  stores?: Schema.Types.ObjectId[];
}

// 3️⃣ Create a hydrated document type (with methods inherited)
export type DocumentUser = HydratedDocument<UserFields, ProfileMethods>;

// 4️⃣ Optional: a creation type for DTOs or API inputs
export type UserCreationDocument = Pick<
  UserFields,
  'name' | 'surname' | 'email' | 'phone' | 'role' | 'sex' | 'app'
>;

// 5️⃣ Get model for a specific DB instance
const getUserModel = (dbName: string): Model<DocumentUser> => {
  const db = getDatabaseInstance(dbName);
  return (
    (db.models.User as Model<DocumentUser>) ||
    db.model<DocumentUser>('User', userSchema)
  );
};

export default getUserModel;
