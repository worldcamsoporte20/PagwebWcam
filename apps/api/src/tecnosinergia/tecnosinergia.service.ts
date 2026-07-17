import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

export type TecnosinergiaCatalogProduct = {
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
export class TecnosinergiaService {
  private readonly logger = new Logger(TecnosinergiaService.name);

  constructor(private readonly config: ConfigService) {}

  async getCatalogProducts(): Promise<TecnosinergiaCatalogProduct[]> {
    if (!this.isConfigured()) {
      this.logger.warn("Tecnosinergia skipped: configure TECNOSINERGIA_API_BASE_URL and TECNOSINERGIA_PRODUCTS_PATH.");
      return [];
    }

    try {
      const response = await this.request<unknown>(this.productsPath());
      const rows = this.extractProducts(response);
      const products = rows.map((row) => this.mapProduct(row)).filter((product): product is TecnosinergiaCatalogProduct => Boolean(product));
      this.logger.log(`Tecnosinergia catalog loaded ${products.length} products`);
      return products;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Tecnosinergia catalog unavailable";
      this.logger.warn(`Tecnosinergia catalog unavailable: ${message}`);
      return [];
    }
  }

  isConfigured() {
    return Boolean(this.baseUrl() && this.productsPath());
  }

  private baseUrl() {
    return this.config.get<string>("TECNOSINERGIA_API_BASE_URL")?.trim() || "";
  }

  private token() {
    return this.config.get<string>("TECNOSINERGIA_API_TOKEN")?.trim() || "";
  }

  private productsPath() {
    return this.config.get<string>("TECNOSINERGIA_PRODUCTS_PATH")?.trim() || "";
  }

  private async request<T>(path: string): Promise<T> {
    const baseUrl = this.baseUrl().replace(/\/$/, "");
    const target = path.startsWith("http") ? path : `${baseUrl}/${path.replace(/^\//, "")}`;
    const headers: Record<string, string> = {
      Accept: "application/json",
      "Content-Type": "application/json",
    };
    const token = this.token();

    if (token) {
      const tokenHeader = this.config.get<string>("TECNOSINERGIA_TOKEN_HEADER")?.trim() || "api-token";
      const tokenPrefix = this.config.get<string>("TECNOSINERGIA_TOKEN_PREFIX") ?? "";
      const authorizationPrefix = tokenPrefix && !/\s$/.test(tokenPrefix) ? `${tokenPrefix} ` : tokenPrefix;
      headers[tokenHeader] = tokenHeader.toLowerCase() === "authorization" ? `${authorizationPrefix}${token}` : token;
    }

    const response = await fetch(target, { headers, signal: AbortSignal.timeout(45_000) });
    if (!response.ok) throw new Error(`Tecnosinergia API failed with ${response.status}`);

    const body = (await response.text()).trim();
    if (!body.startsWith("{") && !body.startsWith("[")) {
      throw new Error("Tecnosinergia API returned non JSON content");
    }

    return JSON.parse(body) as T;
  }

  private extractProducts(response: unknown): Record<string, unknown>[] {
    if (Array.isArray(response)) return response.filter(this.isRecord);
    if (!this.isRecord(response)) return [];

    const configuredPath = this.config.get<string>("TECNOSINERGIA_PRODUCTS_ARRAY_PATH")?.trim();
    const configured = configuredPath ? this.valueAtPath(response, configuredPath) : null;
    if (Array.isArray(configured)) return configured.filter(this.isRecord);

    for (const key of ["productos", "products", "data", "items", "result", "results", "catalogo", "catalog"]) {
      const value = response[key];
      if (Array.isArray(value)) return value.filter(this.isRecord);
      if (this.isRecord(value)) {
        for (const nestedKey of ["productos", "products", "data", "items", "result", "results", "catalogo", "catalog"]) {
          const nestedValue = value[nestedKey];
          if (Array.isArray(nestedValue)) return nestedValue.filter(this.isRecord);
        }
      }
    }

    return [];
  }

  private mapProduct(row: Record<string, unknown>): TecnosinergiaCatalogProduct | null {
    const id = this.pickString(row, ["item_id", "id", "producto_id", "product_id", "code", "codigo", "sku", "clave", "modelo", "num_parte"]);
    const model = this.pickString(row, ["model", "modelo", "sku", "code", "clave", "codigo", "part_number", "mpn", "num_parte"]);
    const title = this.pickString(row, ["name", "nombre", "descripcion", "description", "titulo", "title"]);
    if (!id && !model) return null;

    return {
      id: id || model,
      model: model || id,
      brand: this.pickString(row, ["marca", "brand", "manufacturer", "fabricante"]) || "Tecnosinergia",
      title: title || model || id,
      stock: this.pickNumber(row, ["stock_total", "stock", "existencia", "existencias", "disponible", "cantidad", "total_existencia"]),
      price: this.pickNumber(row, ["sale_price", "regular_price", "precio", "price", "precio_distribuidor", "precio_lista", "precio_publico", "precio_mxn", "cost"]),
      category: this.pickCategory(row),
      image: this.pickImage(row),
      description: title,
    };
  }

  private pickCategory(row: Record<string, unknown>) {
    const category = this.pickString(row, ["category", "categoria", "line", "linea", "familia", "subcategoria"]);
    return category ? `Tecnosinergia / ${category}` : "Tecnosinergia / Catalogo";
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
