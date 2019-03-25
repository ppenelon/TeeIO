require('dotenv').config();

export const SERVER_HOST: string = process.env.SERVER_HOST || 'localhost';
export const SERVER_PORT: number = parseInt(process.env.SERVER_PORT) || 3000;