import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteFrame } from "@/components/site-frame";

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { title: "Privacy — Relay" },
      {
        name: "description",
        content: "What Relay stores: a browser cookie, and the codes people choose to share.",
      },
    ],
  }),
  component: Privacy,
});

function Privacy() {
  return (
    <SiteFrame>
      <article className="mx-auto max-w-xl">
        <h1 className="text-4xl font-medium tracking-tight">Privacy</h1>
        <p className="mt-4 text-muted">
          Relay is a shared list of Muse referral codes. It is not an account system, and it is
          not Meta.
        </p>
        <h2 className="mt-8 text-xl font-medium">What we store</h2>
        <ul className="mt-3 list-disc space-y-2 pl-5 text-muted">
          <li>
            A first-party cookie on this browser, so grabs can be rate-limited. It is a random id,
            not your name or login.
          </li>
          <li>
            The code you submit, when it was added, and counts of how often it was handed out or
            reported. Codes are public on purpose.
          </li>
          <li>Which handoff this browser received, so a “worked / used up” report attaches to the right code.</li>
        </ul>
        <h2 className="mt-8 text-xl font-medium">What we don’t store</h2>
        <p className="mt-3 text-muted">
          No Muse password, no Meta account, no email, no payment. Don’t send those to anyone who
          asks for a code.
        </p>
        <p className="mt-8">
          <Link to="/" className="text-ink">
            Back to the pool
          </Link>
        </p>
      </article>
    </SiteFrame>
  );
}
