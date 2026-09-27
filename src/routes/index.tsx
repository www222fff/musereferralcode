import { createFileRoute } from "@tanstack/react-router";
import { SiteFrame } from "@/components/site-frame";
import { PoolHome } from "@/components/pool-home";
import { getPool } from "@/lib/pool.functions";

export const Route = createFileRoute("/")({
  loader: () => getPool(),
  head: () => ({
    meta: [
      { title: "Relay — Muse codes, fairly shared" },
      {
        name: "description",
        content:
          "Take a Meta Muse referral code from a shared pool and leave yours for the next person. Codes rotate so they are not used up in one post.",
      },
    ],
  }),
  component: Home,
});

function Home() {
  const initial = Route.useLoaderData();
  return (
    <SiteFrame>
      <PoolHome initial={initial} />
    </SiteFrame>
  );
}
