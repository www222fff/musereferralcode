import { createServerFn } from "@tanstack/react-start";
import { getCookie, setCookie } from "@tanstack/react-start/server";
import { getSql, type Sql } from "@/lib/db";

const VISITOR_COOKIE = "relay_vid";
const ASSUMED_CAP = 24;
const CLAIM_LIMIT_PER_HOUR = 30;
const USED_UP_REPORT_THRESHOLD = 3;
const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const CODE_RE = /^[A-Z0-9]{4,12}$/;

export type RecentCode = {
  id: string;
  code: string;
  handedOutMs: number;
  remaining: number;
  verified: boolean;
};

export type PoolSnapshot = {
  active: number;
  confirmed: number;
  recent: RecentCode[];
};

export type ClaimPayload = {
  claimId: string;
  codeId: string;
  code: string;
  remaining: number;
  verified: boolean;
};

type Ok<T> = { ok: true } & T;
type Fail = { ok: false; error: string };

type CodeCandidate = {
  id: string;
  code: string;
  createdMs: number;
  handouts: number;
  worked: number;
  assumed_cap: number;
};

function num(value: unknown): number {
  const n = typeof value === "number" ? value : Number(value);
  return Number.isFinite(n) ? n : 0;
}

function remainingOf(row: { handouts: number; assumed_cap: number }): number {
  return Math.max(0, row.assumed_cap - row.handouts);
}

function visitorKey(): string {
  const existing = getCookie(VISITOR_COOKIE);
  if (existing && UUID_RE.test(existing)) return existing;
  const id = crypto.randomUUID();
  setCookie(VISITOR_COOKIE, id, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 400,
  });
  return id;
}

function pickWeighted(rows: CodeCandidate[], excludeId?: string): CodeCandidate | null {
  const pool = rows.filter((row) => row.id !== excludeId && remainingOf(row) > 0);
  const fresh = pool
    .filter((row) => row.handouts === 0)
    .sort((a, b) => a.createdMs - b.createdMs);
  if (fresh[0]) return fresh[0];

  const total = pool.reduce((sum, row) => sum + remainingOf(row), 0);
  if (!total || pool.length === 0) return null;
  let ticket = Math.random() * total;
  for (const row of pool) {
    ticket -= remainingOf(row);
    if (ticket <= 0) return row;
  }
  return pool[pool.length - 1] ?? null;
}

async function loadCandidates(sql: Sql): Promise<CodeCandidate[]> {
  const rows = await sql<{
    id: string;
    code: string;
    created_ms: number;
    handouts: number;
    worked: number;
    assumed_cap: number;
  }>`
    select
      id,
      code,
      (extract(epoch from created_at) * 1000) as created_ms,
      handouts,
      worked,
      assumed_cap
    from codes
    where status = 'active' and handouts < assumed_cap
  `;
  return rows.map((row) => ({
    id: row.id,
    code: row.code,
    createdMs: num(row.created_ms),
    handouts: num(row.handouts),
    worked: num(row.worked),
    assumed_cap: num(row.assumed_cap),
  }));
}

async function countRecentClaims(sql: Sql, visitor: string): Promise<number> {
  const rows = await sql<{ n: number }>`
    select count(*) as n
    from rate_events
    where visitor_key = ${visitor}
      and kind = 'claim'
      and created_at > now() - interval '1 hour'
  `;
  return num(rows[0]?.n);
}

async function duplicateMessage(sql: Sql, code: string): Promise<string> {
  const rows = await sql<{
    status: string;
    handouts: number;
    assumed_cap: number;
  }>`
    select status, handouts, assumed_cap
    from codes
    where code = ${code}
    limit 1
  `;
  const row = rows[0];
  if (!row) return "That code is already in the pool.";
  const inRotation = row.status === "active" && num(row.handouts) < num(row.assumed_cap);
  if (!inRotation) {
    return `${code} is already in the pool, but it isn’t listed. It was taken out of rotation after a used-up report.`;
  }
  return `${code} is already in the pool and remains in rotation.`;
}

export const getPool = createServerFn({ method: "GET" }).handler(async (): Promise<PoolSnapshot> => {
  const sql = await getSql();
  const counts = await sql<{ active: number; confirmed: number }>`
    select
      (select count(*) from codes where status = 'active' and handouts < assumed_cap) as active,
      (select coalesce(sum(worked), 0) from codes) as confirmed
  `;
  const recent = await sql<{
    id: string;
    code: string;
    handed_out_ms: number;
    handouts: number;
    assumed_cap: number;
    worked: number;
  }>`
    select
      codes.id,
      codes.code,
      (extract(epoch from max(claims.created_at)) * 1000) as handed_out_ms,
      codes.handouts,
      codes.assumed_cap,
      codes.worked
    from codes
    join claims on claims.code_id = codes.id
    group by codes.id, codes.code, codes.handouts, codes.assumed_cap, codes.worked
    order by max(claims.created_at) desc
    limit 12
  `;
  return {
    active: num(counts[0]?.active),
    confirmed: num(counts[0]?.confirmed),
    recent: recent.map((row) => ({
      id: row.id,
      code: row.code,
      handedOutMs: num(row.handed_out_ms),
      remaining: remainingOf({
        handouts: num(row.handouts),
        assumed_cap: num(row.assumed_cap),
      }),
      verified: num(row.worked) > 0,
    })),
  };
});

type ClaimInput = { codeId?: string; excludeId?: string };

export const claimCode = createServerFn({ method: "POST" })
  .validator((input: unknown): ClaimInput => {
    if (input == null || typeof input !== "object") return {};
    const raw = input as Record<string, unknown>;
    const codeId = typeof raw.codeId === "string" && UUID_RE.test(raw.codeId) ? raw.codeId : undefined;
    const excludeId =
      typeof raw.excludeId === "string" && UUID_RE.test(raw.excludeId) ? raw.excludeId : undefined;
    return { codeId, excludeId };
  })
  .handler(async ({ data }): Promise<Ok<ClaimPayload> | Fail> => {
    const sql = await getSql();
    const visitor = visitorKey();
    const used = await countRecentClaims(sql, visitor);
    if (used >= CLAIM_LIMIT_PER_HOUR) {
      return { ok: false, error: "Too many requests from this browser. Try again in a little while." };
    }

    for (let attempt = 0; attempt < 5; attempt += 1) {
      const candidates = await loadCandidates(sql);
      const chosen = data.codeId
        ? (candidates.find((row) => row.id === data.codeId) ?? null)
        : pickWeighted(candidates, data.excludeId);
      if (!chosen) {
        if (data.codeId) return { ok: false, error: "That code isn’t in rotation anymore." };
        if (data.excludeId) return { ok: false, error: "No other code is in rotation right now." };
        return {
          ok: false,
          error: "Nothing is in rotation yet. Add a code below — it will be handed out first.",
        };
      }

      const updated = await sql<{
        id: string;
        code: string;
        handouts: number;
        worked: number;
        assumed_cap: number;
      }>`
        update codes
        set handouts = handouts + 1
        where id = ${chosen.id}
          and status = 'active'
          and handouts < assumed_cap
          and handouts = ${chosen.handouts}
        returning id, code, handouts, worked, assumed_cap
      `;
      const row = updated[0];
      if (!row) {
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
          assumed_cap: num(row.assumed_cap),
        }),
        verified: num(row.worked) > 0,
      };
    }

    return { ok: false, error: "The pool shifted under us. Try once more." };
  });

type FeedbackInput = { claimId: string; result: "worked" | "used_up" };

export const sendFeedback = createServerFn({ method: "POST" })
  .validator((input: unknown): FeedbackInput | null => {
    if (input == null || typeof input !== "object") return null;
    const raw = input as Record<string, unknown>;
    const claimId = typeof raw.claimId === "string" ? raw.claimId : "";
    const result = raw.result;
    if (!UUID_RE.test(claimId)) return null;
    if (result !== "worked" && result !== "used_up") return null;
    return { claimId, result };
  })
  .handler(async ({ data }): Promise<{ ok: true } | Fail> => {
    if (!data) return { ok: false, error: "That report didn’t register." };
    const sql = await getSql();
    const visitor = visitorKey();
    const existing = await sql<{ code_id: string; result: string | null }>`
      select code_id, result
      from claims
      where id = ${data.claimId} and visitor_key = ${visitor}
    `;
    const found = existing[0];
    if (!found) return { ok: false, error: "That handoff isn’t on this browser." };
    if (found.result) return { ok: false, error: "That handoff was already reported." };

    if (data.result === "used_up") {
      const prior = await sql<{ id: string }>`
        select id
        from claims
        where code_id = ${found.code_id}
          and visitor_key = ${visitor}
          and result = 'used_up'
        limit 1
      `;
      if (prior[0]) {
        return {
          ok: false,
          error: "This browser already reported that code as used up.",
        };
      }
    }

    const marked = await sql<{ code_id: string }>`
      update claims
      set result = ${data.result}
      where id = ${data.claimId} and visitor_key = ${visitor} and result is null
      returning code_id
    `;
    const markedRow = marked[0];
    if (!markedRow) return { ok: false, error: "That handoff was already reported." };

    if (data.result === "worked") {
      await sql`
        update codes
        set worked = worked + 1,
            streak_bad = 0
        where id = ${markedRow.code_id}
      `;
    } else if (data.result === "used_up") {
      const reports = await sql<{ n: number }>`
        select count(distinct visitor_key) as n
        from claims
        where code_id = ${markedRow.code_id}
          and result = 'used_up'
      `;
      const independentReports = num(reports[0]?.n);
      await sql`
        update codes
        set
          used_up = used_up + 1,
          streak_bad = ${independentReports},
          assumed_cap = case
            when ${independentReports} >= ${USED_UP_REPORT_THRESHOLD} then handouts
            else assumed_cap
          end,
          status = case
            when ${independentReports} >= ${USED_UP_REPORT_THRESHOLD} then 'retired'
            else status
          end
        where id = ${markedRow.code_id}
      `;
    }

    return { ok: true };
  });

export const shareCode = createServerFn({ method: "POST" })
  .validator((input: unknown): { code: string } => {
    if (input == null || typeof input !== "object") return { code: "" };
    const raw = input as Record<string, unknown>;
    return { code: typeof raw.code === "string" ? raw.code : "" };
  })
  .handler(async ({ data }): Promise<Ok<{ code: string }> | Fail> => {
    const normalized = data.code.trim().toUpperCase().replace(/[^A-Z0-9]/g, "");
    if (!CODE_RE.test(normalized)) {
      return { ok: false, error: "Use 4–12 letters or numbers, like K4M2QP." };
    }
    if (/^(.)\1+$/.test(normalized)) {
      return { ok: false, error: "That doesn’t look like a real code." };
    }

    const sql = await getSql();
    const visitor = visitorKey();

    const dup = await sql<{ id: string }>`select id from codes where code = ${normalized} limit 1`;
    if (dup[0]) return { ok: false, error: await duplicateMessage(sql, normalized) };

    await sql`alter table codes drop constraint if exists codes_visitor_key_key`;

    try {
      await sql`
        insert into codes (id, code, visitor_key, assumed_cap)
        values (${crypto.randomUUID()}, ${normalized}, ${visitor}, ${ASSUMED_CAP})
      `;
    } catch (error) {
      const message = error instanceof Error ? error.message : "";
      if (/duplicate|unique/i.test(message)) {
        return { ok: false, error: await duplicateMessage(sql, normalized) };
      }
      throw error;
    }

    return { ok: true, code: normalized };
  });
