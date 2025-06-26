import { MongoClient } from 'mongodb';

export const connectToDB = async () => {
  try {
    const client = new MongoClient(process.env.DATABASE_URI as string);
    const dbConnection = await client.connect();
    console.log('Connection established...');
    
    return dbConnection;
  } catch (error: unknown) {
    let errorMessage = 'Unknown error occurred';
    
    if (error instanceof Error) {
      errorMessage = error.message;
    } else if (typeof error === 'string') {
      errorMessage = error;
    }
    
    console.log('INIT: Failed to connect to DB..', errorMessage);
    return;
  }
};