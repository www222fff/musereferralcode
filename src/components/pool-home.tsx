import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import { Check, Copy } from "lucide-react";
import {
  claimCode,
  getPool,
  sendFeedback,
  shareCode,
  type ClaimPayload,
  type PoolSnapshot,
} from "@/lib/pool.functions";

const STORAGE_KEY = "relay:claim";
const CLAIM_TTL_MS = 30 * 60 * 1000;

type Notice = { tone: "ok" | "error" | "plain"; text: string };
type SavedClaim = ClaimPayload & { at: number; feedback?: "worked" };

function ago(ms: number): string {
  const minutes = Math.round((Date.now() - ms) / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  return `${days}d ago`;
}

function readSaved(): SavedClaim | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as SavedClaim;
    if (!parsed?.claimId || !parsed.code || Date.now() - parsed.at > CLAIM_TTL_MS) {
      window.localStorage.removeItem(STORAGE_KEY);
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

function writeSaved(claim: SavedClaim | null) {
  try {
    if (!claim) window.localStorage.removeItem(STORAGE_KEY);
    else window.localStorage.setItem(STORAGE_KEY, JSON.stringify(claim));
  } catch {
    /* private mode */
  }
}

function statusLine(pool: PoolSnapshot): string {
  if (pool.active <= 0) return "Waiting for the first code";
  const codes = pool.active === 1 ? "1 code in rotation" : `${pool.active} codes in rotation`;
  if (pool.confirmed <= 0) return codes;
  const confirmed =
    pool.confirmed === 1 ? "1 confirmed" : `${pool.confirmed} confirmed`;
  return `${codes} · ${confirmed}`;
}

export function PoolHome({ initial }: { initial: PoolSnapshot }) {
  const [pool, setPool] = useState(initial);
  const [claim, setClaim] = useState<SavedClaim | null>(null);
  const [notice, setNotice] = useState<Notice | null>(null);
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);
  const [draft, setDraft] = useState("");
  const [shareNotice, setShareNotice] = useState<Notice | null>(null);
  const [sharing, setSharing] = useState(false);

  useEffect(() => {
    const saved = readSaved();
    if (saved) setClaim(saved);
  }, []);

  async function refresh() {
    const next = await getPool();
    setPool(next);
  }

  function showClaim(next: ClaimPayload, feedback?: "worked") {
    const saved: SavedClaim = { ...next, at: Date.now(), feedback };
    setClaim(saved);
    writeSaved(saved);
    setCopied(false);
  }

  function resetClaim() {
    setClaim(null);
    writeSaved(null);
    setNotice(null);
    setCopied(false);
  }

  async function take(input: { codeId?: string; excludeId?: string }) {
    setBusy(true);
    setNotice({ tone: "plain", text: "Finding a code…" });
    try {
      const result = await claimCode({ data: input });
      if (!result.ok) {
        setNotice({ tone: "error", text: result.error });
        return;
      }
      showClaim(result);
      setNotice(null);
      void refresh().catch(() => undefined);
    } catch {
      setNotice({ tone: "error", text: "Couldn’t reach the pool. Try again." });
    } finally {
      setBusy(false);
    }
  }

  async function copy() {
    if (!claim) return;
    try {
      await navigator.clipboard.writeText(claim.code);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      setNotice({ tone: "plain", text: "Select the code above to copy it." });
    }
  }

  async function feedback(result: "worked" | "used_up") {
    if (!claim || claim.feedback) return;
    setBusy(true);
    try {
      const response = await sendFeedback({ data: { claimId: claim.claimId, result } });
      if (!response.ok) {
        setNotice({ tone: "error", text: response.error });
        return;
      }
      if (result === "worked") {
        showClaim(claim, "worked");
        setNotice({
          tone: "ok",
          text: "Glad it worked. If you have a code of your own, add it below.",
        });
        await refresh();
        return;
      }
      setNotice({ tone: "plain", text: "Noted. Finding a different code…" });
      const next = await claimCode({ data: { excludeId: claim.codeId } });
      await refresh();
      if (!next.ok) {
        setClaim(null);
        writeSaved(null);
        setNotice({ tone: "error", text: next.error });
        return;
      }
      showClaim(next);
      setNotice(null);
    } catch {
      setNotice({ tone: "error", text: "Couldn’t reach the pool. Try again." });
    } finally {
      setBusy(false);
    }
  }

  async function onShare(event: FormEvent) {
    event.preventDefault();
    setSharing(true);
    setShareNotice({ tone: "plain", text: "Adding…" });
    try {
      const result = await shareCode({ data: { code: draft } });
      if (!result.ok) {
        setShareNotice({ tone: "error", text: result.error });
        return;
      }
      setDraft("");
      setShareNotice({
        tone: "ok",
        text: `${result.code} is in the pool. We’ll start handing it out.`,
      });
      setNotice(null);
      await refresh();
    } catch {
      setShareNotice({ tone: "error", text: "Couldn’t reach the pool. Try again." });
    } finally {
      setSharing(false);
    }
  }

  const shown = claim != null;

  return (
    <div>
      <section className="text-center">
        <p className="text-sm text-muted">Community pool for Meta Muse</p>
        <h1 className="mt-3 text-4xl leading-tight font-medium tracking-tight sm:text-5xl">
          Take a code.
          <span className="mt-1 block font-normal italic">Leave one behind.</span>
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-lg text-muted">
          Redeem someone else’s Muse code and you both get 1 billion tokens. Relay
          rotates what the pool still has left, so one public post doesn’t burn a
          code in minutes.
        </p>
        <a
          href="https://twitter.com/intent/follow?screen_name=BlockInsight214"
          target="_blank"
          rel="noreferrer"
          aria-label="Follow @BlockInsight214 on X"
          className="mt-5 inline-flex items-center rounded-full bg-ink px-5 py-2.5 text-base font-medium text-bg no-underline transition-opacity duration-150 hover:opacity-85"
        >
          Follow on X · @BlockInsight214 · 王小庄
        </a>

        <div className="relative z-0 mx-auto mt-8 mb-4 w-full max-w-md rounded-card border border-line bg-surface p-5 text-left shadow-card">
          {!shown ? (
            <div className="rise">
              <div className="flex min-h-6 items-center gap-2 text-sm text-muted">
                <span
                  className={`size-2 rounded-full ${pool.active > 0 ? "bg-ok" : "bg-faint"}`}
                  aria-hidden
                />
                <span className="tabular-nums">{statusLine(pool)}</span>
              </div>
              <p
                className="my-4 text-center font-mono text-4xl font-medium tracking-code text-faint select-none blur-sm sm:text-5xl"
                aria-hidden
              >
                K4M2QP
              </p>
              <button
                type="button"
                className="flex h-12 w-full items-center justify-center rounded-control bg-ink text-base font-medium text-bg transition-opacity duration-150 hover:opacity-90 disabled:opacity-50"
                onClick={() => void take({})}
                disabled={busy}
              >
                Get a code
              </button>
            </div>
          ) : (
            <div className="rise">
              <div className="flex min-h-6 items-center gap-2 text-sm text-muted">
                <span
                  className={`size-2 rounded-full ${claim.verified ? "bg-ok" : "bg-warn"}`}
                  aria-hidden
                />
                <span className="tabular-nums">
                  {claim.verified ? "Reported working" : "New code"}
                  {" · "}~{claim.remaining} {claim.remaining === 1 ? "use" : "uses"} left
                </span>
              </div>
              <p className="my-4 text-center font-mono text-4xl font-medium tracking-code text-ink select-all sm:text-5xl">
                {claim.code}
              </p>
              <button
                type="button"
                className="flex h-12 w-full items-center justify-center gap-2 rounded-control bg-ink text-base font-medium text-bg transition-opacity duration-150 hover:opacity-90"
                onClick={() => void copy()}
              >
                {copied ? <Check className="size-4" aria-hidden /> : <Copy className="size-4" aria-hidden />}
                {copied ? "Copied" : "Copy code"}
              </button>
              <button
                type="button"
                className="mt-2 flex h-12 w-full items-center justify-center rounded-control border border-line bg-surface text-base font-medium text-ink transition-opacity duration-150 hover:border-faint disabled:opacity-50"
                onClick={resetClaim}
                disabled={busy}
              >
                Get another code
              </button>
              <p className="mt-3 text-center text-sm text-muted">
                In Muse, open Settings and redeem it within 48 hours of joining.
              </p>
              {claim.feedback !== "worked" ? (
                <div className="mt-4 border-t border-line pt-4">
                  <p className="mb-2 text-center text-sm font-medium">Did it work?</p>
                  <div className="flex flex-wrap justify-center gap-2">
                    <button
                      type="button"
                      className="h-10 rounded-control border border-line bg-surface px-3 text-sm font-medium hover:border-faint disabled:opacity-50"
                      disabled={busy}
                      onClick={() => void feedback("worked")}
                    >
                      Worked
                    </button>
                    <button
                      type="button"
                      className="h-10 rounded-control border border-line bg-surface px-3 text-sm font-medium hover:border-faint disabled:opacity-50"
                      disabled={busy}
                      onClick={() => void feedback("used_up")}
                    >
                      Used up
                    </button>
                  </div>
                </div>
              ) : null}
            </div>
          )}
          {notice ? (
            <p
              className={`mt-3 text-center text-sm ${
                notice.tone === "error" ? "text-danger" : notice.tone === "ok" ? "text-ok" : "text-muted"
              }`}
              role="status"
            >
              {notice.text}
            </p>
          ) : null}
        </div>
      </section>

      <section id="share" className="mt-14 scroll-mt-20 border-t border-line pt-10">
        <form onSubmit={(event) => void onShare(event)} className="mx-auto max-w-xl">
          <label htmlFor="code-input" className="block text-lg font-medium">
            Add your Muse code
          </label>
          <div className="mt-3 flex flex-col gap-3 sm:flex-row">
            <input
              id="code-input"
              value={draft}
              onChange={(event) => setDraft(event.target.value.toUpperCase())}
              placeholder="e.g. K4M2QP"
              autoComplete="off"
              autoCapitalize="characters"
              spellCheck={false}
              maxLength={12}
              required
              className="h-12 w-full min-w-0 flex-1 rounded-control border border-line bg-surface px-4 font-mono text-base tracking-wider text-ink uppercase placeholder:font-sans placeholder:tracking-normal placeholder:text-faint placeholder:normal-case"
            />
            <button
              type="submit"
              disabled={sharing}
              className="h-12 rounded-control bg-ink px-6 text-base font-medium text-bg transition-opacity duration-150 hover:opacity-90 disabled:opacity-50"
            >
              Add to pool
            </button>
          </div>
          {shareNotice ? (
            <p
              className={`mt-3 text-sm ${
                shareNotice.tone === "error"
                  ? "text-danger"
                  : shareNotice.tone === "ok"
                    ? "text-ok"
                    : "text-muted"
              }`}
              role="status"
            >
              {shareNotice.text}
            </p>
          ) : null}
          <p className="mt-3 text-center text-sm text-faint">
            Codes are public and can run out. Never pay for one.
          </p>
        </form>
      </section>

      <section className="mt-14">
        <div className="mb-3 flex items-baseline justify-between gap-4">
          <h2 className="text-xl font-medium">Recently handed out</h2>
          <span className="text-sm text-faint tabular-nums">Latest 12</span>
        </div>
        <ul className="overflow-hidden rounded-card border border-line bg-surface">
          {pool.recent.length === 0 ? (
            <li className="px-4 py-6 text-center text-muted">
              No codes have been handed out yet. New codes are first in line.
            </li>
          ) : (
            pool.recent.map((row) => (
              <li
                key={row.id}
                className="flex items-center gap-3 border-t border-line px-4 py-3 first:border-t-0"
              >
                <span className="font-mono text-base font-medium tracking-code">{row.code}</span>
                <span className="min-w-0 flex-1 text-sm text-muted">
                  <span className="block" suppressHydrationWarning>
                    Handed out {ago(row.handedOutMs)}
                  </span>
                  <span className="block text-faint tabular-nums">
                    ~{row.remaining} left{row.verified ? " · checked" : ""}
                  </span>
                </span>
              </li>
            ))
          )}
        </ul>
      </section>

      <section id="faq" className="mt-14 scroll-mt-20">
        <h2 className="text-xl font-medium">FAQ</h2>
        <div className="mt-2">
          <Faq q="What do I get for using a code?">
            When the code is redeemed in Muse, you and the person who shared it each get 1
            billion Muse tokens. Anything more specific you read elsewhere is a rumor.
          </Faq>
          <Faq q="Where do I enter it?">
            In the Muse app or on the web, open Settings and redeem the code. It has to happen
            within 48 hours of creating the account, so do it right after you join.
          </Faq>
          <Faq q="Why did Muse say the code was used up?">
            Each code only works a limited number of times, often somewhere around 20 to 30. We
            can’t see Muse’s real counter. Mark it used up and we’ll hand you a different one.
          </Faq>
          <Faq q="How do you estimate uses left?">
            We count how often a code is handed out. Codes with more estimated uses left are
            more likely to be next. A “used up” report stops further handouts. “Worked” means
            someone redeemed it.
          </Faq>
          <Faq q="Where is Muse available?">
            As of late September 2026, Muse is in the US and Canada. A code will not unlock it
            from anywhere else.
          </Faq>
          <Faq q="Is Relay run by Meta?">
            No. This is an independent pool. We never ask for a Muse or Meta login, and you
            should never pay for a code.
          </Faq>
        </div>
      </section>
    </div>
  );
}

function Faq({ q, children }: { q: string; children: ReactNode }) {
  return (
    <details className="group border-b border-line py-3">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-medium">
        {q}
        <span className="text-faint group-open:hidden" aria-hidden>
          +
        </span>
        <span className="hidden text-faint group-open:inline" aria-hidden>
          –
        </span>
      </summary>
      <p className="mt-2 text-base text-muted">{children}</p>
    </details>
  );
}
