import { BadRequestException, Injectable, NotFoundException, OnModuleInit } from "@nestjs/common";
import { randomUUID } from "crypto";
import { DatabaseService } from "../database/database.service";
import { OdooProduct, OdooService } from "../odoo/odoo.service";

type LocalQuotationStatus = "draft" | "sent" | "sale" | "cancel";

type QuotationLineInput = {
  productId: number;
  qty: number;
};

export type CreateLocalQuotationInput = {
  partnerId: number;
  paymentTerm?: string;
  paymentMethod?: string;
  quotationTemplate?: string;
  fiscalUse?: string;
  dueDate?: string;
  notes?: string;
  items: QuotationLineInput[];
};

type LocalQuotationRow = {
  id: string;
  number: string;
  status: LocalQuotationStatus;
  partner_id: number;
  partner_name: string;
  partner_email: string | null;
  partner_phone: string | null;
  pricelist_id: number | null;
  pricelist_name: string | null;
  payment_term: string | null;
  payment_method: string | null;
  quotation_template: string | null;
  fiscal_use: string | null;
  due_date: string | null;
  notes: string | null;
  amount_untaxed: string;
  amount_tax: string;
  amount_total: string;
  odoo_order_id: number | null;
  odoo_order_name: string | null;
  created_by_email: string;
  created_at: string;
  updated_at: string;
  sent_at: string | null;
  confirmed_at: string | null;
};

type LocalQuotationLineRow = {
  id: string;
  quotation_id: string;
  product_id: number;
  product_name: string;
  sku: string;
  qty: string;
  price_unit: string;
  amount_untaxed: string;
  tax_amount: string;
  amount_total: string;
};

@Injectable()
export class SalesService implements OnModuleInit {
  private schemaReady = false;

  constructor(
    private readonly db: DatabaseService,
    private readonly odoo: OdooService,
  ) {}

  async onModuleInit() {
    try {
      await this.ensureSchema();
    } catch {
      this.schemaReady = false;
    }
  }

  async listLocalQuotations() {
    await this.ensureSchema();
    const result = await this.db.query<LocalQuotationRow>(`
      select *
      from sales_quotations
      order by created_at desc
      limit 120
    `);

    const ids = result.rows.map((row) => row.id);
    const lines = ids.length
      ? await this.db.query<LocalQuotationLineRow>(
          `
            select *
            from sales_quotation_lines
            where quotation_id = any($1::uuid[])
            order by created_at asc
          `,
          [ids],
        )
      : { rows: [] as LocalQuotationLineRow[] };

    return result.rows.map((row) => this.toDto(row, lines.rows.filter((line) => line.quotation_id === row.id)));
  }

  async createLocalQuotation(input: CreateLocalQuotationInput, createdByEmail: string) {
    await this.ensureSchema();
    const validItems = input.items.filter((item) => item.productId > 0 && item.qty > 0);
    if (!input.partnerId || validItems.length === 0) {
      throw new BadRequestException("Seleccione cliente y productos para crear la cotizacion");
    }

    const [customer, products, pricePreview] = await Promise.all([
      this.odoo.getCustomerById(input.partnerId),
      this.odoo.getProducts(),
      this.odoo.getPricePreview({ partnerId: input.partnerId, items: validItems }),
    ]);

    if (!customer) {
      throw new BadRequestException("El cliente no existe en Odoo");
    }

    const productMap = new Map<number, OdooProduct>();
    products.forEach((product) => productMap.set(product.variantId, product));
    const pricedMap = new Map(pricePreview.items.map((item) => [item.productId, item.price]));
    const taxRate = pricePreview.amountUntaxed > 0 ? pricePreview.amountTax / pricePreview.amountUntaxed : 0.16;

    const id = randomUUID();
    const number = await this.nextNumber();
    const lines = validItems.map((item) => {
      const product = productMap.get(item.productId);
      if (!product) {
        throw new BadRequestException(`Producto ${item.productId} no existe en Odoo`);
      }
      const priceUnit = pricedMap.get(item.productId) ?? product.price;
      const amountUntaxed = priceUnit * item.qty;
      const taxAmount = amountUntaxed * taxRate;
      return {
        id: randomUUID(),
        product,
        qty: item.qty,
        priceUnit,
        amountUntaxed,
        taxAmount,
        amountTotal: amountUntaxed + taxAmount,
      };
    });

    const amountUntaxed = pricePreview.amountUntaxed || lines.reduce((sum, line) => sum + line.amountUntaxed, 0);
    const amountTax = pricePreview.amountTax || lines.reduce((sum, line) => sum + line.taxAmount, 0);
    const amountTotal = pricePreview.amountTotal || amountUntaxed + amountTax;

    await this.db.query(
      `
        insert into sales_quotations (
          id, number, status, partner_id, partner_name, partner_email, partner_phone,
          pricelist_id, pricelist_name, payment_term, payment_method, quotation_template, fiscal_use, due_date, notes,
          amount_untaxed, amount_tax, amount_total, created_by_email
        )
        values ($1,$2,'draft',$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18)
      `,
      [
        id,
        number,
        input.partnerId,
        customer.name,
        customer.email || null,
        customer.phone || null,
        pricePreview.pricelistId ?? customer.pricelistId ?? null,
        pricePreview.pricelistName ?? customer.pricelistName ?? null,
        input.paymentTerm || "Inmediato",
        input.paymentMethod || "Efectivo",
        input.quotationTemplate || "Estandar Worldcam",
        input.fiscalUse || "Gastos en general",
        input.dueDate || null,
        input.notes || null,
        amountUntaxed,
        amountTax,
        amountTotal,
        createdByEmail,
      ],
    );

    for (const line of lines) {
      await this.db.query(
        `
          insert into sales_quotation_lines (
            id, quotation_id, product_id, product_name, sku, qty, price_unit,
            amount_untaxed, tax_amount, amount_total
          )
          values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
        `,
        [
          line.id,
          id,
          line.product.variantId,
          line.product.name,
          line.product.sku || line.product.clave,
          line.qty,
          line.priceUnit,
          line.amountUntaxed,
          line.taxAmount,
          line.amountTotal,
        ],
      );
    }

    return this.getLocalQuotation(id);
  }

  async updateLocalQuotation(id: string, input: CreateLocalQuotationInput) {
    await this.ensureSchema();
    const existing = await this.getLocalQuotation(id);
    if (existing.status === "sale") {
      throw new BadRequestException("No se puede editar una orden de venta confirmada");
    }

    const validItems = input.items.filter((item) => item.productId > 0 && item.qty > 0);
    if (!input.partnerId || validItems.length === 0) {
      throw new BadRequestException("Seleccione cliente y productos para actualizar la cotizacion");
    }

    const [customer, products, pricePreview] = await Promise.all([
      this.odoo.getCustomerById(input.partnerId),
      this.odoo.getProducts(),
      this.odoo.getPricePreview({ partnerId: input.partnerId, items: validItems }),
    ]);

    if (!customer) {
      throw new BadRequestException("El cliente no existe en Odoo");
    }

    const productMap = new Map<number, OdooProduct>();
    products.forEach((product) => productMap.set(product.variantId, product));
    const pricedMap = new Map(pricePreview.items.map((item) => [item.productId, item.price]));
    const taxRate = pricePreview.amountUntaxed > 0 ? pricePreview.amountTax / pricePreview.amountUntaxed : 0.16;

    const lines = validItems.map((item) => {
      const product = productMap.get(item.productId);
      if (!product) {
        throw new BadRequestException(`Producto ${item.productId} no existe en Odoo`);
      }
      const priceUnit = pricedMap.get(item.productId) ?? product.price;
      const amountUntaxed = priceUnit * item.qty;
      const taxAmount = amountUntaxed * taxRate;
      return {
        id: randomUUID(),
        product,
        qty: item.qty,
        priceUnit,
        amountUntaxed,
        taxAmount,
        amountTotal: amountUntaxed + taxAmount,
      };
    });

    const amountUntaxed = pricePreview.amountUntaxed || lines.reduce((sum, line) => sum + line.amountUntaxed, 0);
    const amountTax = pricePreview.amountTax || lines.reduce((sum, line) => sum + line.taxAmount, 0);
    const amountTotal = pricePreview.amountTotal || amountUntaxed + amountTax;

    await this.db.query(
      `
        update sales_quotations
        set partner_id = $2,
            partner_name = $3,
            partner_email = $4,
            partner_phone = $5,
            pricelist_id = $6,
            pricelist_name = $7,
            payment_term = $8,
            payment_method = $9,
            quotation_template = $10,
            fiscal_use = $11,
            due_date = $12,
            notes = $13,
            amount_untaxed = $14,
            amount_tax = $15,
            amount_total = $16,
            updated_at = now()
        where id = $1
      `,
      [
        id,
        input.partnerId,
        customer.name,
        customer.email || null,
        customer.phone || null,
        pricePreview.pricelistId ?? customer.pricelistId ?? null,
        pricePreview.pricelistName ?? customer.pricelistName ?? null,
        input.paymentTerm || "Inmediato",
        input.paymentMethod || "Efectivo",
        input.quotationTemplate || "Estandar Worldcam",
        input.fiscalUse || "Gastos en general",
        input.dueDate || null,
        input.notes || null,
        amountUntaxed,
        amountTax,
        amountTotal,
      ],
    );

    await this.db.query("delete from sales_quotation_lines where quotation_id = $1", [id]);

    for (const line of lines) {
      await this.db.query(
        `
          insert into sales_quotation_lines (
            id, quotation_id, product_id, product_name, sku, qty, price_unit,
            amount_untaxed, tax_amount, amount_total
          )
          values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
        `,
        [
          line.id,
          id,
          line.product.variantId,
          line.product.name,
          line.product.sku || line.product.clave,
          line.qty,
          line.priceUnit,
          line.amountUntaxed,
          line.taxAmount,
          line.amountTotal,
        ],
      );
    }

    return this.getLocalQuotation(id);
  }

  async markSent(id: string) {
    await this.ensureSchema();
    const result = await this.db.query<LocalQuotationRow>(
      `
        update sales_quotations
        set status = 'sent', sent_at = coalesce(sent_at, now()), updated_at = now()
        where id = $1 and status = 'draft'
        returning *
      `,
      [id],
    );
    if (!result.rows[0]) {
      return this.getLocalQuotation(id);
    }
    return this.getLocalQuotation(id);
  }

  async confirmInOdoo(id: string) {
    const quotation = await this.getLocalQuotation(id);
    if (quotation.status === "sale") {
      return quotation;
    }

    const result = await this.odoo.createAndConfirmQuotation({
      partnerId: quotation.partnerId,
      dueDate: quotation.dueDate ?? undefined,
      items: quotation.lines.map((line) => ({ productId: line.productId, qty: line.qty })),
    });

    await this.db.query(
      `
        update sales_quotations
        set status = 'sale', odoo_order_id = $2, odoo_order_name = $3, confirmed_at = now(), updated_at = now()
        where id = $1
      `,
      [id, result.id, result.name],
    );

    return this.getLocalQuotation(id);
  }

  private async getLocalQuotation(id: string) {
    const quotation = await this.db.query<LocalQuotationRow>("select * from sales_quotations where id = $1", [id]);
    if (!quotation.rows[0]) {
      throw new NotFoundException("Cotizacion no encontrada");
    }
    const lines = await this.db.query<LocalQuotationLineRow>(
      "select * from sales_quotation_lines where quotation_id = $1 order by created_at asc",
      [id],
    );
    return this.toDto(quotation.rows[0], lines.rows);
  }

  private toDto(row: LocalQuotationRow, lines: LocalQuotationLineRow[]) {
    return {
      id: row.id,
      number: row.number,
      status: row.status,
      partnerId: row.partner_id,
      partnerName: row.partner_name,
      partnerEmail: row.partner_email,
      partnerPhone: row.partner_phone,
      pricelistId: row.pricelist_id,
      pricelistName: row.pricelist_name,
      paymentTerm: row.payment_term,
      paymentMethod: row.payment_method,
      quotationTemplate: row.quotation_template,
      fiscalUse: row.fiscal_use,
      dueDate: row.due_date,
      notes: row.notes,
      amountUntaxed: Number(row.amount_untaxed),
      amountTax: Number(row.amount_tax),
      amountTotal: Number(row.amount_total),
      odooOrderId: row.odoo_order_id,
      odooOrderName: row.odoo_order_name,
      createdByEmail: row.created_by_email,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      sentAt: row.sent_at,
      confirmedAt: row.confirmed_at,
      lines: lines.map((line) => ({
        id: line.id,
        productId: line.product_id,
        productName: line.product_name,
        sku: line.sku,
        qty: Number(line.qty),
        priceUnit: Number(line.price_unit),
        amountUntaxed: Number(line.amount_untaxed),
        taxAmount: Number(line.tax_amount),
        amountTotal: Number(line.amount_total),
      })),
    };
  }

  private async nextNumber() {
    const result = await this.db.query<{ nextval: string }>("select nextval('sales_quotation_number_seq')::text");
    return `WC${String(result.rows[0]?.nextval ?? "1").padStart(5, "0")}`;
  }

  private async ensureSchema() {
    if (this.schemaReady) return;

    await this.db.query("create sequence if not exists sales_quotation_number_seq start 1");
    await this.db.query(`
      create table if not exists sales_quotations (
        id uuid primary key,
        number text not null unique,
        status text not null default 'draft',
        partner_id integer not null,
        partner_name text not null,
        partner_email text,
        partner_phone text,
        pricelist_id integer,
        pricelist_name text,
        payment_term text,
        payment_method text,
        quotation_template text,
        fiscal_use text,
        due_date date,
        notes text,
        amount_untaxed numeric(14,2) not null default 0,
        amount_tax numeric(14,2) not null default 0,
        amount_total numeric(14,2) not null default 0,
        odoo_order_id integer,
        odoo_order_name text,
        created_by_email text not null,
        created_at timestamptz not null default now(),
        updated_at timestamptz not null default now(),
        sent_at timestamptz,
        confirmed_at timestamptz
      )
    `);
    await this.db.query("alter table sales_quotations add column if not exists payment_method text");
    await this.db.query("alter table sales_quotations add column if not exists quotation_template text");
    await this.db.query("alter table sales_quotations add column if not exists due_date date");
    await this.db.query(`
      create table if not exists sales_quotation_lines (
        id uuid primary key,
        quotation_id uuid not null references sales_quotations(id) on delete cascade,
        product_id integer not null,
        product_name text not null,
        sku text not null,
        qty numeric(14,2) not null,
        price_unit numeric(14,2) not null,
        amount_untaxed numeric(14,2) not null,
        tax_amount numeric(14,2) not null,
        amount_total numeric(14,2) not null,
        created_at timestamptz not null default now()
      )
    `);
    await this.db.query("create index if not exists sales_quotations_created_at_idx on sales_quotations(created_at desc)");
    await this.db.query("create index if not exists sales_quotation_lines_quotation_id_idx on sales_quotation_lines(quotation_id)");
    this.schemaReady = true;
  }
}
