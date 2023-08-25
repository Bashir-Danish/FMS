import { createConnection } from 'mysql2/promise';

export async function createConnectionPool(dbConfig) {
  try {
    const connectionPool = await createConnection(dbConfig);
    return connectionPool;
  } catch (error) {
    console.error('Error establishing database connection:', error);
    throw error;
  }
}
