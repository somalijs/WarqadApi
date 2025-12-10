import express from 'express';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import dotenv from 'dotenv';
import { connectDB } from './config/database.js';
import v1Routes from './v1Routes.js';

import path from 'path';
import { errorHandler, notFound } from './middleware/errorMiddleware.js';

const __dirname = path.resolve();
dotenv.config();
export const dbName = process.env.DB_NAME as string;
if (!dbName) {
  throw new Error(`db name is missing`);
}
await connectDB();

const app = express();
app.use(cookieParser());
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true); // allow server-to-server & Postman

      // Allow ANY subdomain of warqad.com
      const regex = /^https?:\/\/([a-zA-Z0-9-]+\.)*warqad\.com$/;

      if (regex.test(origin)) {
        return callback(null, true);
      }

      return callback(new Error('Not allowed by CORS'), false);
    },
    credentials: true,
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.set('trust proxy', true);
v1Routes(app);
const PORT = process.env.PORT || 8080;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '/frontend/dist')));

  app.get('/{*any}', (_req, res) =>
    res.sendFile(path.resolve(__dirname, 'frontend', 'dist', 'index.html'))
  );
} else {
  app.get('/', (_req, res) => {
    res.send('API is running....');
  });
}

app.use(notFound);
app.use(errorHandler);
