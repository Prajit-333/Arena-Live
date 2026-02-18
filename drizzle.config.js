import 'dotenv/config';
import { defineConfig } from 'drizzle-kit';

if(!process.env.DATABASE_URL){
    throw new Error('DATABASE_URL is not defined');
}


export default defineConfig({
    out: './drizzle',        // where migration files get generated
    schema: './src/db/schema.js',  // where your table schemas are defined
    dialect: 'postgresql',
    dbCredentials: {
        url: process.env.DATABASE_URL,
    },
});