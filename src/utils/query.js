import { getConnectionPool, createConnections } from "../configs/connection.js";



/**
 * Runs a database query asynchronously.
 *
 * @param {string} query - The SQL query to be executed.
 * @param {Array} params - An array of query parameters.
 * @return {Object} An object containing the query result and response time.
 */
export const runQuery = async (query, params = []) => {
  let conn = getConnectionPool();
  try {
    if (!conn) {
    throw new Error("Database connection is undefined.");
    }
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
    // console.log(`Query executed in ${queryResponseTime} ms`);
    return {
      result,
      resTime: queryResponseTime,
    };
  } catch (error) {
    console.error("Error running query:", error);
    throw error;
  }
};











// import {
//   connectionPool1,
//   connectionPool2,
//   createConnections,
// } from "../configs/connection.js";

// function isWriteOperation(query) {
//   const firstWord = query.trim().split(" ")[0].toUpperCase();
//   return ["INSERT", "UPDATE", "DELETE", "CREATE", "ALTER", "DROP"].includes(
//     firstWord
//   );
// }
// export const runQuery = async (query, params = []) => {
//   const isWriteOp = isWriteOperation(query);
//   let conn = isWriteOp ? connectionPool1 : connectionPool2;

//   try {
//     if (!conn || !conn.connection || conn.connection._closing) {
//       console.info("Connection is in a closed state, getting a new connection");
//       await createConnections();
//       conn = isWriteOp ? connectionPool1 : connectionPool2;
//     }

//     const startTime = Date.now();
//     const [result] = await conn.query(query, params);
//     if (result === undefined) {
//       throw new Error("Query result is undefined");
//     }
//     const endTime = Date.now();
//     const queryResponseTime = endTime - startTime;

//     const connectionType = isWriteOp ? "Master" : "Slave";
//     console.log(
//       `Query executed in ${queryResponseTime} ms using ${connectionType} connection pool`
//     );

//     return {
//       result,
//       resTime: queryResponseTime,
//       connectionType,
//     };
//   } catch (error) {
//     console.error("Error running query:", error);
//     throw error;
//   }
// };
