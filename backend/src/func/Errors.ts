import mongoose from 'mongoose';

export class HttpError extends Error {
  statusCode: number;
  type: string;

  constructor(message: string, statusCode = 500, type: string = 'customError') {
    super(message);
    this.name = 'HttpError';
    this.statusCode = statusCode;
    this.type = type;
  }
}

export const throwError = (
  message: string,
  statusCode = 400,
  type?: string
) => {
  // console.log(`Error: ${statusCode}`);
  throw new HttpError(message, statusCode, type);
};

export async function handleTransactionError({
  session,
  error,
}: {
  session: mongoose.ClientSession;
  error: any;
}) {
  // Only abort transaction if it's still active
  if (session && session.inTransaction()) {
    await session.abortTransaction();
  }
  throw error;
}
