import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

export type TvcCatalogProduct = {
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
export class TvcService {
  private readonly logger = new Logger(TvcService.name);

  constructor(private readonly config: ConfigService) {}

  async getCatalogProducts(): Promise<TvcCatalogProduct[]> {
    if (!this.isConfigured()) {
      this.logger.warn("TVC skipped: configure TVC_API_URL and TVC_API_TOKEN.");
      return [];
    }

    try {
      const rows = await this.getProductRows();
      const usdToMxn = this.usdToMxnRate();
      const products = rows.map((row) => this.mapProduct(row, usdToMxn)).filter((product): product is TvcCatalogProduct => Boolean(product));
      this.logger.log(`TVC catalog loaded ${products.length} products`);
      return products;
    } catch (error) {
      const message = error instanceof Error ? error.message : "TVC catalog unavailable";
      this.logger.warn(`TVC catalog unavailable: ${message}`);
      return [];
    }
  }

  isConfigured() {
    return Boolean(this.baseUrl() && this.token());
  }

  private baseUrl() {
    return this.config.get<string>("TVC_API_URL")?.trim() || "";
  }

  private token() {
    return this.config.get<string>("TVC_API_TOKEN")?.trim() || "";
  }

  private productsPath() {
    return this.config.get<string>("TVC_PRODUCTS_PATH")?.trim() || "products";
  }

  private productsPerPage() {
    const value = Number(this.config.get<string>("TVC_PRODUCTS_PER_PAGE")?.trim() || "100");
    if (!Number.isFinite(value)) return 100;
    return Math.min(100, Math.max(1, value));
  }

  private maxPages() {
    const raw = this.config.get<string>("TVC_PRODUCTS_MAX_PAGES")?.trim() || "all";
    if (raw.toLowerCase() === "all") return Number.POSITIVE_INFINITY;
    const value = Number(raw);
    return Number.isFinite(value) ? Math.max(1, value) : Number.POSITIVE_INFINITY;
  }

  private pricesInUsd() {
    return (this.config.get<string>("TVC_PRICES_IN_USD")?.trim().toLowerCase() || "true") !== "false";
  }

  private usdToMxnRate() {
    const value = Number(this.config.get<string>("TVC_USD_MXN_FALLBACK")?.trim() || "18");
    return Number.isFinite(value) && value > 0 ? value : 18;
  }

  private async getProductRows() {
    const firstPage = await this.request<unknown>(this.productPathWithQuery(1));
    const rows = this.extractProducts(firstPage);
    const lastPage = Math.min(this.lastPage(firstPage), this.maxPages());

    for (let page = 2; page <= lastPage; page += 1) {
      const response = await this.request<unknown>(this.productPathWithQuery(page));
      rows.push(...this.extractProducts(response));
    }

    return rows;
  }

  private productPathWithQuery(page: number) {
    const path = this.productsPath();
    const normalized = path.toLowerCase().split("?")[0].replace(/^https?:\/\/[^/]+\//, "").replace(/^\/+/, "");
    if (normalized !== "products" && !normalized.endsWith("/products")) return path;

    const separator = path.includes("?") ? "&" : "?";
    const params = new URLSearchParams({
      withInventory: "simple",
      withPrice: "true",
      withMedia: "true",
      withOverviews: "true",
      withWeightsAndDimensions: "true",
      withCategoryBreadcrumb: "true",
      perPage: String(this.productsPerPage()),
      page: String(page),
    });

    return `${path}${separator}${params.toString()}`;
  }

  private async request<T>(path: string): Promise<T> {
    const baseUrl = this.baseUrl().replace(/\/$/, "");
    const target = path.startsWith("http") ? path : `${baseUrl}/${path.replace(/^\//, "")}`;
    const tokenHeader = this.config.get<string>("TVC_TOKEN_HEADER")?.trim() || "Authorization";
    const tokenPrefix = this.config.get<string>("TVC_TOKEN_PREFIX") ?? "Bearer ";
    const authorizationPrefix = tokenPrefix && !/\s$/.test(tokenPrefix) ? `${tokenPrefix} ` : tokenPrefix;
    const headers: Record<string, string> = {
      Accept: "application/json",
      [tokenHeader]: tokenHeader.toLowerCase() === "authorization" ? `${authorizationPrefix}${this.token()}` : this.token(),
    };

    const response = await fetch(target, { headers, signal: AbortSignal.timeout(30_000) });
    if (!response.ok) throw new Error(`TVC API failed with ${response.status}`);

    const body = await response.text();
    const trimmedBody = body.trim();
    if (!trimmedBody.startsWith("{") && !trimmedBody.startsWith("[")) {
      throw new Error("TVC API returned non JSON content");
    }

    return JSON.parse(trimmedBody) as T;
  }

  private lastPage(response: unknown) {
    if (!this.isRecord(response)) return 1;
    const meta = response.meta;
    if (this.isRecord(meta)) {
      const lastPage = this.numberValue(meta.last_page) || this.numberValue(meta.lastPage);
      if (lastPage) return lastPage;
    }
    return 1;
  }

  private extractProducts(response: unknown): Record<string, unknown>[] {
    if (Array.isArray(response)) return response.filter(this.isRecord);
    if (!this.isRecord(response)) return [];

    const configuredPath = this.config.get<string>("TVC_PRODUCTS_ARRAY_PATH")?.trim();
    const configured = configuredPath ? this.valueAtPath(response, configuredPath) : null;
    if (Array.isArray(configured)) return configured.filter(this.isRecord);

    for (const key of ["productos", "products", "data", "items", "result", "results"]) {
      const value = response[key];
      if (Array.isArray(value)) return value.filter(this.isRecord);
      if (this.isRecord(value)) {
        for (const nestedKey of ["productos", "products", "data", "items", "result", "results"]) {
          const nestedValue = value[nestedKey];
          if (Array.isArray(nestedValue)) return nestedValue.filter(this.isRecord);
        }
      }
    }

    return [];
  }

  private mapProduct(row: Record<string, unknown>, usdToMxn: number): TvcCatalogProduct | null {
    const id = this.pickString(row, ["tvc_id", "id", "producto_id", "product_id", "codigo", "sku", "clave", "modelo"]);
    const model = this.pickString(row, ["tvc_model", "provider_model", "modelo", "model", "sku", "clave", "codigo", "part_number", "mpn"]);
    const title = this.pickString(row, ["name", "titulo", "title", "nombre", "descripcion_corta", "short_description", "descripcion"]);
    if (!id && !model) return null;

    const rawPrice = this.pickNumber(row, ["distributor_price", "precio_distribuidor", "list_price", "precio", "price", "precio_lista", "precio_publico", "precio_mxn", "cost"]);

    return {
      id: id || model,
      model: model || id,
      brand: this.pickString(row, ["brand", "marca", "manufacturer", "fabricante"]) || "TVC",
      title: title || model || id,
      stock: this.pickNumber(row, ["total_inventories", "stock", "existencia", "existencias", "disponible", "cantidad", "total_existencia"]),
      price: this.pricesInUsd() ? this.toMxn(rawPrice, usdToMxn) : rawPrice,
      category: this.pickCategory(row),
      image: this.pickImage(row),
      description: this.pickDescription(row) || title,
    };
  }

  private pickCategory(row: Record<string, unknown>) {
    const category = this.pickString(row, ["category_breadcrumb", "categoria", "category", "linea", "familia", "subcategoria"]);
    return category ? `TVC / ${category}` : "TVC / Catalogo";
  }

  private pickImage(row: Record<string, unknown>) {
    const media = row.media;
    if (this.isRecord(media)) {
      const image = this.pickString(media, ["main_image", "image", "url", "path"]);
      if (image) return this.absoluteMediaUrl(image);
    }

    const image = this.pickString(row, ["imagen", "image", "img", "foto", "url_imagen", "image_url"]);
    return image ? this.absoluteMediaUrl(image) : undefined;
  }

  private pickDescription(row: Record<string, unknown>) {
    const direct = this.pickString(row, ["descripcion", "description", "descripcion_larga", "long_description"]);
    if (direct) return direct;

    const overviews = row.overviews;
    if (!Array.isArray(overviews)) return "";
    return overviews
      .filter(this.isRecord)
      .map((overview) => this.pickString(overview, ["description", "descripcion", "text", "content"]))
      .filter(Boolean)
      .join(" ");
  }

  private absoluteMediaUrl(value: string) {
    if (/^https?:\/\//i.test(value)) return value;
    const baseUrl = this.baseUrl().replace(/\/$/, "");
    return `${baseUrl}/${value.replace(/^\//, "")}`;
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
