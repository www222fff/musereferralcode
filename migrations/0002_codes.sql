create table if not exists codes (
  id text primary key,
  code text not null unique,
  created_at timestamptz not null default now(),
  status text not null default 'active' check (status in ('active', 'retired')),
  handouts integer not null default 0,
  worked integer not null default 0,
  used_up integer not null default 0,
  invalid integer not null default 0,
  streak_bad integer not null default 0,
  assumed_cap integer not null default 24,
  visitor_key text not null unique
);

create index if not exists codes_rotation_idx on codes (status, created_at desc);

create table if not exists claims (
  id text primary key,
  code_id text not null references codes (id),
  created_at timestamptz not null default now(),
  result text check (result is null or result in ('worked', 'used_up', 'invalid')),
  visitor_key text not null
);

create index if not exists claims_visitor_idx on claims (visitor_key, created_at desc);

create table if not exists rate_events (
  id text primary key,
  visitor_key text not null,
  kind text not null,
  created_at timestamptz not null default now()
);

create index if not exists rate_events_lookup_idx on rate_events (visitor_key, kind, created_at desc);
