import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

export type PchCatalogProduct = {
  id: string;
  model: string;
  brand: string;
  title: string;
  stock: number;
  price: number;
  category: string;
  image?: string;
  description?: string;
};

@Injectable()
export class PchService {
  private readonly logger = new Logger(PchService.name);

  constructor(private readonly config: ConfigService) {}

  async getCatalogProducts(): Promise<PchCatalogProduct[]> {
    if (!this.isConfigured()) {
      this.logger.warn("PCH skipped: configure PCH_API_URL, PCH_CUSTOMER and PCH_KEY.");
      return [];
    }

    try {
      const [catalogResponse, priceResponse, stockResponse] = await Promise.all([
        this.request<unknown>(this.catalogPath()),
        this.request<unknown>(this.pricePath()),
        this.request<unknown>(this.stockPath()),
      ]);
      const usdToMxn = await this.usdToMxnRate();
      const priceBySku = this.priceBySku(priceResponse, usdToMxn);
      const stockBySku = this.stockBySku(stockResponse);
      const rows = this.extractProducts(catalogResponse);
      const products = rows
        .map((row) => this.mapProduct(row, priceBySku, stockBySku))
        .filter((product): product is PchCatalogProduct => Boolean(product));
      this.logger.log(`PCH catalog loaded ${products.length} products`);
      return products;
    } catch (error) {
      const message = error instanceof Error ? error.message : "PCH catalog unavailable";
      this.logger.warn(`PCH catalog unavailable: ${message}`);
      return [];
    }
  }

  isConfigured() {
    return Boolean(this.baseUrl() && this.customer() && this.key());
  }

  private baseUrl() {
    return this.config.get<string>("PCH_API_URL")?.trim() || "https://pchtest.to-do.mx";
  }

  private customer() {
    return this.config.get<string>("PCH_CUSTOMER")?.trim() || "";
  }

  private key() {
    return this.config.get<string>("PCH_KEY")?.trim() || "";
  }

  private catalogPath() {
    return this.config.get<string>("PCH_CATALOG_PATH")?.trim() || "extcust/catalog";
  }

  private pricePath() {
    return this.config.get<string>("PCH_PRICE_PATH")?.trim() || "extcust/getprodprice_warehouse";
  }

  private stockPath() {
    return this.config.get<string>("PCH_STOCK_PATH")?.trim() || "extcust/getprodstock";
  }

  private parityPath() {
    return this.config.get<string>("PCH_PARITY_PATH")?.trim() || "extcust/getparity";
  }

  private async request<T>(path: string): Promise<T> {
    const baseUrl = this.baseUrl().replace(/\/$/, "");
    const target = path.startsWith("http") ? path : `${baseUrl}/${path.replace(/^\/+/, "")}/`;
    const payload = {
      customer: this.customer(),
      key: this.key(),
    };

    const response = await fetch(target, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(45_000),
    });

    if (!response.ok) {
      throw new Error(`PCH API failed with ${response.status}`);
    }

    const contentType = response.headers.get("content-type") ?? "";
    const body = await response.text();
    const trimmedBody = body.trim();
    const looksLikeJson = trimmedBody.startsWith("{") || trimmedBody.startsWith("[");
    if (!contentType.toLowerCase().includes("application/json") && !looksLikeJson) {
      throw new Error(`PCH API returned ${contentType || "unknown content type"} instead of JSON`);
    }

    return JSON.parse(trimmedBody) as T;
  }

  private extractProducts(response: unknown): Record<string, unknown>[] {
    return this.extractProductValues(response).filter(this.isRecord);
  }

  private extractProductValues(response: unknown): unknown[] {
    if (Array.isArray(response)) return response;
    if (!this.isRecord(response)) return [];

    const configuredPath = this.config.get<string>("PCH_PRODUCTS_ARRAY_PATH")?.trim();
    const configured = configuredPath ? this.valueAtPath(response, configuredPath) : null;
    if (Array.isArray(configured)) return configured;

    for (const key of ["productos", "products", "catalog", "catalogo", "data", "items", "result", "results"]) {
      const value = response[key];
      if (Array.isArray(value)) return value;
      if (this.isRecord(value)) {
        for (const nestedKey of ["productos", "products", "catalog", "catalogo", "data", "items", "result", "results"]) {
          const nestedValue = value[nestedKey];
          if (Array.isArray(nestedValue)) return nestedValue;
        }
      }
    }

    return [];
  }

  private async usdToMxnRate() {
    try {
      const response = await this.request<unknown>(this.parityPath());
      if (this.isRecord(response) && this.isRecord(response.data)) {
        const rate = this.numberValue(response.data.USD);
        if (Number.isFinite(rate) && rate > 0) return rate;
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "PCH parity unavailable";
      this.logger.warn(`PCH parity unavailable: ${message}`);
    }

    const fallback = Number(this.config.get<string>("PCH_USD_MXN_FALLBACK")?.trim() || "18");
    return Number.isFinite(fallback) && fallback > 0 ? fallback : 18;
  }

  private priceBySku(response: unknown, usdToMxn: number) {
    const prices = new Map<string, number>();
    for (const product of this.extractProducts(response)) {
      const sku = this.normalizeSku(this.pickString(product, ["sku", "clave", "codigo", "part_number", "num_parte"]));
      if (!sku) continue;

      const rows = Array.isArray(product.precios) ? product.precios.filter(this.isRecord) : [];
      const values = rows
        .map((row) => this.numberValue(row.precio ?? row.price))
        .filter((value) => Number.isFinite(value) && value > 0);
      if (values.length) prices.set(sku, this.toMxn(Math.min(...values), usdToMxn));
    }
    return prices;
  }

  private stockBySku(response: unknown) {
    const stocks = new Map<string, number>();
    for (const row of this.flattenRecords(this.extractProductValues(response))) {
      const sku = this.normalizeSku(this.pickString(row, ["sku", "clave", "codigo", "clave_fabricante", "part_number", "num_parte"]));
      if (!sku) continue;

      const quantity = this.pickNumber(row, ["cantidad", "stock", "existencia", "existencias", "disponible", "inventory", "onhand"]);
      stocks.set(sku, (stocks.get(sku) ?? 0) + quantity);
    }
    return stocks;
  }

  private flattenRecords(rows: unknown[]) {
    const records: Record<string, unknown>[] = [];
    for (const row of rows) {
      if (Array.isArray(row)) {
        records.push(...row.filter(this.isRecord));
      } else if (this.isRecord(row)) {
        records.push(row);
      }
    }
    return records;
  }

  private mapProduct(row: Record<string, unknown>, priceBySku: Map<string, number>, stockBySku: Map<string, number>): PchCatalogProduct | null {
    const id = this.pickString(row, ["id", "producto_id", "product_id", "sku", "clave", "codigo", "part_number", "num_parte"]);
    const model = this.pickString(row, ["skuFabricante", "sku", "modelo", "model", "clave", "codigo", "part_number", "num_parte", "mpn"]);
    const title = this.pickString(row, ["descripcion", "description", "titulo", "title", "nombre", "name"]);
    if (!id && !model) return null;
    const sku = this.normalizeSku(model || id);

    return {
      id: id || model,
      model: model || id,
      brand: this.pickString(row, ["marca", "brand", "manufacturer", "fabricante"]) || "PCH",
      title: title || model || id,
      stock: stockBySku.get(sku) ?? this.pickNumber(row, ["stock", "existencia", "existencias", "disponible", "cantidad", "inventory", "onhand"]),
      price: priceBySku.get(sku) ?? this.pickNumber(row, ["precio_mxn", "price_mxn", "precio_lista_mxn"]),
      category: this.pickCategory(row),
      image: this.pickImage(row),
      description: title,
    };
  }

  private pickCategory(row: Record<string, unknown>) {
    const category = this.pickString(row, ["categoria", "category", "linea", "familia", "subcategoria", "group"]);
    return category ? `PCH / ${category}` : "PCH / Catalogo";
  }

  private pickImage(row: Record<string, unknown>) {
    const image = this.pickString(row, ["imagen", "image", "img", "foto", "url_imagen", "image_url"]);
    return image || undefined;
  }

  private pickString(row: Record<string, unknown>, keys: string[]) {
    for (const key of keys) {
      const value = row[key];
      if (typeof value === "string" && value.trim()) return this.cleanText(value);
      if (typeof value === "number" && Number.isFinite(value)) return String(value);
    }
    return "";
  }

  private pickNumber(row: Record<string, unknown>, keys: string[]) {
    for (const key of keys) {
      const parsed = this.numberValue(row[key]);
      if (Number.isFinite(parsed)) return Math.max(0, parsed);
    }
    return 0;
  }

  private numberValue(value: unknown) {
    if (typeof value === "number") return value;
    if (typeof value !== "string") return Number.NaN;
    const normalized = value.replace(/[$,\s]/g, "");
    const parsed = Number(normalized);
    return Number.isFinite(parsed) ? parsed : Number.NaN;
  }

  private toMxn(value: number, usdToMxn: number) {
    return Math.round(value * usdToMxn * 100) / 100;
  }

  private cleanText(value: string) {
    return value.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
  }

  private normalizeSku(value: string) {
    return value.trim().toUpperCase();
  }

  private valueAtPath(value: unknown, path: string) {
    return path.split(".").reduce<unknown>((current, key) => {
      if (!this.isRecord(current)) return undefined;
      return current[key];
    }, value);
  }

  private isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === "object" && value !== null && !Array.isArray(value);
  }
}
