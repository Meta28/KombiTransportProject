import dotenv from 'dotenv';
dotenv.config();

export const config = {
    port: 5001,
    apiKey: process.env.GOOGLE_API_KEY
};