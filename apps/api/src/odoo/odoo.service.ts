import { Injectable, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

type OdooMany2One = false | [number, string];

type OdooProductRecord = {
  id: number;
  default_code?: string | false;
  sku?: string | false;
  barcode?: string | false;
  name: string;
  list_price?: number;
  qty_available?: number;
  free_qty?: number;
  virtual_available?: number;
  incoming_qty?: number;
  outgoing_qty?: number;
  categ_id?: OdooMany2One;
  product_variant_id?: OdooMany2One;
  image_128?: string | false;
  image_512?: string | false;
  description?: string | false;
  description_sale?: string | false;
  product_variant_count?: number;
  type?: string;
};

type JsonRpcError = {
  code: number;
  message: string;
  data?: unknown;
};

type JsonRpcResponse<T> = {
  result?: T;
  error?: JsonRpcError;
};

export type OdooProduct = {
  id: number;
  variantId: number;
  sku: string;
  clave: string;
  barcode?: string;
  name: string;
  stock: number;
  price: number;
  category: string;
  brand: string;
  image?: string;
  description?: string;
  internalNotesHtml?: string;
};

type OdooStockQuant = {
  product_id: OdooMany2One;
  quantity?: number;
  reserved_quantity?: number;
  available_quantity?: number;
  location_id?: OdooMany2One;
};

export type OdooCustomer = {
  id: number;
  name: string;
  email: string;
  phone: string;
  street?: string;
  street2?: string;
  city?: string;
  state?: string;
  country?: string;
  vat?: string;
  fiscalRegime?: string;
  pricelistId?: number;
  pricelistName?: string;
};

export type OdooPricelist = {
  id: number;
  name: string;
  currency: string;
};

export type OdooQuotationTemplate = {
  id: number;
  name: string;
  lines: Array<{
    id: number;
    productId: number;
    name: string;
    qty: number;
    priceUnit: number;
  }>;
};

export type QuickSaleItem = {
  productId: number;
  qty: number;
};

export type QuickSaleInput = {
  partnerId: number;
  pricelistId?: number;
  paymentMethod: "cash" | "card" | "account";
  items: QuickSaleItem[];
};

export type QuickSaleResult = {
  success: boolean;
  saleOrderId?: number;
  saleOrderName?: string;
  partnerName?: string;
  amountUntaxed?: number;
  amountTax?: number;
  amountTotal?: number;
  posOrderId?: number;
  invoiceId?: number;
  error?: string;
};

export type PricePreviewInput = {
  partnerId: number;
  items: QuickSaleItem[];
};

export type PricePreviewResult = {
  pricelistId?: number;
  pricelistName?: string;
  items: Array<{
    productId: number;
    price: number;
  }>;
  amountUntaxed: number;
  amountTax: number;
  amountTotal: number;
};

export type OdooConnectionStatus = {
  connected: boolean;
  message: string;
  uid?: number;
  productCount?: number;
};

export type OdooSaleOrder = {
  id: number;
  name: string;
  partner_id: OdooMany2One;
  amount_total: number;
  amount_tax: number;
  amount_untaxed: number;
  state: string;
  invoice_status: string;
  date_order: string;
  lines: OdooOrderLine[];
};

export type CreateQuotationInput = {
  partnerId: number;
  dueDate?: string;
  items: QuickSaleItem[];
};

export type OdooOrderLine = {
  id: number;
  product_id: OdooMany2One;
  product_uom_qty: number;
  price_unit: number;
  price_subtotal: number;
  name: string;
};

export type OdooPartnerData = {
  name: string;
  email: string;
  phone?: string;
  street?: string;
  street2?: string;
  city?: string;
  state_id?: number;
  country_id?: number;
  vat?: string;
  l10n_mx_edi_fiscal_regime?: string;
};

export type OdooPartnerProfile = {
  id: number;
  active?: boolean;
  name?: string;
  email?: string | false;
  phone?: string | false;
  street?: string | false;
  street2?: string | false;
  city?: string | false;
  state_id?: OdooMany2One;
  country_id?: OdooMany2One;
  vat?: string | false;
  l10n_mx_edi_fiscal_regime?: string | false;
};

export type OdooPartnerUpdate = Partial<Pick<
  OdooPartnerData,
  "name" | "phone" | "street" | "street2" | "city" | "vat" | "l10n_mx_edi_fiscal_regime"
>>;

@Injectable()
export class OdooService {
  private uid: number | null = null;

  constructor(private readonly config: ConfigService) {}

  async getConnectionStatus(): Promise<OdooConnectionStatus> {
    try {
      const uid = await this.authenticate();
      const productCount = await this.executeKw<number>(
        "product.template",
        "search_count",
        [[]],
      );

      return {
        connected: true,
        message: "Odoo authentication succeeded",
        uid,
        productCount,
      };
    } catch (error) {
      return {
        connected: false,
        message: error instanceof Error ? error.message : "Odoo authentication failed",
      };
    }
  }

  async createPartner(data: OdooPartnerData): Promise<number> {
    const vals: Record<string, unknown> = {
      name: data.name,
      email: data.email,
      customer_rank: 1,
    };

    if (data.phone) vals["phone"] = data.phone;
    if (data.street) vals["street"] = data.street;
    if (data.street2) vals["street2"] = data.street2;
    if (data.city) vals["city"] = data.city;
    if (data.state_id) vals["state_id"] = data.state_id;
    if (data.country_id) vals["country_id"] = data.country_id;
    if (data.vat) vals["vat"] = data.vat;
    if (data.l10n_mx_edi_fiscal_regime) vals["l10n_mx_edi_fiscal_regime"] = data.l10n_mx_edi_fiscal_regime;

    const result = await this.executeKw<number | number[]>("res.partner", "create", [vals]);
    return Array.isArray(result) ? result[0] : result;
  }

  async getPartnerByEmail(email: string): Promise<OdooPartnerProfile | null> {
    const records = await this.executeKw<OdooPartnerProfile[]>(
      "res.partner",
      "search_read",
      [[["active", "=", true], ["email", "=", email]]],
      {
        fields: ["id", "active", "name", "email", "phone", "street", "street2", "city", "state_id", "country_id", "vat", "l10n_mx_edi_fiscal_regime"],
        limit: 1,
      },
    );
    return records[0] ?? null;
  }

  async getPartnerById(partnerId: number): Promise<OdooPartnerProfile | null> {
    const records = await this.executeKw<OdooPartnerProfile[]>(
      "res.partner",
      "search_read",
      [[["active", "=", true], ["id", "=", partnerId]]],
      {
        fields: ["id", "active", "name", "email", "phone", "street", "street2", "city", "state_id", "country_id", "vat", "l10n_mx_edi_fiscal_regime"],
        limit: 1,
      },
    );
    return records[0] ?? null;
  }

  async updatePartner(partnerId: number, data: OdooPartnerUpdate): Promise<OdooPartnerProfile | null> {
    const vals: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(data)) {
      if (typeof value === "string") {
        vals[key] = value.trim();
      }
    }

    if (Object.keys(vals).length > 0) {
      await this.executeKw<boolean>("res.partner", "write", [[partnerId], vals]);
    }

    return this.getPartnerById(partnerId);
  }

  async isEmployeeEmail(email: string): Promise<boolean> {
    const normalized = email.trim().toLowerCase();
    if (!normalized) return false;

    try {
      const employees = await this.executeKw<Array<{ id: number }>>(
        "hr.employee",
        "search_read",
        [[["work_email", "ilike", normalized]]],
        { fields: ["id"], limit: 1 },
      );

      if (employees.length > 0) return true;
    } catch {
      // Some Odoo users may not have HR read rights; res.users fallback still detects internal staff.
    }

    const users = await this.executeKw<Array<{ id: number; share?: boolean; groups_id?: number[] }>>(
      "res.users",
      "search_read",
      [[["login", "ilike", normalized], ["share", "=", false]]],
      { fields: ["id", "share", "groups_id"], limit: 1 },
    );

    return users.length > 0;
  }

  async getSalesOrders(states: string[] = ["sale", "done"], includeInvoiced = false, limit = 50): Promise<OdooSaleOrder[]> {
    const domain: unknown[] = [["state", "in", states]];
    if (!includeInvoiced) {
      domain.push(["invoice_status", "!=", "invoiced"]);
    }
    const orders = await this.executeKw<Array<Record<string, unknown>>>(
      "sale.order",
      "search_read",
      [domain],
      {
        fields: ["id", "name", "partner_id", "amount_total", "amount_tax", "amount_untaxed", "state", "invoice_status", "date_order", "order_line"],
        order: "date_order desc",
        limit,
      },
    );

    const result: OdooSaleOrder[] = [];
    for (const order of orders) {
      const lineIds = order["order_line"] as number[];
      let lines: OdooOrderLine[] = [];

      if (lineIds.length > 0) {
        const rawLines = await this.executeKw<Array<Record<string, unknown>>>(
          "sale.order.line",
          "search_read",
          [[["order_id", "=", order["id"]]]],
          { fields: ["id", "product_id", "product_uom_qty", "price_unit", "price_subtotal", "name"] },
        );
        lines = rawLines.map((l) => ({
          id: l["id"] as number,
          product_id: l["product_id"] as OdooMany2One,
          product_uom_qty: l["product_uom_qty"] as number,
          price_unit: l["price_unit"] as number,
          price_subtotal: l["price_subtotal"] as number,
          name: l["name"] as string,
        }));
      }

      result.push({
        id: order["id"] as number,
        name: order["name"] as string,
        partner_id: order["partner_id"] as OdooMany2One,
        amount_total: order["amount_total"] as number,
        amount_tax: order["amount_tax"] as number,
        amount_untaxed: order["amount_untaxed"] as number,
        state: order["state"] as string,
        invoice_status: order["invoice_status"] as string,
        date_order: order["date_order"] as string,
        lines,
      });
    }

    return result;
  }

  async createQuotation(input: CreateQuotationInput): Promise<{ id: number; name: string; amountTotal: number }> {
    const validItems = input.items.filter((item) => item.productId > 0 && item.qty > 0);
    if (!input.partnerId || validItems.length === 0) {
      throw new Error("Seleccione cliente y productos para crear la cotizacion");
    }

    const orderLines = validItems.map((item) => [
      0,
      0,
      {
        product_id: item.productId,
        product_uom_qty: item.qty,
      },
    ]);

    const saleOrderValues: Record<string, unknown> = {
      partner_id: input.partnerId,
      pricelist_id: (await this.getPartnerPricelist(input.partnerId))?.id,
      order_line: orderLines,
    };

    if (input.dueDate) {
      saleOrderValues["validity_date"] = input.dueDate;
    }

    const saleOrderId = await this.executeKw<number>(
      "sale.order",
      "create",
      [saleOrderValues],
    );

    const summary = await this.readSaleOrderSummary(saleOrderId);
    return { id: saleOrderId, name: summary.name, amountTotal: summary.amountTotal };
  }

  async createAndConfirmQuotation(input: CreateQuotationInput): Promise<{ id: number; name: string; amountTotal: number }> {
    const quotation = await this.createQuotation(input);
    await this.executeKw<unknown>("sale.order", "action_confirm", [[quotation.id]], {});
    const summary = await this.readSaleOrderSummary(quotation.id);
    return { id: quotation.id, name: summary.name, amountTotal: summary.amountTotal };
  }

  async processOrderPayment(
    orderId: number,
    paymentMethod: "cash" | "card",
    amount: number,
    orderName: string,
  ): Promise<{ success: boolean; posOrderId?: number; invoiceId?: number; error?: string }> {
    // Try POS flow first (matches what Odoo's own POS does when you press "Validar")
    try {
      const posResult = await this.processViaPosSession(orderId, paymentMethod, amount, orderName);
      return posResult;
    } catch (posError) {
      const posMsg = posError instanceof Error ? posError.message : String(posError);
      // If no open POS session, fall back to accounting flow
      if (posMsg.includes("No hay sesión")) {
        return this.processViaAccounting(orderId, paymentMethod, amount, orderName);
      }
      return { success: false, error: posMsg };
    }
  }

  async getCustomers(search = ""): Promise<OdooCustomer[]> {
    const domain: unknown[] = [["active", "=", true]];
    const term = search.trim();

    if (term) {
      domain.push("|", "|", ["name", "ilike", term], ["email", "ilike", term], ["phone", "ilike", term]);
    }

    const records = await this.executeKw<Array<Record<string, unknown>>>(
      "res.partner",
      "search_read",
      [domain],
      {
        fields: ["id", "name", "email", "phone", "street", "street2", "city", "state_id", "country_id", "vat", "l10n_mx_edi_fiscal_regime", "property_product_pricelist"],
        order: "name asc",
        limit: 40,
      },
    );

    return records.map((record) => ({
      id: record["id"] as number,
      name: String(record["name"] ?? ""),
      email: this.cleanOdooValue(record["email"] as string | false),
      phone: this.cleanOdooValue(record["phone"] as string | false),
      street: this.cleanOdooValue(record["street"] as string | false),
      street2: this.cleanOdooValue(record["street2"] as string | false),
      city: this.cleanOdooValue(record["city"] as string | false),
      state: Array.isArray(record["state_id"]) ? String(record["state_id"][1]) : "",
      country: Array.isArray(record["country_id"]) ? String(record["country_id"][1]) : "",
      vat: this.cleanOdooValue(record["vat"] as string | false),
      fiscalRegime: this.cleanOdooValue(record["l10n_mx_edi_fiscal_regime"] as string | false),
      pricelistId: this.pickPartnerPricelist(record)?.id,
      pricelistName: this.pickPartnerPricelist(record)?.name,
    }));
  }

  async getCustomerById(partnerId: number): Promise<OdooCustomer | null> {
    const records = await this.executeKw<Array<Record<string, unknown>>>(
      "res.partner",
      "read",
      [[partnerId]],
      { fields: ["id", "name", "email", "phone", "street", "street2", "city", "state_id", "country_id", "vat", "l10n_mx_edi_fiscal_regime", "property_product_pricelist"] },
    );
    const record = records[0];
    if (!record) return null;
    return {
      id: record["id"] as number,
      name: String(record["name"] ?? ""),
      email: this.cleanOdooValue(record["email"] as string | false),
      phone: this.cleanOdooValue(record["phone"] as string | false),
      street: this.cleanOdooValue(record["street"] as string | false),
      street2: this.cleanOdooValue(record["street2"] as string | false),
      city: this.cleanOdooValue(record["city"] as string | false),
      state: Array.isArray(record["state_id"]) ? String(record["state_id"][1]) : "",
      country: Array.isArray(record["country_id"]) ? String(record["country_id"][1]) : "",
      vat: this.cleanOdooValue(record["vat"] as string | false),
      fiscalRegime: this.cleanOdooValue(record["l10n_mx_edi_fiscal_regime"] as string | false),
      pricelistId: this.pickPartnerPricelist(record)?.id,
      pricelistName: this.pickPartnerPricelist(record)?.name,
    };
  }

  async getPricelists(): Promise<OdooPricelist[]> {
    const records = await this.executeKw<Array<Record<string, unknown>>>(
      "product.pricelist",
      "search_read",
      [[["active", "=", true]]],
      {
        fields: ["id", "name", "currency_id"],
        order: "name asc",
      },
    );

    return records.map((record) => ({
      id: record["id"] as number,
      name: String(record["name"] ?? ""),
      currency: Array.isArray(record["currency_id"]) ? String(record["currency_id"][1]) : "",
    }));
  }

  async getQuotationTemplates(): Promise<OdooQuotationTemplate[]> {
    const records = await this.executeKw<Array<Record<string, unknown>>>(
      "sale.order.template",
      "search_read",
      [[["active", "=", true]]],
      {
        fields: ["id", "name", "sale_order_template_line_ids"],
        order: "name asc",
      },
    );

    const templateLineIds = records.flatMap((record) =>
      Array.isArray(record["sale_order_template_line_ids"]) ? (record["sale_order_template_line_ids"] as number[]) : [],
    );
    const lineById = new Map<number, OdooQuotationTemplate["lines"][number]>();

    if (templateLineIds.length > 0) {
      const lines = await this.executeKw<Array<Record<string, unknown>>>(
        "sale.order.template.line",
        "read",
        [templateLineIds],
        { fields: ["id", "product_id", "product_uom_qty", "name", "display_type"] },
      );
      const productIds = lines
        .map((line) => line["product_id"] as OdooMany2One)
        .filter((product): product is [number, string] => Array.isArray(product))
        .map((product) => product[0]);
      const productPriceById = new Map<number, number>();

      if (productIds.length > 0) {
        const products = await this.executeKw<Array<Record<string, unknown>>>(
          "product.product",
          "read",
          [Array.from(new Set(productIds))],
          { fields: ["id", "lst_price", "list_price", "standard_price", "product_tmpl_id"] },
        );

        for (const product of products) {
          const price = Number(product["lst_price"] ?? product["list_price"] ?? product["standard_price"] ?? 0);
          productPriceById.set(product["id"] as number, Number.isFinite(price) ? price : 0);
        }
      }

      for (const line of lines) {
        const product = line["product_id"] as OdooMany2One;
        const displayType = line["display_type"] as string | false | undefined;
        if (!Array.isArray(product) || displayType) continue;

        lineById.set(line["id"] as number, {
          id: line["id"] as number,
          productId: product[0],
          name: String(line["name"] || product[1] || ""),
          qty: Number(line["product_uom_qty"] ?? 1),
          priceUnit: productPriceById.get(product[0]) ?? 0,
        });
      }
    }

    return records.map((record) => ({
      id: record["id"] as number,
      name: String(record["name"] ?? ""),
      lines: (Array.isArray(record["sale_order_template_line_ids"]) ? (record["sale_order_template_line_ids"] as number[]) : [])
        .map((lineId) => lineById.get(lineId))
        .filter((line): line is OdooQuotationTemplate["lines"][number] => Boolean(line)),
    }));
  }

  async getPricePreview(input: PricePreviewInput): Promise<PricePreviewResult> {
    const pricelist = await this.getPartnerPricelist(input.partnerId);
    const validItems = input.items.filter((item) => item.productId > 0 && item.qty > 0);

    if (!pricelist?.id || validItems.length === 0) {
      return {
        pricelistId: pricelist?.id,
        pricelistName: pricelist?.name,
        items: [],
        amountUntaxed: 0,
        amountTax: 0,
        amountTotal: 0,
      };
    }

    const orderLines = validItems.map((item) => [
      0,
      0,
      {
        product_id: item.productId,
        product_uom_qty: item.qty,
      },
    ]);

    let saleOrderId: number | undefined;
    try {
      saleOrderId = await this.executeKw<number>(
        "sale.order",
        "create",
        [
          {
            partner_id: input.partnerId,
            pricelist_id: pricelist.id,
            order_line: orderLines,
          },
        ],
        { context: { tracking_disable: true, mail_notrack: true, no_reset_password: true } },
      );

      const order = await this.executeKw<
        Array<{
          amount_untaxed: number;
          amount_tax: number;
          amount_total: number;
        }>
      >(
        "sale.order",
        "read",
        [[saleOrderId]],
        { fields: ["amount_untaxed", "amount_tax", "amount_total"] },
      );

      const lines = await this.executeKw<
        Array<{
          product_id: OdooMany2One;
          price_unit: number;
        }>
      >(
        "sale.order.line",
        "search_read",
        [[["order_id", "=", saleOrderId]]],
        { fields: ["product_id", "price_unit"] },
      );

      return {
        pricelistId: pricelist.id,
        pricelistName: pricelist.name,
        items: lines
          .filter((line) => Array.isArray(line.product_id))
          .map((line) => ({
            productId: Array.isArray(line.product_id) ? line.product_id[0] : 0,
            price: Number(line.price_unit ?? 0),
          })),
        amountUntaxed: Number(order[0]?.amount_untaxed ?? 0),
        amountTax: Number(order[0]?.amount_tax ?? 0),
        amountTotal: Number(order[0]?.amount_total ?? 0),
      };
    } finally {
      if (saleOrderId) {
        await this.executeKw<unknown>(
          "sale.order",
          "unlink",
          [[saleOrderId]],
          { context: { tracking_disable: true, mail_notrack: true } },
        );
      }
    }
  }

  async createConfirmAndPayQuickSale(input: QuickSaleInput): Promise<QuickSaleResult> {
    try {
      if (!input.partnerId) {
        return { success: false, error: "Seleccione un cliente" };
      }

      const validItems = input.items.filter((item) => item.productId > 0 && item.qty > 0);
      if (validItems.length === 0) {
        return { success: false, error: "Agregue productos a la orden" };
      }

      const orderLines = validItems.map((item) => [
        0,
        0,
        {
          product_id: item.productId,
          product_uom_qty: item.qty,
        },
      ]);

      const saleOrderId = await this.executeKw<number>(
        "sale.order",
        "create",
        [
          {
            partner_id: input.partnerId,
            pricelist_id: input.pricelistId ?? (await this.getPartnerPricelist(input.partnerId))?.id,
            order_line: orderLines,
          },
        ],
      );

      await this.executeKw<unknown>("sale.order", "action_confirm", [[saleOrderId]], {});

      const order = await this.readSaleOrderSummary(saleOrderId);

      if (input.paymentMethod === "account") {
        return {
          success: true,
          saleOrderId,
          saleOrderName: order.name,
          partnerName: order.partnerName,
          amountUntaxed: order.amountUntaxed,
          amountTax: order.amountTax,
          amountTotal: order.amountTotal,
        };
      }

      const payment = await this.processOrderPayment(
        saleOrderId,
        input.paymentMethod,
        order.amountTotal,
        order.name,
      );

      if (!payment.success) {
        return {
          success: false,
          saleOrderId,
          saleOrderName: order.name,
          partnerName: order.partnerName,
          amountUntaxed: order.amountUntaxed,
          amountTax: order.amountTax,
          amountTotal: order.amountTotal,
          error: payment.error ?? "No se pudo registrar el pago",
        };
      }

      return {
        success: true,
        saleOrderId,
        saleOrderName: order.name,
        partnerName: order.partnerName,
        amountUntaxed: order.amountUntaxed,
        amountTax: order.amountTax,
        amountTotal: order.amountTotal,
        posOrderId: payment.posOrderId,
        invoiceId: payment.invoiceId,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  private async processViaPosSession(
    orderId: number,
    paymentMethod: "cash" | "card",
    amount: number,
    orderName: string,
  ): Promise<{ success: boolean; posOrderId?: number; error?: string }> {
    // 1 — Find the open POS session
    const sessions = await this.executeKw<Array<{ id: number; config_id: OdooMany2One }>>(
      "pos.session",
      "search_read",
      [[["state", "=", "opened"]]],
      { fields: ["id", "config_id"], limit: 1 },
    );
    if (!sessions[0]) throw new Error("No hay sesión de caja abierta en Odoo");

    const sessionId = sessions[0].id;
    const configId = Array.isArray(sessions[0].config_id) ? sessions[0].config_id[0] : null;
    if (!configId) throw new Error("No se pudo leer la configuración de la caja");

    // 2 — Get POS payment methods for this config
    const configs = await this.executeKw<Array<{ payment_method_ids: number[] }>>(
      "pos.config",
      "read",
      [[configId]],
      { fields: ["payment_method_ids"] },
    );
    const pmIds = configs[0]?.payment_method_ids ?? [];
    const pms = await this.executeKw<Array<{ id: number; name: string; is_cash_count: boolean }>>(
      "pos.payment.method",
      "read",
      [pmIds],
      { fields: ["id", "name", "is_cash_count"] },
    );

    const pm =
      paymentMethod === "cash"
        ? (pms.find((m) => m.is_cash_count) ?? pms[0])
        : (pms.find((m) => !m.is_cash_count) ?? pms[0]);
    if (!pm) throw new Error("No hay métodos de pago configurados en la caja de Odoo");

    // 3 — Get sale order partner
    const orderData = await this.executeKw<Array<{ partner_id: OdooMany2One }>>(
      "sale.order",
      "read",
      [[orderId]],
      { fields: ["partner_id"] },
    );
    const partnerId = Array.isArray(orderData[0]?.partner_id) ? orderData[0].partner_id[0] : false;

    // 4 — Get sale order lines (skip down-payments — those products are usually not in POS)
    const rawLines = await this.executeKw<
      Array<{
        id: number;
        product_id: OdooMany2One;
        product_uom_qty: number;
        price_unit: number;
        price_subtotal: number;
        is_downpayment: boolean;
        display_type: string | false;
      }>
    >(
      "sale.order.line",
      "search_read",
      [[["order_id", "=", orderId]]],
      { fields: ["id", "product_id", "product_uom_qty", "price_unit", "price_subtotal", "is_downpayment", "display_type"] },
    );

    const productLines = rawLines.filter(
      (l) => !l.is_downpayment && !l.display_type && Array.isArray(l.product_id) && l.product_uom_qty > 0,
    );

    if (productLines.length === 0) {
      throw new Error("La orden solo tiene líneas de anticipos o depósitos — use el flujo de contabilidad");
    }

    // 5 — Build POS order lines — include sale_order_line_id so pos_sale module
    //     counts these as invoiced on the sale order (updates qty_invoiced → invoice_status).
    //     Taxes are intentionally omitted — Odoo POS computes them from the product/fiscal position.
    const buildPosLines = (includeSaleOrderLineId: boolean) => productLines.map((l, i) => [
      0,
      i,
      {
        product_id: Array.isArray(l.product_id) ? l.product_id[0] : false,
        qty: l.product_uom_qty,
        price_unit: l.price_unit,
        price_subtotal: l.price_subtotal,
        price_subtotal_incl: l.price_subtotal,
        discount: 0,
        tax_ids: [[6, false, []]],
        pack_lot_ids: [],
        ...(includeSaleOrderLineId ? { sale_order_line_id: l.id } : {}),
      },
    ]);

    // 6 — Create pos.order directly (Odoo 17+ dropped create_from_ui)
    const linesTotal = productLines.reduce((s, l) => s + l.price_subtotal, 0);

    const createPosOrder = (includeSaleOrderLineId: boolean) =>
      this.executeKw<number>(
        "pos.order",
        "create",
        [
          {
            session_id: sessionId,
            partner_id: partnerId,
            lines: buildPosLines(includeSaleOrderLineId),
            amount_total: linesTotal,
            amount_paid: linesTotal,
            amount_tax: 0,
            amount_return: 0,
          },
        ],
        {},
      );

    let posOrderId: number;
    try {
      posOrderId = await createPosOrder(true);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      if (!message.includes("sale_order_line_id")) {
        throw error;
      }
      posOrderId = await createPosOrder(false);
    }

    if (!posOrderId) throw new Error("pos.order.create no devolvió un ID");

    // 7 — Register payment
    await this.executeKw<number>(
      "pos.payment",
      "create",
      [
        {
          pos_order_id: posOrderId,
          payment_method_id: pm.id,
          amount: linesTotal,
        },
      ],
      {},
    );

    // 8 — Validate (move state to 'paid')
    await this.executeKw<unknown>("pos.order", "action_pos_order_paid", [[posOrderId]], {});

    return { success: true, posOrderId };
  }

  private async processViaAccounting(
    orderId: number,
    paymentMethod: "cash" | "card",
    amount: number,
    orderName: string,
  ): Promise<{ success: boolean; invoiceId?: number; error?: string }> {
    try {
      const orderRead = await this.executeKw<Array<{ invoice_ids: number[] }>>(
        "sale.order",
        "read",
        [[orderId]],
        { fields: ["invoice_ids"] },
      );
      let invoiceIds = orderRead[0]?.invoice_ids ?? [];

      if (invoiceIds.length === 0) {
        const wizardCtx = {
          context: { active_ids: [orderId], active_model: "sale.order", active_id: orderId },
        };
        const wizardId = await this.executeKw<number>(
          "sale.advance.payment.inv",
          "create",
          [{ advance_payment_method: "delivered" }],
          wizardCtx,
        );
        await this.executeKw<unknown>("sale.advance.payment.inv", "create_invoices", [[wizardId]], wizardCtx);
        const updated = await this.executeKw<Array<{ invoice_ids: number[] }>>(
          "sale.order",
          "read",
          [[orderId]],
          { fields: ["invoice_ids"] },
        );
        invoiceIds = updated[0]?.invoice_ids ?? [];
      }

      if (!invoiceIds.length) return { success: false, error: `No se generó factura para ${orderName}` };

      const invoices = await this.executeKw<Array<{ id: number; state: string; payment_state: string }>>(
        "account.move",
        "read",
        [invoiceIds],
        { fields: ["id", "state", "payment_state"] },
      );

      const invoice =
        invoices.find((i) => i.state === "posted" && i.payment_state !== "paid" && i.payment_state !== "in_payment") ??
        invoices.find((i) => i.state === "draft");

      if (!invoice) return { success: false, error: "La factura ya está pagada o cancelada" };

      if (invoice.state === "draft") {
        await this.executeKw<unknown>("account.move", "action_post", [[invoice.id]]);
      }

      const journalType = paymentMethod === "cash" ? "cash" : "bank";
      const journals = await this.executeKw<Array<{ id: number }>>(
        "account.journal",
        "search_read",
        [[["type", "=", journalType]]],
        { fields: ["id"], limit: 1 },
      );
      if (!journals[0]) return { success: false, error: `No hay diario de tipo "${journalType}"` };

      const regCtx = { context: { active_model: "account.move", active_ids: [invoice.id], active_id: invoice.id } };
      const payWizardId = await this.executeKw<number>(
        "account.payment.register",
        "create",
        [{ journal_id: journals[0].id }],
        regCtx,
      );
      await this.executeKw<unknown>("account.payment.register", "action_create_payments", [[payWizardId]], regCtx);

      return { success: true, invoiceId: invoice.id };
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      return { success: false, error: `Contabilidad: ${msg}` };
    }
  }

  async getProductByBarcode(barcode: string): Promise<OdooProduct | null> {
    const records = await this.executeKw<OdooProductRecord[]>(
      "product.product",
      "search_read",
      [[["barcode", "=", barcode]]],
      {
        fields: [
          "id",
          "default_code",
          "sku",
          "barcode",
          "name",
          "list_price",
          "qty_available",
          "virtual_available",
          "incoming_qty",
          "outgoing_qty",
          "categ_id",
          "image_128",
        ],
        limit: 1,
      },
    );

    if (!records[0]) return null;
    const r = records[0];
    const category = Array.isArray(r.categ_id) ? r.categ_id[1] : "Sin categoria";
    const reference = this.cleanOdooValue(r.default_code) || String(r.id);
    const sku = this.cleanOdooValue(r.sku) || reference;
    const barcodeValue = this.cleanOdooValue(r.barcode);

    return {
      id: r.id,
      variantId: r.id,
      sku,
      clave: reference,
      barcode: barcodeValue || undefined,
      name: r.name,
      stock: this.pickStockQuantity(r),
      price: Number(r.list_price ?? 0),
      category,
      brand: this.inferBrand(r.name, category),
      image: r.image_128 ? `data:image/png;base64,${r.image_128}` : undefined,
    };
  }

  async getProducts(): Promise<OdooProduct[]> {
    const records = await this.executeKw<OdooProductRecord[]>(
      "product.template",
      "search_read",
      [[]],
      {
        fields: [
          "id",
          "default_code",
          "sku",
          "barcode",
          "name",
          "list_price",
          "qty_available",
          "virtual_available",
          "incoming_qty",
          "outgoing_qty",
          "categ_id",
          "product_variant_id",
          "image_128",
          "description_sale",
          "product_variant_count",
          "type",
        ],
        order: "name asc",
      },
    );

    const variantIds = records
      .map((record) => (Array.isArray(record.product_variant_id) ? record.product_variant_id[0] : record.id))
      .filter((id) => Number.isFinite(id));
    const quantStock = await this.getInternalQuantStock(variantIds);

    return records.map((record) => {
      const category = Array.isArray(record.categ_id) ? record.categ_id[1] : "Sin categoria";
      const reference = this.cleanOdooValue(record.default_code) || String(record.id);
      const sku = this.cleanOdooValue(record.sku) || reference;
      const barcodeValue = this.cleanOdooValue(record.barcode);
      const variantId = Array.isArray(record.product_variant_id) ? record.product_variant_id[0] : record.id;
      const computedStock = this.pickStockQuantity(record);
      const internalStock = quantStock.get(variantId);

      return {
        id: record.id,
        variantId,
        sku,
        clave: reference,
        barcode: barcodeValue || undefined,
        name:
          record.product_variant_count && record.product_variant_count > 1
            ? `${record.name} (${record.product_variant_count} variantes)`
            : record.name,
        stock: internalStock !== undefined ? internalStock : computedStock,
        price: Number(record.list_price ?? 0),
        category,
        brand: this.inferBrand(record.name, category),
        description: this.cleanDescription(record.description_sale) || record.name,
      };
    });
  }

  async getProductImage(productId: number): Promise<Buffer | null> {
    const records = await this.executeKw<Array<{ image_128?: string | false }>>(
      "product.template",
      "search_read",
      [[["id", "=", productId]]],
      {
        fields: ["image_128"],
        limit: 1,
      },
    );

    const image = records[0]?.image_128;
    return typeof image === "string" ? Buffer.from(image, "base64") : null;
  }

  async getProductDetail(templateId: number): Promise<OdooProduct | null> {
    let records = await this.executeKw<OdooProductRecord[]>(
      "product.template",
      "search_read",
      [[["id", "=", templateId]]],
      {
        fields: [
          "id",
          "default_code",
          "sku",
          "barcode",
          "name",
          "list_price",
          "qty_available",
          "virtual_available",
          "incoming_qty",
          "outgoing_qty",
          "categ_id",
          "product_variant_id",
          "image_128",
          "image_512",
          "description",
          "description_sale",
          "product_variant_count",
          "type",
        ],
        limit: 1,
      },
    );

    if (!records[0]) {
      const variants = await this.executeKw<Array<{ product_tmpl_id?: OdooMany2One }>>(
        "product.product",
        "search_read",
        [[["id", "=", templateId]]],
        {
          fields: ["product_tmpl_id"],
          limit: 1,
        },
      );
      const templateFromVariant = variants[0]?.product_tmpl_id;
      const resolvedTemplateId = Array.isArray(templateFromVariant) ? templateFromVariant[0] : undefined;

      if (resolvedTemplateId) {
        records = await this.executeKw<OdooProductRecord[]>(
          "product.template",
          "search_read",
          [[["id", "=", resolvedTemplateId]]],
          {
            fields: [
              "id",
              "default_code",
              "sku",
              "barcode",
              "name",
              "list_price",
              "qty_available",
              "virtual_available",
              "incoming_qty",
              "outgoing_qty",
              "categ_id",
              "product_variant_id",
              "image_128",
              "image_512",
              "description",
              "description_sale",
              "product_variant_count",
              "type",
            ],
            limit: 1,
          },
        );
      }
    }

    const record = records[0];
    if (!record) return null;

    const variantId = Array.isArray(record.product_variant_id) ? record.product_variant_id[0] : record.id;
    const quantStock = await this.getInternalQuantStock([variantId]);
    const category = Array.isArray(record.categ_id) ? record.categ_id[1] : "Sin categoria";
    const reference = this.cleanOdooValue(record.default_code) || String(record.id);
    const sku = this.cleanOdooValue(record.sku) || reference;
    const barcodeValue = this.cleanOdooValue(record.barcode);
    const computedStock = this.pickStockQuantity(record);
    const internalStock = quantStock.get(variantId);

    return {
      id: record.id,
      variantId,
      sku,
      clave: reference,
      barcode: barcodeValue || undefined,
      name:
        record.product_variant_count && record.product_variant_count > 1
          ? `${record.name} (${record.product_variant_count} variantes)`
          : record.name,
      stock: internalStock !== undefined ? internalStock : computedStock,
      price: Number(record.list_price ?? 0),
      category,
      brand: this.inferBrand(record.name, category),
      image: record.image_512 ? `data:image/png;base64,${record.image_512}` : record.image_128 ? `data:image/png;base64,${record.image_128}` : undefined,
      description: this.cleanDescription(record.description_sale || record.description) || record.name,
      internalNotesHtml: this.cleanProductHtml(record.description),
    };
  }

  private async getInternalQuantStock(productIds: number[]): Promise<Map<number, number>> {
    if (productIds.length === 0) return new Map();

    try {
      const records = await this.executeKw<OdooStockQuant[]>(
        "stock.quant",
        "search_read",
        [[["product_id", "in", productIds], ["location_id.usage", "=", "internal"]]],
        {
          fields: ["product_id", "quantity", "reserved_quantity", "available_quantity", "location_id"],
        },
      );

      const stock = new Map<number, number>();
      for (const record of records) {
        if (!Array.isArray(record.product_id)) continue;

        const productId = record.product_id[0];
        const available =
          record.available_quantity ??
          Number(record.quantity ?? 0) - Number(record.reserved_quantity ?? 0);
        stock.set(productId, Number((stock.get(productId) ?? 0) + Number(available ?? 0)));
      }

      return stock;
    } catch {
      return new Map();
    }
  }

  private pickStockQuantity(record: Pick<OdooProductRecord, "free_qty" | "qty_available" | "virtual_available">): number {
    const values = [record.free_qty, record.qty_available, record.virtual_available]
      .map((value) => Number(value ?? 0))
      .filter((value) => Number.isFinite(value));

    return Math.max(0, ...values);
  }

  private async authenticate(): Promise<number> {
    if (this.uid) {
      return this.uid;
    }

    const db = this.requiredConfig("ODOO_DB");
    const username = this.requiredConfig("ODOO_USERNAME");
    const apiKey = this.requiredConfig("ODOO_API_KEY");

    const uid = await this.jsonRpc<number | false>({
      service: "common",
      method: "authenticate",
      args: [db, username, apiKey, {}],
    });

    if (!uid) {
      throw new UnauthorizedException("Odoo authentication failed");
    }

    this.uid = uid;
    return uid;
  }

  private async executeKw<T>(
    model: string,
    method: string,
    args: unknown[] = [],
    kwargs: Record<string, unknown> = {},
  ): Promise<T> {
    const db = this.requiredConfig("ODOO_DB");
    const apiKey = this.requiredConfig("ODOO_API_KEY");
    const uid = await this.authenticate();

    return this.jsonRpc<T>({
      service: "object",
      method: "execute_kw",
      args: [db, uid, apiKey, model, method, args, kwargs],
    });
  }

  private async readSaleOrderSummary(orderId: number): Promise<{
    name: string;
    partnerName: string;
    amountUntaxed: number;
    amountTax: number;
    amountTotal: number;
  }> {
    const records = await this.executeKw<
      Array<{
        name: string;
        partner_id: OdooMany2One;
        amount_untaxed: number;
        amount_tax: number;
        amount_total: number;
      }>
    >(
      "sale.order",
      "read",
      [[orderId]],
      { fields: ["name", "partner_id", "amount_untaxed", "amount_tax", "amount_total"] },
    );

    const record = records[0];
    if (!record) {
      throw new Error("No se pudo leer la orden creada en Odoo");
    }

    return {
      name: record.name,
      partnerName: Array.isArray(record.partner_id) ? record.partner_id[1] : "",
      amountUntaxed: Number(record.amount_untaxed ?? 0),
      amountTax: Number(record.amount_tax ?? 0),
      amountTotal: Number(record.amount_total ?? 0),
    };
  }

  private async getPartnerPricelist(partnerId: number): Promise<{ id: number; name: string } | undefined> {
    const records = await this.executeKw<Array<{ property_product_pricelist?: OdooMany2One }>>(
      "res.partner",
      "read",
      [[partnerId]],
      { fields: ["property_product_pricelist"] },
    );

    const pricelist = this.pickPartnerPricelist(records[0] ?? {});
    return pricelist;
  }

  private pickPartnerPricelist(record: Record<string, unknown>): { id: number; name: string } | undefined {
    const pricelist = record["property_product_pricelist"];
    return Array.isArray(pricelist) ? { id: pricelist[0], name: pricelist[1] } : undefined;
  }

  private async jsonRpc<T>(params: Record<string, unknown>): Promise<T> {
    const baseUrl = this.requiredConfig("ODOO_URL").replace(/\/$/, "");
    const response = await fetch(`${baseUrl}/jsonrpc`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        jsonrpc: "2.0",
        method: "call",
        params,
        id: Date.now(),
      }),
    });

    if (!response.ok) {
      throw new Error(`Odoo JSON-RPC request failed: ${response.status}`);
    }

    const payload = (await response.json()) as JsonRpcResponse<T>;

    if (payload.error) {
      const data = payload.error.data as { message?: string } | undefined;
      const detail = data?.message ?? payload.error.message;
      throw new Error(detail);
    }

    if (payload.result === undefined) {
      throw new Error("Odoo JSON-RPC returned no result");
    }

    return payload.result;
  }

  private requiredConfig(key: string): string {
    const value = this.config.get<string>(key);

    if (!value) {
      throw new Error(`${key} is required`);
    }

    return value;
  }

  private cleanOdooValue(value?: string | false): string {
    return typeof value === "string" ? value : "";
  }

  private cleanDescription(value?: string | false): string {
    if (typeof value !== "string") return "";
    return value
      .replace(/<style[\s\S]*?<\/style>/gi, " ")
      .replace(/<script[\s\S]*?<\/script>/gi, " ")
      .replace(/<[^>]+>/g, " ")
      .replace(/&nbsp;/g, " ")
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/\s+/g, " ")
      .trim();
  }

  private cleanProductHtml(value?: string | false): string {
    if (typeof value !== "string") return "";

    const baseUrl = this.requiredConfig("ODOO_URL").replace(/\/$/, "");
    return value
      .replace(/<script[\s\S]*?<\/script>/gi, "")
      .replace(/<style[\s\S]*?<\/style>/gi, "")
      .replace(/\son\w+=(["']).*?\1/gi, "")
      .replace(/\s(href|src)=(["'])\/(?!\/)/gi, ` $1=$2${baseUrl}/`)
      .trim();
  }

  private inferBrand(name: string, category: string): string {
    const source = `${name} ${category}`.toLowerCase();
    const brands = ["Dahua", "Hikvision", "Hilook", "Epcom", "Western Digital", "Ubiquiti", "Trendnet"];
    return brands.find((brand) => source.includes(brand.toLowerCase())) ?? "Worldcam";
  }
}
