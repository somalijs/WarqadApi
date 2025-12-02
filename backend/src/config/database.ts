import mongoose from 'mongoose';

let connection: mongoose.Connection | null = null;
import 'colors';
export const connectDB = async () => {
  if (connection) {
    console.log('🟢 Using existing MongoDB connection'.underline.blue);
    return connection;
  }

  try {
    if (!process.env.MONGO_URI) {
      throw new Error(
        'MONGO_URI is not defined in environment variables'.underline.red
      );
    }

    const conn = await mongoose.connect(process.env.MONGO_URI);
    connection = conn.connection; // Store the connection for reuse

    console.log(
      `✅ MongoDB Connected: ${conn.connection.host}`.underline.green
    );
    return connection;
  } catch (error) {
    console.error('❌ MongoDB connection error:', `${error}`.underline.red);
    process.exit(1);
  }
};

// Function to get a specific database instance (no need to call `mongoose.connect` again)
export const getDatabaseInstance = (dbName: string) => {
  if (!connection) {
    throw new Error(
      'MongoDB connection is not established yet.'.underline.magenta
    );
  }
  return connection.useDb(dbName); // Use the `useDb` method to switch between databases
};
