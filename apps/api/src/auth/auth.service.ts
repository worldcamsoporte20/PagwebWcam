import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  OnModuleInit,
  ServiceUnavailableException,
  UnauthorizedException,
} from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import * as argon2 from "argon2";
import { randomUUID } from "crypto";
import { DatabaseService } from "../database/database.service";
import { OdooService } from "../odoo/odoo.service";
import { AppUser, SafeUser } from "./auth.types";

type RegisterData = {
  email: string;
  password: string;
  name: string;
  phone: string;
  street: string;
  street2?: string;
  city: string;
  state: string;
  country: string;
  rfc?: string;
  fiscalRegime?: string;
};

type UpdateProfileData = {
  name?: string;
  phone?: string;
  street?: string;
  street2?: string;
  city?: string;
  vat?: string;
  l10n_mx_edi_fiscal_regime?: string;
};

type ActivateOdooAccountData = {
  email: string;
  password: string;
};

type JwtPayload = {
  sub: string;
  email: string;
  role: string;
  odooPartnerId: number | null;
};

@Injectable()
export class AuthService implements OnModuleInit {
  private readonly logger = new Logger(AuthService.name);
  private schemaReady = false;

  constructor(
    private readonly db: DatabaseService,
    private readonly jwt: JwtService,
    private readonly odoo: OdooService,
  ) {}

  async onModuleInit() {
    try {
      await this.ensureSchema();
    } catch {
      this.schemaReady = false;
    }
  }

  async register(data: RegisterData) {
    await this.ensureSchema();
    const normalizedEmail = this.normalizeEmail(data.email);
    const existing = await this.findUserByEmail(normalizedEmail);

    if (existing) {
      throw new ConflictException("Este correo ya esta registrado");
    }

    const passwordHash = await argon2.hash(data.password);

    const existingOdooPartner = await this.odoo.getPartnerByEmail(normalizedEmail);
    if (existingOdooPartner?.id) {
      throw new ConflictException("Este correo ya existe en Odoo. Usa la opcion para crear solo tu contrasena.");
    }

    const odooPartnerId = await this.odoo.createPartner({
      name: data.name,
      email: normalizedEmail,
      phone: data.phone,
      street: data.street,
      street2: data.street2,
      city: data.city,
      vat: data.rfc,
      l10n_mx_edi_fiscal_regime: data.fiscalRegime,
    });

    const result = await this.db.query<AppUser>(
      `
        insert into app_users (id, email, password_hash, odoo_partner_id)
        values ($1, $2, $3, $4)
        returning *
      `,
      [randomUUID(), normalizedEmail, passwordHash, odooPartnerId],
    );

    return this.issueTokens(result.rows[0]);
  }

  async activateOdooAccount(data: ActivateOdooAccountData) {
    await this.ensureSchema();
    const normalizedEmail = this.normalizeEmail(data.email);
    const existing = await this.findUserByEmail(normalizedEmail);

    if (existing?.is_active) {
      throw new ConflictException("Este correo ya esta registrado");
    }

    const odooProfile = await this.odoo.getPartnerByEmail(normalizedEmail);
    if (!odooProfile?.id) {
      throw new BadRequestException("No encontramos una cuenta activa en Odoo con ese correo");
    }

    const passwordHash = await argon2.hash(data.password);

    if (existing && !existing.is_active) {
      const reactivated = await this.db.query<AppUser>(
        `
          update app_users
          set password_hash = $2,
              odoo_partner_id = $3,
              is_active = true,
              updated_at = now()
          where id = $1
          returning *
        `,
        [existing.id, passwordHash, odooProfile.id],
      );
      return this.issueTokens(reactivated.rows[0]);
    }

    const result = await this.db.query<AppUser>(
      `
        insert into app_users (id, email, password_hash, odoo_partner_id)
        values ($1, $2, $3, $4)
        returning *
      `,
      [randomUUID(), normalizedEmail, passwordHash, odooProfile.id],
    );

    return this.issueTokens(result.rows[0]);
  }

  async login(email: string, password: string) {
    await this.ensureSchema();
    const user = await this.findUserByEmail(this.normalizeEmail(email));

    if (!user || !user.is_active) {
      throw new UnauthorizedException("Correo o contrasena incorrectos");
    }

    const validPassword = await argon2.verify(user.password_hash, password);

    if (!validPassword) {
      throw new UnauthorizedException("Correo o contrasena incorrectos");
    }

    const syncedUser = await this.requireSyncedOdooPartner(user);
    return this.issueTokens(syncedUser);
  }

  async getMe(authorization?: string) {
    await this.ensureSchema();
    const token = this.getBearerToken(authorization);

    let payload: JwtPayload;
    try {
      payload = await this.jwt.verifyAsync<JwtPayload>(token);
    } catch {
      throw new UnauthorizedException("Tu sesion expiro o no es valida");
    }

    const user = await this.findUserById(payload.sub);

    if (!user || !user.is_active) {
      throw new UnauthorizedException("Sesion no valida");
    }

    const syncedUser = await this.requireSyncedOdooPartner(user);
    const safeUser = await this.toSafeUser(syncedUser);

    let odooProfile: Record<string, unknown> | null = null;
    if (safeUser.email) {
      try {
        odooProfile = await this.getActiveOdooProfile(syncedUser);
      } catch {
        // Odoo unavailable — return base user data only
      }
    }

    if (!odooProfile) {
      await this.deactivateUser(syncedUser.id);
      throw new UnauthorizedException("La cuenta ya no existe o esta inactiva en Odoo");
    }

    return { ...safeUser, odooProfile };
  }

  async updateMe(authorization: string | undefined, data: UpdateProfileData) {
    await this.ensureSchema();
    const token = this.getBearerToken(authorization);

    let payload: JwtPayload;
    try {
      payload = await this.jwt.verifyAsync<JwtPayload>(token);
    } catch {
      throw new UnauthorizedException("Tu sesion expiro o no es valida");
    }

    const user = await this.findUserById(payload.sub);
    if (!user || !user.is_active) {
      throw new UnauthorizedException("Sesion no valida");
    }

    const syncedUser = await this.requireSyncedOdooPartner(user);
    if (!syncedUser.odoo_partner_id) {
      throw new UnauthorizedException("La cuenta ya no existe o esta inactiva en Odoo");
    }

    const odooProfile = await this.odoo.updatePartner(syncedUser.odoo_partner_id, data);
    if (!odooProfile) {
      await this.deactivateUser(syncedUser.id);
      throw new UnauthorizedException("La cuenta ya no existe o esta inactiva en Odoo");
    }

    const safeUser = await this.toSafeUser(syncedUser);
    return { ...safeUser, odooProfile };
  }

  async requireEmployee(authorization?: string): Promise<SafeUser> {
    await this.ensureSchema();
    const token = this.getBearerToken(authorization);

    let payload: JwtPayload;
    try {
      payload = await this.jwt.verifyAsync<JwtPayload>(token);
    } catch {
      throw new UnauthorizedException("Tu sesion expiro o no es valida");
    }

    const user = await this.findUserById(payload.sub);
    if (!user || !user.is_active) {
      throw new UnauthorizedException("Sesion no valida");
    }

    const safeUser = await this.toSafeUser(user);
    if (safeUser.role !== "employee" && safeUser.role !== "admin") {
      throw new UnauthorizedException("Employee access required");
    }

    return safeUser;
  }

  private async issueTokens(user: AppUser) {
    const safeUser = await this.toSafeUser(user);
    const payload: JwtPayload = {
      sub: safeUser.id,
      email: safeUser.email,
      role: safeUser.role,
      odooPartnerId: safeUser.odooPartnerId,
    };

    return {
      accessToken: await this.jwt.signAsync(payload),
      refreshToken: await this.jwt.signAsync(payload, { expiresIn: "7d" }),
      user: safeUser,
    };
  }

  private async findUserByEmail(email: string): Promise<AppUser | null> {
    const result = await this.db.query<AppUser>("select * from app_users where email = $1 limit 1", [email]);
    return result.rows[0] ?? null;
  }

  private async findUserById(id: string): Promise<AppUser | null> {
    const result = await this.db.query<AppUser>("select * from app_users where id = $1 limit 1", [id]);
    return result.rows[0] ?? null;
  }

  private async updateUserOdooPartnerId(id: string, odooPartnerId: number): Promise<AppUser> {
    const result = await this.db.query<AppUser>(
      "update app_users set odoo_partner_id = $2, updated_at = now() where id = $1 returning *",
      [id, odooPartnerId],
    );
    return result.rows[0];
  }

  private async deactivateUser(id: string) {
    await this.db.query("update app_users set is_active = false, updated_at = now() where id = $1", [id]);
  }

  private async getActiveOdooProfile(user: AppUser) {
    try {
      if (user.odoo_partner_id) {
        return await this.odoo.getPartnerById(user.odoo_partner_id);
      }
      return await this.odoo.getPartnerByEmail(user.email);
    } catch {
      throw new ServiceUnavailableException("Odoo is not available");
    }
  }

  private async requireSyncedOdooPartner(user: AppUser): Promise<AppUser> {
    const odooProfile = await this.getActiveOdooProfile(user);

    if (!odooProfile?.id) {
      await this.deactivateUser(user.id);
      throw new UnauthorizedException("La cuenta ya no existe o esta inactiva en Odoo");
    }

    if (user.odoo_partner_id !== odooProfile.id) {
      return this.updateUserOdooPartnerId(user.id, odooProfile.id);
    }

    return user;
  }

  private normalizeEmail(email: string): string {
    const normalized = email.trim().toLowerCase();

    if (!normalized) {
      throw new BadRequestException("Email is required");
    }

    return normalized;
  }

  private getBearerToken(authorization?: string): string {
    const [scheme, token] = authorization?.split(" ") ?? [];

    if (scheme !== "Bearer" || !token) {
      throw new UnauthorizedException("Missing bearer token");
    }

    return token;
  }

  private async toSafeUser(user: AppUser): Promise<SafeUser> {
    return {
      id: user.id,
      email: user.email,
      role: await this.resolveRole(user),
      odooPartnerId: user.odoo_partner_id,
    };
  }

  private async resolveRole(user: AppUser): Promise<string> {
    if (user.role === "admin" || user.role === "employee") {
      return user.role;
    }

    try {
      return (await this.odoo.isEmployeeEmail(user.email)) ? "employee" : user.role;
    } catch {
      return user.role;
    }
  }

  private async ensureSchema() {
    if (this.schemaReady) {
      return;
    }

    try {
      await this.db.query(`
        create table if not exists app_users (
          id uuid primary key,
          email text not null unique,
          password_hash text not null,
          role text not null default 'customer',
          odoo_partner_id integer,
          is_active boolean not null default true,
          created_at timestamptz not null default now(),
          updated_at timestamptz not null default now()
        )
      `);

      await this.db.query(`
        create index if not exists app_users_odoo_partner_id_idx
        on app_users (odoo_partner_id)
      `);

      this.schemaReady = true;
    } catch {
      throw new ServiceUnavailableException("Login database is not available");
    }
  }
}
