import { getConnectionPool, createConnections } from "../configs/connection.js";

export const runQuery = async (query, params = []) => {
  let conn = getConnectionPool();
  try {
    // if (!conn) {
    // throw new Error("Database connection is undefined.");
    // }
    if (!conn || !conn.connection || conn.connection._closing) {
      console.info("Connection is in a closed state, getting a new connection");
      await createConnections();
      conn = getConnectionPool();
    }

    const startTime = Date.now();
    const [result] = await conn.query(query, params);
    if (result === undefined) {
      throw new Error("Query result is undefined");
    }
    const endTime = Date.now();
    const queryResponseTime = endTime - startTime;
    console.log(`Query executed in ${queryResponseTime} ms`);
    return {
      result,
      resTime: queryResponseTime,
    };
  } catch (error) {
    console.error("Error running query:", error);
    throw error;
  }
};
