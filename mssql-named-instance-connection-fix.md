# SQL Server (Named Instance) Connection Fix

Date: 2026-06-20

## Summary

Connecting an on-premise Microsoft SQL Server named instance (`SP21\SQL2019`)
as a knowledge source failed at several stages. This document records the root
causes and the changes made to get connection + schema sync working end to end.

The target server used SQL Server authentication (`sa`) with a named instance
and multiple databases (e.g. `Courier_GV_260409`).

## Symptoms (in the order they appeared)

1. `getaddrinfo ENOTFOUND SP21\SQL2019` — DNS lookup of the literal string.
2. `ENCRYPTION_KEY environment variable is missing.` — 500 on credential save.
3. `Failed query: insert into "connected_databases" ...` — Postgres insert
   rejected an empty-string port for an integer column.

## Root causes

| # | Cause | Why |
|---|-------|-----|
| 1 | Wrong engine selected (MySQL) | `SP21\SQL2019` is a SQL Server named instance. The MySQL driver tried to DNS-resolve the whole `host\instance` string. |
| 2 | `getMssqlConfig` did not parse named instances | It only set `server` + `port`. SQL Server named instances need `options.instanceName` and dynamic port resolution via SQL Browser (UDP 1434), not a pinned port. |
| 3 | `ENCRYPTION_KEY` env var absent | Credentials are encrypted (AES-256-GCM) before storage. The key was never set in `apps/web/.env.local`. |
| 4 | Raw `port` inserted instead of parsed value | The route inserted the raw request body `port` (an empty string) into the integer `port` column instead of the parsed `portNum`. |

## Changes

### 1. `apps/web/lib/database/DatabaseService.ts` — parse named instances

`getMssqlConfig()` now splits `HOST\INSTANCE` into `server` + `options.instanceName`.
When an instance name is present, no static port is set so SQL Browser (UDP 1434)
can resolve the instance's dynamic port.

```ts
private getMssqlConfig() {
  if (this.config.connectionString) return this.config.connectionString;

  // SQL Server named instance: host is "HOST\INSTANCE". Split server + instanceName.
  // When an instance name is present, SQL Browser (UDP 1434) resolves the dynamic
  // port, so we must NOT pin a static port (doing so overrides instance resolution).
  const rawHost = this.config.host || 'localhost';
  const sep = rawHost.indexOf('\\');
  const server = sep >= 0 ? rawHost.slice(0, sep) : rawHost;
  const instanceName = sep >= 0 ? rawHost.slice(sep + 1) : undefined;

  const options: Record<string, any> = { encrypt: true, trustServerCertificate: true };
  if (instanceName) options.instanceName = instanceName;

  const config: Record<string, any> = {
    server,
    database: this.config.database,
    user: this.config.username,
    password: this.config.password,
    options,
  };
  // Only set an explicit port when no named instance (instance resolves its own port).
  if (!instanceName) config.port = this.config.port || 1433;

  return config;
}
```

### 2. `apps/web/app/api/knowledge/sources/database/route.ts` — port insert fix

Insert the parsed `portNum` (or `null`) instead of the raw body `port`, so an
empty port field does not break the integer column.

```ts
// before
host, port, databaseName: finalDatabaseName, username, password: encryptedPassword,
// after
host, port: portNum ?? null, databaseName: finalDatabaseName, username, password: encryptedPassword,
```

### 3. `apps/web/.env.local` — encryption key

Added a 32-byte (64 hex char) key required by `lib/security/encryption.ts`
(AES-256-GCM):

```
ENCRYPTION_KEY=<64-hex-char key>
```

Generate with:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

> **Important:** back up this key. Stored DB credentials are encrypted with it.
> Losing or changing it makes every saved connection undecryptable. Use the same
> key across all environments/deploys.

## How to connect a SQL Server named instance (UI steps)

1. Add Database → **Engine: SQL Server**.
2. **Host:** `SP21\SQL2019` (`HOST\INSTANCE`).
3. **Port:** leave empty (instance auto-resolves).
4. **Database:** leave empty to sync all non-system databases, or name one.
5. **Username / Password:** SQL auth account (e.g. `sa`).

## Prerequisites on the SQL Server side

- App host can resolve `SP21` (office DNS/WINS, or use IP/FQDN). On VPN if remote.
- **SQL Browser** service running; UDP **1434** open in firewall (named instance resolution).
- **TCP/IP** protocol enabled on the instance (SQL Server Configuration Manager).
- **Mixed-mode / SQL authentication** enabled (Windows integrated auth not supported here).

## Result

Connection test passes, credentials encrypted and stored, and the multi-database
schema syncs into the knowledge base.
