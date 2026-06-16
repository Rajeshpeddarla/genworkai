import { Client } from 'pg';
import mysql from 'mysql2/promise';
import sql from 'mssql';
import { MongoClient } from 'mongodb';
import { validateSqlQuery } from './validation';

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
      const result = await pool.request().query(`
        SELECT table_name = t.name, column_name = c.name, data_type = ty.name
        FROM sys.columns c
        JOIN sys.tables t ON c.object_id = t.object_id
        JOIN sys.types ty ON c.user_type_id = ty.user_type_id
      `);
      await pool.close();
      return this.formatRelationalSchema(result.recordset);
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
    if (!validation.isValid) {
      throw new Error(`Query validation failed: ${validation.error}`);
    }

    if (this.config.engine === 'pg') {
      const client = new Client(this.getPgConfig());
      await client.connect();
      const res = await client.query(query);
      await client.end();
      return res.rows;
    } else if (this.config.engine === 'mysql') {
      const connection = await mysql.createConnection(this.getMysqlConfig());
      const [rows] = await connection.query(query);
      await connection.end();
      return rows;
    } else if (this.config.engine === 'mssql') {
      const pool = await sql.connect(this.getMssqlConfig());
      const result = await pool.request().query(query);
      await pool.close();
      return result.recordset;
    }
    
    throw new Error('Unsupported engine');
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
    if (this.config.connectionString) {
      return { 
        connectionString: this.config.connectionString,
        ssl: this.config.connectionString.includes('supabase') || this.config.connectionString.includes('neon') ? { rejectUnauthorized: false } : undefined
      };
    }
    
    const isCloud = this.config.host?.includes('supabase') || this.config.host?.includes('neon');
    return {
      host: this.config.host,
      port: this.config.port || 5432,
      database: this.config.database,
      user: this.config.username,
      password: this.config.password,
      ssl: isCloud ? { rejectUnauthorized: false } : undefined,
    };
  }

  private getMysqlConfig() {
    if (this.config.connectionString) return { uri: this.config.connectionString };
    return {
      host: this.config.host,
      port: this.config.port || 3306,
      database: this.config.database,
      user: this.config.username,
      password: this.config.password,
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
