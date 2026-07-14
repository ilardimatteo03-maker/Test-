-- =====================================================================
-- Fidélo by ASM — Schéma initial (Supabase / PostgreSQL)
-- Tables : merchants, clients, activity  +  RLS  +  trigger d'inscription
-- =====================================================================

-- ---------- Tables ----------

create table if not exists public.merchants (
  id                     uuid primary key references auth.users(id) on delete cascade,
  email                  text not null,
  shop_name              text not null default 'Mon commerce',
  owner_name             text not null default '',
  category               text not null default 'autre',
  plan                   text not null default 'free' check (plan in ('free','pro')),
  plan_status            text,                       -- statut Stripe (active, past_due…)
  stamps_goal            int  not null default 10 check (stamps_goal between 3 and 20),
  reward_label           text not null default 'Une récompense offerte',
  onboarded              boolean not null default false,
  stripe_customer_id     text,
  stripe_subscription_id text,
  created_at             timestamptz not null default now()
);

create table if not exists public.clients (
  id             uuid primary key default gen_random_uuid(),
  merchant_id    uuid not null references public.merchants(id) on delete cascade,
  name           text not null,
  phone          text not null default '',
  stamps         int  not null default 0,
  rewards_earned int  not null default 0,
  created_at     timestamptz not null default now(),
  last_visit     timestamptz
);
create index if not exists clients_merchant_idx on public.clients(merchant_id);

create table if not exists public.activity (
  id          uuid primary key default gen_random_uuid(),
  merchant_id uuid not null references public.merchants(id) on delete cascade,
  client_id   uuid references public.clients(id) on delete cascade,
  client_name text not null,
  type        text not null check (type in ('stamp','reward')),
  created_at  timestamptz not null default now()
);
create index if not exists activity_merchant_idx on public.activity(merchant_id, created_at desc);

-- ---------- Row Level Security ----------
-- Chaque commerçant n'accède qu'à SES données (merchant_id = auth.uid()).

alter table public.merchants enable row level security;
alter table public.clients   enable row level security;
alter table public.activity  enable row level security;

-- merchants : lecture / écriture de sa propre fiche
create policy "merchant reads own row"   on public.merchants for select using (auth.uid() = id);
create policy "merchant updates own row"  on public.merchants for update using (auth.uid() = id);
create policy "merchant inserts own row"  on public.merchants for insert with check (auth.uid() = id);

-- clients : CRUD sur ses propres clients
create policy "merchant reads clients"    on public.clients for select using (auth.uid() = merchant_id);
create policy "merchant inserts clients"  on public.clients for insert with check (auth.uid() = merchant_id);
create policy "merchant updates clients"  on public.clients for update using (auth.uid() = merchant_id);
create policy "merchant deletes clients"  on public.clients for delete using (auth.uid() = merchant_id);

-- activity : lecture / insertion de sa propre activité
create policy "merchant reads activity"   on public.activity for select using (auth.uid() = merchant_id);
create policy "merchant inserts activity" on public.activity for insert with check (auth.uid() = merchant_id);

-- ---------- Création automatique du commerçant à l'inscription ----------
-- Quand un utilisateur s'inscrit (auth.users), on crée sa fiche merchant.

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.merchants (id, email, shop_name, owner_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'shop_name', 'Mon commerce'),
    coalesce(new.raw_user_meta_data->>'owner_name', '')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------- Ajout d'un tampon (atomique, côté serveur) ----------
-- Applique la règle « X tampons = 1 récompense » en une transaction et
-- journalise l'activité. Respecte la propriété du client via RLS interne.

create or replace function public.add_stamp(p_client_id uuid)
returns table (id uuid, stamps int, rewards_earned int, rewarded boolean)
language plpgsql
security definer set search_path = public
as $$
declare
  v_merchant uuid;
  v_goal int;
  v_client public.clients%rowtype;
  v_rewarded boolean := false;
begin
  -- Le commerçant appelant
  v_merchant := auth.uid();

  select * into v_client from public.clients c
    where c.id = p_client_id and c.merchant_id = v_merchant
    for update;
  if not found then
    raise exception 'Client introuvable ou non autorisé';
  end if;

  select stamps_goal into v_goal from public.merchants where merchants.id = v_merchant;

  update public.clients
    set stamps = v_client.stamps + 1,
        last_visit = now()
    where clients.id = p_client_id;

  insert into public.activity (merchant_id, client_id, client_name, type)
    values (v_merchant, p_client_id, v_client.name, 'stamp');

  if v_client.stamps + 1 >= v_goal then
    update public.clients
      set stamps = 0, rewards_earned = v_client.rewards_earned + 1
      where clients.id = p_client_id;
    insert into public.activity (merchant_id, client_id, client_name, type)
      values (v_merchant, p_client_id, v_client.name, 'reward');
    v_rewarded := true;
  end if;

  return query
    select c.id, c.stamps, c.rewards_earned, v_rewarded
    from public.clients c where c.id = p_client_id;
end;
$$;

-- ---------- Carte publique (client non authentifié) ----------
-- Expose UNIQUEMENT les champs nécessaires à l'affichage de la carte,
-- sans ouvrir la table clients en lecture publique.

create or replace function public.get_public_card(p_client_id uuid)
returns table (
  client_name  text,
  stamps       int,
  goal         int,
  shop_name    text,
  reward_label text
)
language sql
security definer set search_path = public
as $$
  select c.name, c.stamps, m.stamps_goal, m.shop_name, m.reward_label
  from public.clients c
  join public.merchants m on m.id = c.merchant_id
  where c.id = p_client_id;
$$;

grant execute on function public.get_public_card(uuid) to anon, authenticated;
grant execute on function public.add_stamp(uuid) to authenticated;
