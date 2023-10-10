
import { getConnectionPool } from "../configs/connection.js";

 
export const runQuery = async (query, params = []) => {
  let conn = getConnectionPool();
  const startTime = Date.now();
  let queryResponseTime;

  try {
    const [result] = await conn.query(query, params);
    if (result === undefined) {
      throw new Error("Query result is undefined");
    }
    const endTime = Date.now();
    queryResponseTime = endTime - startTime;
    return {
      result,
      resTime: queryResponseTime,
    };
  } finally {
    // console.log(`response time: ${queryResponseTime} ms`);
  }
};
