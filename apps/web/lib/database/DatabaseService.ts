import { Client } from 'pg';
import mysql from 'mysql2/promise';
import sql from 'mssql';
import { MongoClient } from 'mongodb';
import { validateSqlQuery, checkPayloadSize, STATEMENT_TIMEOUT_MS } from './validation';

export interface DBConnectionConfig {
  engine: 'pg' | 'mysql' | 'mssql' | 'mongodb';
  connectionString?: string;
  host?: string;
  port?: number;
  database?: string;
  username?: string;
  password?: string;
}

export class DatabaseService {
  private config: DBConnectionConfig;

  constructor(config: DBConnectionConfig) {
    this.config = config;
  }

  async testConnection(): Promise<boolean> {
    try {
      if (this.config.engine === 'pg') {
        const client = new Client(this.getPgConfig());
        await client.connect();
        await client.end();
        return true;
      } else if (this.config.engine === 'mysql') {
        const connection = await mysql.createConnection(this.getMysqlConfig());
        await connection.end();
        return true;
      } else if (this.config.engine === 'mssql') {
        const pool = await sql.connect(this.getMssqlConfig());
        await pool.close();
        return true;
      } else if (this.config.engine === 'mongodb') {
        const client = new MongoClient(this.getMongoConfig());
        await client.connect();
        await client.close();
        return true;
      }
      return false;
    } catch (error) {
      console.error(`Connection failed for ${this.config.engine}:`, error);
      return false;
    }
  }

  async extractSchema(): Promise<any> {
    if (this.config.engine === 'pg') {
      const client = new Client(this.getPgConfig());
      await client.connect();
      const res = await client.query(`
        SELECT table_name, column_name, data_type 
        FROM information_schema.columns 
        WHERE table_schema = 'public'
      `);
      await client.end();
      return this.formatRelationalSchema(res.rows);
    } else if (this.config.engine === 'mysql') {
      const connection = await mysql.createConnection(this.getMysqlConfig());
      const [rows] = await connection.query(`
        SELECT table_name, column_name, data_type 
        FROM information_schema.columns 
        WHERE table_schema = DATABASE()
      `);
      await connection.end();
      return this.formatRelationalSchema(rows as any[]);
    } else if (this.config.engine === 'mssql') {
      const pool = await sql.connect(this.getMssqlConfig());
  
      // database_id > 4 skips system DBs (master/tempdb/model/msdb)
      const dbsRes = await pool.request().query(`
        SELECT name FROM sys.databases
        WHERE state = 0 AND database_id > 4 ORDER BY name
      `);
      const dbNames: string[] = dbsRes.recordset.map((r: any) => r.name);
  
      // if user pinned a DB, only that one; else all
      const targets = this.config.database
        ? dbNames.filter(n => n === this.config.database) : dbNames;
  
      const databases: Record<string, any> = {};
      for (const dbName of (targets.length ? targets : dbNames)) {
        const safe = dbName.replace(/]/g, ']]');   // escape ] for bracket-quoting
        try {
          const result = await pool.request().query(`
            SELECT table_name = t.name, column_name = c.name, data_type = ty.name
            FROM [${safe}].sys.columns c
            JOIN [${safe}].sys.tables t ON c.object_id = t.object_id
            JOIN [${safe}].sys.types ty ON c.user_type_id = ty.user_type_id
            ORDER BY t.name, c.column_id
          `);
          databases[dbName] = this.formatRelationalSchema(result.recordset);
        } catch (e) {
          databases[dbName] = {};   // no permission → empty, don't fail whole sync
        }
      }
      await pool.close();
      return { __multiDb: true, databases };
    } else if (this.config.engine === 'mongodb') {
      const client = new MongoClient(this.getMongoConfig());
      await client.connect();
      const db = client.db(this.config.database);
      const collections = await db.listCollections().toArray();
      await client.close();
      return { collections: collections.map(c => c.name) }; // Simplified for MVP
    }
    throw new Error('Unsupported engine');
  }

  async executeQuery(query: string): Promise<any> {
    if (this.config.engine === 'mongodb') {
      throw new Error('NL to Query not fully supported for MongoDB in MVP. Use structured aggregation pipelines.');
    }

    const validation = validateSqlQuery(query);
    if (!validation.isValid || !validation.sanitizedSql) {
      throw new Error(`Query validation failed: ${validation.error}`);
    }

    const safeQuery = validation.sanitizedSql;
    let result: any;

    if (this.config.engine === 'pg') {
      const client = new Client(this.getPgConfig());
      await client.connect();
      // Set statement timeout for this session
      await client.query(`SET statement_timeout = ${STATEMENT_TIMEOUT_MS}`);
      const res = await client.query(safeQuery);
      await client.end();
      if (Array.isArray(res)) {
        result = res.map(r => r.rows);
      } else {
        result = [res.rows];
      }
    } else if (this.config.engine === 'mysql') {
      const connection = await mysql.createConnection(this.getMysqlConfig());
      // MySQL timeout is set in config
      const [rows] = await connection.query(safeQuery);
      await connection.end();
      // mysql2 with multipleStatements returns array of arrays
      if (Array.isArray(rows) && rows.length > 0 && Array.isArray((rows as any)[0])) {
        result = rows;
      } else {
        result = [rows];
      }
    } else if (this.config.engine === 'mssql') {
      const pool = await sql.connect(this.getMssqlConfig());
      const req = pool.request();
      (req as any).timeout = STATEMENT_TIMEOUT_MS;
      const res = await req.query(safeQuery);
      await pool.close();
      if (res.recordsets && Array.isArray(res.recordsets) && res.recordsets.length > 0) {
        result = res.recordsets;
      } else {
        result = [res.recordset];
      }
    } else {
      throw new Error('Unsupported engine');
    }

    // Enforce 5MB payload limit
    const payloadCheck = checkPayloadSize(result);
    if (!payloadCheck.withinLimit) {
      const mb = Math.round(payloadCheck.sizeBytes / (1024 * 1024));
      throw new Error(`Query result too large (${mb}MB). Maximum allowed is 5MB.`);
    }

    return result;
  }

  private formatRelationalSchema(rows: any[]) {
    const schema: Record<string, any[]> = {};
    rows.forEach(row => {
      const table = row.table_name;
      if (!schema[table]) schema[table] = [];
      schema[table].push({ column: row.column_name, type: row.data_type });
    });
    return schema;
  }

  private getPgConfig() {
    // If the user explicitly provided a connection string with sslmode=require, we respect it.
    // We no longer blindly set rejectUnauthorized: false which is a security risk.
    if (this.config.connectionString) {
      return { 
        connectionString: this.config.connectionString,
        statement_timeout: STATEMENT_TIMEOUT_MS,
        connectionTimeoutMillis: STATEMENT_TIMEOUT_MS
      };
    }
    
    return {
      host: this.config.host,
      port: this.config.port || 5432,
      database: this.config.database,
      user: this.config.username,
      password: this.config.password,
      statement_timeout: STATEMENT_TIMEOUT_MS,
      connectionTimeoutMillis: STATEMENT_TIMEOUT_MS,
      ssl: process.env.PG_REQUIRE_SSL === 'true' ? { rejectUnauthorized: true } : undefined,
    };
  }

  private getMysqlConfig() {
    if (this.config.connectionString) return { uri: this.config.connectionString, connectTimeout: STATEMENT_TIMEOUT_MS };
    return {
      host: this.config.host,
      port: this.config.port || 3306,
      database: this.config.database,
      user: this.config.username,
      password: this.config.password,
      connectTimeout: STATEMENT_TIMEOUT_MS,
      multipleStatements: true,
    };
  }

  private getMssqlConfig() {
    if (this.config.connectionString) return this.config.connectionString;
    return {
      server: this.config.host || 'localhost',
      port: this.config.port || 1433,
      database: this.config.database,
      user: this.config.username,
      password: this.config.password,
      options: { encrypt: true, trustServerCertificate: true },
    };
  }

  private getMongoConfig() {
    if (this.config.connectionString) return this.config.connectionString;
    return `mongodb://${this.config.username}:${this.config.password}@${this.config.host}:${this.config.port || 27017}/${this.config.database}`;
  }
}
