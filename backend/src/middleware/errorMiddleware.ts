import { NextFunction, Request, Response } from 'express';
import { ZodError } from 'zod';

const notFound = (req: Request, res: Response, next: NextFunction) => {
  const error = new Error(`Not Found - ${req.originalUrl}`);
  res.status(404);
  next(error);
};

const errorHandler = (
  err: any,
  _req: Request,
  res: Response,
  _next: NextFunction
) => {
  let statusCode =
    res.statusCode === 200 || !res.statusCode || res.statusCode === 201
      ? 500
      : res.statusCode;
  let message = err.message;
  let type = err.type;
  let errorList = err?.errorList;

  // If Mongoose not found error, set to 404 and change message
  if (err.message.includes('Cast to ObjectId failed')) {
    statusCode = 404;
    message = 'Please provide a valid ID';
    type = 'Id Error';
    errorList = [];
  }
  if (err instanceof ZodError) {
    console.error(err.issues[0]); // use .issues here
    res.status(400).json({
      message: 'zodError',
      errors: err.issues.map((e) => {
        const path = e.path
          .map((seg) => (typeof seg === 'number' ? `[${seg}]` : seg))
          .join('.'); // e.g., items[0].name

        return {
          field: path || 'root',
          message: e.message,
        };
      }),
    });
    return;
  }
  // Handle MongoDB duplicate key error
  if (err.name === 'MongoServerError' && err.code === 11000) {
    const field = Object.keys(err.keyValue)[0]; // e.g., "email"
    const value = err.keyValue[field]; // e.g., "asad@gmail.com"
    message = `${value} already exists`;
    statusCode = 400;
  }

  res.status(statusCode).json({
    message: message,
    type: type,
    errorList: errorList,
    stack: process.env.NODE_ENV === 'production' ? null : err.stack,
    code: err.code,
  });
};

export { notFound, errorHandler };
