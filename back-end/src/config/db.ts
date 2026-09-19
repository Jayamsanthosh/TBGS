import sql from "mssql";
import "dotenv/config";

const { DB_SERVER, DB_DATABASE, DB_UID, DB_PWD, DB_PORT } = process.env;

if (!DB_SERVER || !DB_DATABASE || !DB_UID || !DB_PWD) {
  throw new Error("Missing required DB_* environment variables");
}

let pool: sql.ConnectionPool;

export const connectDB = async () => {
  if (!pool) {
    const [host, commaPort] = DB_SERVER.split(",");
    const resolvedPort = DB_PORT
      ? parseInt(DB_PORT, 10)
      : commaPort
      ? parseInt(commaPort, 10)
      : 1433;

    const dbConfig: sql.config = {
      server: host,
      database: DB_DATABASE,
      user: DB_UID,
      password: DB_PWD,
      port: resolvedPort,
      options: {
        encrypt: true,
        trustServerCertificate: true,
      },
    };

    pool = new sql.ConnectionPool(dbConfig);
    await pool.connect();
    console.log(`SQL Server Connected via TCP (Tedious) -> ${host}:${resolvedPort}`);
  }

  return pool;
};

export const getPool = () => {
  if (!pool) {
    throw new Error("Database pool not initialized. Call connectDB() first.");
  }

  return pool;
};
