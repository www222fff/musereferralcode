import { a as setCookie$1, i as getCookie, n as TSS_SERVER_FUNCTION, t as createServerFn } from "./ssr.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/pool.functions-DMG1RgN_.js
var createServerRpc = (serverFnMeta, splitImportFn) => {
	const url = "/_serverFn/" + serverFnMeta.id;
	return Object.assign(splitImportFn, {
		url,
		serverFnMeta,
		[TSS_SERVER_FUNCTION]: true
	});
};
var _0002_codes_default = "create table if not exists codes (\n  id text primary key,\n  code text not null unique,\n  created_at timestamptz not null default now(),\n  status text not null default 'active' check (status in ('active', 'retired')),\n  handouts integer not null default 0,\n  worked integer not null default 0,\n  used_up integer not null default 0,\n  invalid integer not null default 0,\n  streak_bad integer not null default 0,\n  assumed_cap integer not null default 24,\n  visitor_key text not null unique\n);\n\ncreate index if not exists codes_rotation_idx on codes (status, created_at desc);\n\ncreate table if not exists claims (\n  id text primary key,\n  code_id text not null references codes (id),\n  created_at timestamptz not null default now(),\n  result text check (result is null or result in ('worked', 'used_up', 'invalid')),\n  visitor_key text not null\n);\n\ncreate index if not exists claims_visitor_idx on claims (visitor_key, created_at desc);\n\ncreate table if not exists rate_events (\n  id text primary key,\n  visitor_key text not null,\n  kind text not null,\n  created_at timestamptz not null default now()\n);\n\ncreate index if not exists rate_events_lookup_idx on rate_events (visitor_key, kind, created_at desc);\n";
/**
* Migration bookkeeping shared by the two appliers — `scripts/migrate.mjs`
* (deploy, `readdir`) and `src/lib/db.ts` (PGLite preview, `import.meta.glob`).
*
* Applied files are keyed by BASENAME, so the same file applies once no matter
* which directory it is globbed from. That is what makes the auth schema safe to
* copy from `migrations/auth/` into `migrations/` when an app turns sign-in on:
* a database that already has `0001_auth.sql` will not re-run it.
*
* Neither applier descends into subdirectories, so `migrations/auth/*.sql` is
* out of scope for both until it is copied up.
*/
/**
* The `_migrations` key for a migration path (or bare filename).
* @param {string} path
* @returns {string}
*/
function migrationName(path) {
	return path.split("/").pop() ?? path;
}
/**
* @param {string} path
* @returns {boolean}
*/
function isMigrationFile(path) {
	return path.endsWith(".sql");
}
/**
* Migrations in `paths` that are not yet in `applied`, in apply order.
* Non-`.sql` entries (a `readdir` also yields `migrations/auth/`) are dropped.
* @param {Iterable<string>} paths
* @param {Iterable<string>} applied
* @returns {Array<{ name: string, path: string }>}
*/
function pendingMigrations(paths, applied) {
	const done = new Set(applied);
	return [...paths].filter(isMigrationFile).map((path) => ({
		name: migrationName(path),
		path
	})).sort((a, b) => a.name.localeCompare(b.name)).filter(({ name }) => !done.has(name));
}
var rawDatabaseUrl = typeof process !== "undefined" ? process.env.DATABASE_URL : void 0;
var databaseUrl = rawDatabaseUrl && rawDatabaseUrl.trim() ? rawDatabaseUrl : void 0;
/**
* Active backend: real **Neon** when `DATABASE_URL` is set (deployed / configured
* sandbox), otherwise a local embedded **PGLite** (Postgres compiled to WASM) so
* the app has a working database even with nothing configured — the live preview
* included. Swap in Neon later by just setting `DATABASE_URL`; no code changes.
*/
var dbSource = databaseUrl ? "neon" : "pglite";
/**
* Init state lives on globalThis as promises: dev HMR creates new instances of
* this module, and two instances racing module-level state would open a second
* pool or run two concurrent PGLite migration passes (whose duplicate
* `_migrations` insert rejects — and would get memoized, poisoning every later
* `getSql()`). A failed init clears its slot so the next call retries.
*/
var globalRef = globalThis;
/**
* Result-type parity: Postgres sends every value as text plus a type OID — the
* JS value is the DRIVER's parsing choice, and pg and PGLite disagree (pg:
* int8 -> string, date -> local-midnight Date; PGLite: int8 -> BigInt, which
* JSON.stringify rejects, date -> UTC Date). Normalize both so preview and
* production return identical, JSON-safe shapes:
*   int8/bigint (incl. count(*)) -> number (past 2^53 loses precision — cast
*                                   `::text` if you ever need huge integers)
*   date                         -> 'YYYY-MM-DD' string
*   interval                     -> Postgres interval text
* numeric already comes back as a string on both (arbitrary precision).
*/
var OID_INT8 = 20;
var OID_DATE = 1082;
var OID_INTERVAL = 1186;
var identity = (v) => v;
/** Wrap a query runner in the tagged-template + `.query()` `Sql` surface. */
function toSql(run) {
	const sql = (async (strings, ...values) => {
		let text = strings[0];
		for (let i = 0; i < values.length; i += 1) text += `$${i + 1}${strings[i + 1]}`;
		return run(text, values);
	});
	sql.query = (text, params = []) => run(text, params);
	return sql;
}
function createNeonSql() {
	globalRef.__pgSqlPromise__ ??= (async () => {
		const { Pool, types } = await import("../_libs/pg.mjs").then((n) => n.t);
		types.setTypeParser(OID_INT8, Number);
		types.setTypeParser(OID_DATE, identity);
		types.setTypeParser(OID_INTERVAL, identity);
		const pool = new Pool({ connectionString: databaseUrl });
		return toSql(async (text, params) => {
			return (await pool.query(text, params)).rows;
		});
	})().catch((err) => {
		globalRef.__pgSqlPromise__ = void 0;
		throw err;
	});
	return globalRef.__pgSqlPromise__;
}
async function createPgliteSql() {
	globalRef.__pgliteInstance__ ??= (async () => {
		const { PGlite } = await import("../_libs/electric-sql__pglite.mjs").then((n) => n.t);
		const pg = new PGlite({ parsers: {
			[OID_INT8]: Number,
			[OID_DATE]: identity,
			[OID_INTERVAL]: identity
		} });
		await pg.waitReady;
		await pg.exec("create table if not exists _migrations (name text primary key, applied_at timestamptz not null default now())");
		return pg;
	})().catch((err) => {
		globalRef.__pgliteInstance__ = void 0;
		throw err;
	});
	const pg = await globalRef.__pgliteInstance__;
	const migrate = async () => {
		const migrations = /* #__PURE__ */ Object.assign({ "/migrations/0002_codes.sql": _0002_codes_default });
		const done = (await pg.query("select name from _migrations")).rows.map((r) => r.name);
		for (const { name, path } of pendingMigrations(Object.keys(migrations), done)) await pg.transaction(async (tx) => {
			await tx.exec(migrations[path]);
			await tx.query("insert into _migrations (name) values ($1)", [name]);
		});
	};
	const pass = (globalRef.__pgliteMigrateChain__ ?? Promise.resolve()).catch(() => void 0).then(migrate);
	globalRef.__pgliteMigrateChain__ = pass;
	await pass;
	return toSql(async (text, params) => {
		return (await pg.query(text, params)).rows;
	});
}
var sqlPromise = null;
async function createSql() {
	if (typeof window !== "undefined") throw new Error("@/lib/db is server-only — call getSql() from a createServerFn handler or a server route loader, never from client code.");
	return dbSource === "neon" ? createNeonSql() : createPgliteSql();
}
/**
* Get the shared, **server-only** SQL client. Neon when `DATABASE_URL` is set,
* otherwise the local PGLite fallback. Memoized — safe to call per request.
*
* Schema comes from `migrations/*.sql`, auto-applied before the first query on
* both backends — define tables there, never inline in server functions.
*/
function getSql() {
	sqlPromise ??= createSql().catch((err) => {
		sqlPromise = null;
		throw err;
	});
	return sqlPromise;
}
/**
* Finish DB bootstrap before the server handles traffic.
*
* - **PGLite** (preview / no `DATABASE_URL`): open the in-memory DB and apply
*   `migrations/*.sql`. Idempotent — concurrent callers share one promise.
* - **Neon**: no-op (pool is created lazily on first query).
*
* Vite `configureServer` awaits this at dev startup; production imports of this
* module kick it off immediately (see bottom of file).
*/
function ensureDbReady() {
	if (dbSource !== "pglite") return Promise.resolve();
	return getSql().then(() => void 0);
}
var globalBoot = globalThis;
if (typeof window === "undefined" && dbSource === "pglite") globalBoot.__pgBootstrapPromise__ ??= ensureDbReady().catch((err) => {
	globalBoot.__pgBootstrapPromise__ = void 0;
	console.error("[db] PGLite bootstrap failed:", err);
	throw err;
});
var VISITOR_COOKIE = "relay_vid";
var ASSUMED_CAP = 24;
var CLAIM_LIMIT_PER_HOUR = 30;
var SHARE_LIMIT_PER_HOUR = 60;
var CODE_RE = /^[A-Z0-9]{4,12}$/;
var UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
function num(value) {
	const n = typeof value === "number" ? value : Number(value);
	return Number.isFinite(n) ? n : 0;
}
function remainingOf(row) {
	return Math.max(0, row.assumed_cap - row.handouts);
}
function visitorKey() {
	const existing = getCookie(VISITOR_COOKIE);
	if (existing && UUID_RE.test(existing)) return existing;
	const key = crypto.randomUUID();
	setCookie$1(VISITOR_COOKIE, key, {
		httpOnly: true,
		secure: true,
		sameSite: "lax",
		maxAge: 3456e4,
		path: "/"
	});
	return key;
}
function pickWeighted(rows, excludeId) {
	const pool = rows.filter((row) => row.id !== excludeId && remainingOf(row) > 0);
	const total = pool.reduce((sum, row) => sum + remainingOf(row), 0);
	if (!total || pool.length === 0) return null;
	let ticket = Math.random() * total;
	for (const row of pool) {
		ticket -= remainingOf(row);
		if (ticket <= 0) return row;
	}
	return pool[pool.length - 1] ?? null;
}
async function loadCandidates(sql) {
	return (await sql`
    select id, code, handouts, worked, assumed_cap
    from codes
    where status = 'active' and handouts < assumed_cap
  `).map((row) => ({
		id: row.id,
		code: row.code,
		handouts: num(row.handouts),
		worked: num(row.worked),
		assumed_cap: num(row.assumed_cap)
	}));
}
async function countRecentClaims(sql, visitor) {
	return num((await sql`
    select count(*) as n
    from rate_events
    where visitor_key = ${visitor}
      and kind = 'claim'
      and created_at > now() - interval '1 hour'
  `)[0]?.n);
}
var getPool_createServerFn_handler = createServerRpc({
	id: "0130a9eb535fe8d8f05180bd8930a9673bbdf9aa1c43595fe596a1d8b3d17ae7",
	name: "getPool",
	filename: "src/lib/pool.functions.ts"
}, (opts) => getPool.__executeServer(opts));
var getPool = createServerFn({ method: "GET" }).handler(getPool_createServerFn_handler, async () => {
	const sql = await getSql();
	const counts = await sql`
    select
      (select count(*) from codes where status = 'active' and handouts < assumed_cap) as active,
      (select coalesce(sum(worked), 0) from codes) as confirmed
  `;
	const recent = await sql`
    select
      id,
      code,
      (extract(epoch from created_at) * 1000) as created_ms,
      handouts,
      assumed_cap,
      worked
    from codes
    where status = 'active' and handouts < assumed_cap
    order by created_at desc
    limit 12
  `;
	return {
		active: num(counts[0]?.active),
		confirmed: num(counts[0]?.confirmed),
		recent: recent.map((row) => ({
			id: row.id,
			code: row.code,
			createdMs: num(row.created_ms),
			remaining: remainingOf({
				handouts: num(row.handouts),
				assumed_cap: num(row.assumed_cap)
			}),
			verified: num(row.worked) > 0
		}))
	};
});
var claimCode_createServerFn_handler = createServerRpc({
	id: "90c07e5e3c4d6d6aee9dfa1a36cca758a7af9d0ac2d9ae257462d4eb5188cb4c",
	name: "claimCode",
	filename: "src/lib/pool.functions.ts"
}, (opts) => claimCode.__executeServer(opts));
var claimCode = createServerFn({ method: "POST" }).validator((input) => {
	if (input == null || typeof input !== "object") return {};
	const raw = input;
	return {
		codeId: typeof raw.codeId === "string" && UUID_RE.test(raw.codeId) ? raw.codeId : void 0,
		excludeId: typeof raw.excludeId === "string" && UUID_RE.test(raw.excludeId) ? raw.excludeId : void 0
	};
}).handler(claimCode_createServerFn_handler, async ({ data }) => {
	const sql = await getSql();
	const visitor = visitorKey();
	if (await countRecentClaims(sql, visitor) >= CLAIM_LIMIT_PER_HOUR) return {
		ok: false,
		error: "Too many requests from this browser. Try again in a little while."
	};
	for (let attempt = 0; attempt < 5; attempt += 1) {
		const candidates = await loadCandidates(sql);
		const chosen = data.codeId ? candidates.find((row) => row.id === data.codeId) ?? null : pickWeighted(candidates, data.excludeId);
		if (!chosen) {
			if (data.codeId) return {
				ok: false,
				error: "That code isn’t in rotation anymore."
			};
			return {
				ok: false,
				error: "Nothing is in rotation yet. Add a code below — it will be handed out first."
			};
		}
		const row = (await sql`
        update codes
        set handouts = handouts + 1
        where id = ${chosen.id}
          and status = 'active'
          and handouts < assumed_cap
        returning id, code, handouts, worked, assumed_cap
      `)[0];
		if (!row) {
			if (data.codeId) return {
				ok: false,
				error: "That code isn’t in rotation anymore."
			};
			continue;
		}
		const claimId = crypto.randomUUID();
		await sql`
        insert into claims (id, code_id, visitor_key)
        values (${claimId}, ${row.id}, ${visitor})
      `;
		await sql`
        insert into rate_events (id, visitor_key, kind)
        values (${crypto.randomUUID()}, ${visitor}, 'claim')
      `;
		await sql`delete from rate_events where created_at < now() - interval '2 days'`;
		return {
			ok: true,
			claimId,
			codeId: row.id,
			code: row.code,
			remaining: remainingOf({
				handouts: num(row.handouts),
				assumed_cap: num(row.assumed_cap)
			}),
			verified: num(row.worked) > 0
		};
	}
	return {
		ok: false,
		error: "The pool shifted under us. Try once more."
	};
});
var sendFeedback_createServerFn_handler = createServerRpc({
	id: "6d883bf58ad44ba7f5175ed0a8c4a055e1a4f23f4c1333fd58bde91e324bb6bd",
	name: "sendFeedback",
	filename: "src/lib/pool.functions.ts"
}, (opts) => sendFeedback.__executeServer(opts));
var sendFeedback = createServerFn({ method: "POST" }).validator((input) => {
	if (input == null || typeof input !== "object") return null;
	const raw = input;
	const claimId = typeof raw.claimId === "string" ? raw.claimId : "";
	const result = raw.result;
	if (!UUID_RE.test(claimId)) return null;
	if (result !== "worked" && result !== "used_up" && result !== "invalid") return null;
	return {
		claimId,
		result
	};
}).handler(sendFeedback_createServerFn_handler, async ({ data }) => {
	if (!data) return {
		ok: false,
		error: "That report didn’t come through. Try again."
	};
	const sql = await getSql();
	const visitor = visitorKey();
	if (!(await sql`
      select code_id, result from claims
      where id = ${data.claimId} and visitor_key = ${visitor}
    `)[0]) return {
		ok: false,
		error: "We couldn’t match that handoff. Get a code again."
	};
	const markedRow = (await sql`
      update claims set result = ${data.result}
      where id = ${data.claimId} and visitor_key = ${visitor} and result is null
      returning code_id
    `)[0];
	if (!markedRow) return { ok: true };
	if (data.result === "worked") await sql`
        update codes
        set worked = worked + 1, streak_bad = 0
        where id = ${markedRow.code_id}
      `;
	else if (data.result === "used_up") await sql`
        update codes
        set
          used_up = used_up + 1,
          streak_bad = streak_bad + 1,
          assumed_cap = handouts,
          status = case when streak_bad + 1 >= 3 then 'retired' else status end
        where id = ${markedRow.code_id}
      `;
	else await sql`
        update codes
        set
          invalid = invalid + 1,
          streak_bad = streak_bad + 1,
          status = case when streak_bad + 1 >= 2 then 'retired' else status end
        where id = ${markedRow.code_id}
      `;
	return { ok: true };
});
var shareCode_createServerFn_handler = createServerRpc({
	id: "443cc6627ee62e8709e8a88e6db4f966f16f218cc5f3953e69964f3ca3c1bd7c",
	name: "shareCode",
	filename: "src/lib/pool.functions.ts"
}, (opts) => shareCode.__executeServer(opts));
var shareCode = createServerFn({ method: "POST" }).validator((input) => {
	if (input == null || typeof input !== "object") return { code: "" };
	const raw = input;
	return { code: typeof raw.code === "string" ? raw.code : "" };
}).handler(shareCode_createServerFn_handler, async ({ data }) => {
	const normalized = data.code.trim().toUpperCase().replace(/[^A-Z0-9]/g, "");
	if (!CODE_RE.test(normalized)) return {
		ok: false,
		error: "Use 4–12 letters or numbers, like K4M2QP."
	};
	if (/^(.)\1+$/.test(normalized)) return {
		ok: false,
		error: "That doesn’t look like a real code."
	};
	const sql = await getSql();
	const visitor = visitorKey();
	if (num((await sql`
      select count(*) as n from codes where created_at > now() - interval '1 hour'
    `)[0]?.n) >= SHARE_LIMIT_PER_HOUR) return {
		ok: false,
		error: "The pool is taking a lot of new codes. Try again shortly."
	};
	if ((await sql`
      select id from codes where visitor_key = ${visitor} limit 1
    `)[0]) return {
		ok: false,
		error: "This browser already added a code. One per person keeps the pool fair."
	};
	if ((await sql`select id from codes where code = ${normalized} limit 1`)[0]) return {
		ok: false,
		error: "That code is already in the pool."
	};
	try {
		await sql`
        insert into codes (id, code, visitor_key, assumed_cap)
        values (${crypto.randomUUID()}, ${normalized}, ${visitor}, ${ASSUMED_CAP})
      `;
	} catch (error) {
		const message = error instanceof Error ? error.message : "";
		if (/duplicate|unique/i.test(message)) return {
			ok: false,
			error: "That code is already in the pool."
		};
		throw error;
	}
	return {
		ok: true,
		code: normalized
	};
});
//#endregion
export { claimCode_createServerFn_handler, getPool_createServerFn_handler, sendFeedback_createServerFn_handler, shareCode_createServerFn_handler };
