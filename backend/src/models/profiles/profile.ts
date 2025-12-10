import { HydratedDocument, InferSchemaType, Schema } from 'mongoose';
import { phoneSchema, bySchema } from '../configs/Fields.js';
import Enums from '../../func/Enums.js';
import bcrypt from 'bcrypt';
const profileSchema = new Schema(
  {
    name: {
      type: String,
      trim: true,
      lowercase: true,
      minLength: 2,
      maxLength: 20,
      required: [true, 'Name is required'],
    },
    surname: {
      type: String,
      trim: true,
      lowercase: true,
      minLength: 2,
      maxLength: 20,
      required: [true, 'Surname is required'],
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      required: [true, 'Email is required'],
      unique: true,
      validate: {
        validator: (email: string) => {
          return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
        },
        message: 'Please enter a valid email address',
      },
    },
    phone: {
      type: phoneSchema,
    },
    phoneNumber: {
      type: String,
    },
    role: {
      type: String,
      enum: Enums.roles,
      required: [true, 'Role is required'],
    },
    sex: {
      type: String,
      enum: Enums.gender,
      required: [true, 'Sex is required'],
    },

    // verification
    isActive: {
      type: Boolean,
      default: false,
    },
    isEmailVerified: {
      type: Boolean,
      default: false,
    },
    isPhoneVerified: {
      type: Boolean,
      default: false,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
    password: {
      type: String,
    },

    by: {
      type: bySchema,
      required: [true, 'Creator is required'],
    },
  },
  {
    timestamps: true,
  }
);
// methods
profileSchema.methods.matchPassword = async function (enteredPassword: string) {
  return await bcrypt.compare(enteredPassword, this.password);
};

profileSchema.pre('save', async function () {
  if (!this.isModified('password')) return; // skip if unchanged
  this.password = await bcrypt.hash(this.password!, 10);
});

// Encrypt password on findOneAndUpdate
profileSchema.pre('findOneAndUpdate', async function () {
  const update = this.getUpdate() as Record<string, any>;
  if (update?.password) {
    update.password = await bcrypt.hash(update.password, 10);
    this.setUpdate(update);
  }
});

// Encrypt password on updateOne
profileSchema.pre('updateOne', async function () {
  const update = this.getUpdate() as Record<string, any>;
  if (update?.password) {
    update.password = await bcrypt.hash(update.password, 10);
    this.setUpdate(update);
  }
});
// Custom methods you added
export interface ProfileMethods {
  matchPassword(enteredPassword: string): Promise<boolean>;
}
export type ProfileFields = InferSchemaType<typeof profileSchema>;

export type DocumentProfile = HydratedDocument<ProfileFields, ProfileMethods>;
export default profileSchema;
