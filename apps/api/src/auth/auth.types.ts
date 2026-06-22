export type AppUser = {
  id: string;
  email: string;
  password_hash: string;
  role: string;
  odoo_partner_id: number | null;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
};

export type SafeUser = {
  id: string;
  email: string;
  role: string;
  odooPartnerId: number | null;
};
