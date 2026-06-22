create table if not exists app_users (
  id uuid primary key,
  email text not null unique,
  password_hash text not null,
  role text not null default 'customer',
  odoo_partner_id integer,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists app_users_odoo_partner_id_idx
on app_users (odoo_partner_id);
