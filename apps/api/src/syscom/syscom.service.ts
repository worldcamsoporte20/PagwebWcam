import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import sanitizeHtml = require("sanitize-html");

export type SyscomConnectionStatus = {
  configured: boolean;
  connected: boolean;
  message?: string;
};

type SyscomTokenResponse = {
  token_type?: string;
  expires_in?: number;
  access_token?: string;
};

type SyscomProductSearchResponse = {
  cantidad?: number;
  pagina?: number | string;
  paginas?: number | string;
  productos?: SyscomApiProduct[];
};

type SyscomCategory = {
  id?: string | number;
  nombre?: string;
  nivel?: number;
};

type SyscomApiProduct = {
  producto_id?: string | number;
  modelo?: string;
  marca?: string;
  titulo?: string;
  total_existencia?: number;
  precios?: {
    precio_descuento?: string;
    precio_especial?: string;
    precio_1?: string;
    precio_lista?: string;
  };
  imagen?: string;
  img_portada?: string;
  link_privado?: string;
  categorias?: SyscomCategory[];
  descripcion?: string;
  caracteristicas?: string[];
  imagenes?: Array<{
    orden?: number;
    url?: string;
    imagen?: string;
  }>;
};

export type SyscomProductLookupInput = {
  name?: string;
  sku?: string;
  clave?: string;
  brand?: string;
  category?: string;
};

export type SyscomMatchedProduct = {
  id: string;
  model: string;
  brand: string;
  title: string;
  stock: number;
  price: number | null;
  score: number;
};

export type SyscomCatalogProduct = {
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

type SyscomExchangeRateResponse = {
  normal?: string | number;
};

export type SyscomProductDetail = SyscomCatalogProduct & {
  description: string;
  characteristics: string[];
  technicalImages: string[];
  technicalHtml: string;
};

export type SyscomProductMatchResult = {
  status: "matched" | "not_found" | "unconfigured" | "error";
  product?: SyscomMatchedProduct;
  message?: string;
};

@Injectable()
export class SyscomService {
  private readonly logger = new Logger(SyscomService.name);
  private accessToken: string | null = null;
  private accessTokenExpiresAt = 0;
  private usdToMxnRate = 1;
  private exchangeRateExpiresAt = 0;
  private readonly productMatchCache = new Map<string, { expiresAt: number; result: SyscomProductMatchResult }>();

  constructor(private readonly config: ConfigService) {}

  async getConnectionStatus(): Promise<SyscomConnectionStatus> {
    if (!this.isConfigured()) {
      return {
        configured: false,
        connected: false,
        message: "Configura SYSCOM_CLIENT_ID y SYSCOM_CLIENT_SECRET para conectar Almacen Syscom.",
      };
    }

    try {
      await this.request("categorias");
      return {
        configured: true,
        connected: true,
        message: "Almacen Syscom conectado.",
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Syscom no respondio";
      this.logger.warn(`Syscom connection check failed: ${message}`);
      return {
        configured: true,
        connected: false,
        message,
      };
    }
  }

  async getMxnExchangeRate() {
    return this.refreshExchangeRate();
  }

  async getProductDetail(productId: string): Promise<SyscomProductDetail | null> {
    if (!this.isConfigured() || !productId) return null;

    await this.refreshExchangeRate();
    const product = await this.request<SyscomApiProduct>(`productos/${encodeURIComponent(productId)}`);
    if (!product?.producto_id) return null;

    const summary = this.mapCatalogProduct(product);
    const characteristics = (product.caracteristicas ?? [])
      .map((value) => this.cleanDescription(value))
      .filter(Boolean);
    const galleryImages = [...(product.imagenes ?? [])]
      .sort((a, b) => Number(a.orden ?? 0) - Number(b.orden ?? 0))
      .map((image) => image.imagen ?? image.url ?? "");
    const descriptionImages = [...(product.descripcion ?? "").matchAll(/<img\b[^>]*\bsrc\s*=\s*["']([^"']+)["'][^>]*>/gi)]
      .map((match) => match[1]);
    const technicalImages = [...new Set([...galleryImages, ...descriptionImages].map((image) => this.normalizeMediaUrl(image)).filter(Boolean))]
      .slice(0, 10);

    return {
      ...summary,
      image: summary.image ?? technicalImages[0],
      description: this.cleanDescription(product.descripcion ?? product.titulo ?? ""),
      characteristics,
      technicalImages,
      technicalHtml: this.cleanTechnicalHtml(product.descripcion ?? ""),
    };
  }

  async getProductImage(productId: string): Promise<{ data: Buffer; contentType: string } | null> {
    const detail = await this.getProductDetail(productId);
    const imageUrl = detail?.image ?? detail?.technicalImages[0];
    if (!imageUrl) return null;

    const url = new URL(imageUrl);
    if (url.protocol !== "https:" || !url.hostname.toLowerCase().endsWith("syscom.mx")) return null;

    for (let attempt = 0; attempt < 2; attempt += 1) {
      try {
        const response = await fetch(url, { signal: AbortSignal.timeout(15_000) });
        if (!response.ok) continue;

        const contentType = response.headers.get("content-type") ?? "image/jpeg";
        if (!contentType.startsWith("image/")) return null;
        return { data: Buffer.from(await response.arrayBuffer()), contentType };
      } catch {
        if (attempt === 0) await this.sleep(400);
      }
    }

    return null;
  }

  async findMatchingProduct(input: SyscomProductLookupInput): Promise<SyscomProductMatchResult> {
    if (!this.isConfigured()) {
      return {
        status: "unconfigured",
        message: "Configura SYSCOM_CLIENT_ID y SYSCOM_CLIENT_SECRET para conectar Almacen Syscom.",
      };
    }

    const terms = this.buildSearchTerms(input);
    if (!terms.length) {
      return {
        status: "not_found",
        message: "Sin clave o modelo para buscar en Syscom.",
      };
    }

    const cacheKey = this.normalizeCode(terms.join("|"));
    const cached = this.productMatchCache.get(cacheKey);
    if (cached && cached.expiresAt > Date.now()) {
      return cached.result;
    }

    try {
      await this.refreshExchangeRate();
      let best: SyscomMatchedProduct | null = null;
      for (const term of terms.slice(0, 4)) {
        const response = await this.request<SyscomProductSearchResponse>(`productos?busqueda=${encodeURIComponent(term)}`);
        const candidates = response.productos ?? [];
        for (const product of candidates) {
          const scored = this.scoreProductMatch(input, terms, product);
          if (!best || scored.score > best.score) {
            best = scored;
          }
        }

        if (best && best.score >= 115) break;
      }

      const result: SyscomProductMatchResult =
        best && best.score >= 90
          ? {
              status: "matched",
              product: best,
              message: `Coincidencia por modelo ${best.model}.`,
            }
          : {
              status: "not_found",
              message: "No encontre una coincidencia fuerte por SKU o modelo en Syscom.",
            };

      this.productMatchCache.set(cacheKey, { expiresAt: Date.now() + 15 * 60 * 1000, result });
      return result;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Syscom no respondio";
      this.logger.warn(`Syscom product match failed: ${message}`);
      return { status: "error", message };
    }
  }

  async getCatalogProducts(): Promise<SyscomCatalogProduct[]> {
    if (!this.isConfigured()) return [];

    await this.refreshExchangeRate();
    const categoryIds = this.getCatalogCategoryIds();
    const maxRequests = this.getCatalogMaxRequests();
    const productsById = new Map<string, SyscomCatalogProduct>();
    let requests = 0;
    const pagePaths: string[] = [];
    const pageCountsByCategory: Array<{ categoryId: string; pages: number }> = [];

    try {
      const firstPages = await Promise.all(
        categoryIds.map(async (categoryId) => {
          try {
            const firstPage = await this.request<SyscomProductSearchResponse>(`productos?categoria=${encodeURIComponent(categoryId)}&pagina=1`);
            return { categoryId, firstPage };
          } catch (error) {
            const message = error instanceof Error ? error.message : "Syscom category unavailable";
            this.logger.warn(`Syscom category ${categoryId} skipped: ${message}`);
            return null;
          }
        }),
      );

      for (const result of firstPages) {
        if (!result) continue;
        if (requests >= maxRequests) break;

        requests += 1;
        this.addCatalogProducts(productsById, result.firstPage.productos ?? []);

        const pages = Math.max(1, Number(result.firstPage.paginas ?? 1));
        pageCountsByCategory.push({ categoryId: result.categoryId, pages });
      }

      let page = 2;
      while (requests < maxRequests) {
        let queuedPage = false;
        for (const category of pageCountsByCategory) {
          if (page > category.pages || requests >= maxRequests) continue;
          requests += 1;
          queuedPage = true;
          pagePaths.push(`productos?categoria=${encodeURIComponent(category.categoryId)}&pagina=${page}`);
        }
        if (!queuedPage) break;
        page += 1;
      }

      this.logger.log(`Syscom catalog queued ${requests} page requests across ${categoryIds.length} categories`);
      await this.runCatalogPageQueue(pagePaths, productsById);
      this.logger.log(`Syscom catalog loaded ${productsById.size} products with stock >= 5`);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Syscom catalog unavailable";
      this.logger.warn(`Syscom catalog unavailable: ${message}`);
    }

    return [...productsById.values()];
  }

  private async runCatalogPageQueue(paths: string[], productsById: Map<string, SyscomCatalogProduct>) {
    const concurrency = this.getCatalogConcurrency();
    let cursor = 0;
    let completed = 0;
    const total = paths.length;
    const failedPaths: string[] = [];

    const workers = Array.from({ length: Math.min(concurrency, paths.length) }, async () => {
      while (cursor < paths.length) {
        const path = paths[cursor];
        cursor += 1;

        try {
          const response = await this.requestCatalogPage(path);
          this.addCatalogProducts(productsById, response.productos ?? []);
        } catch (error) {
          const message = error instanceof Error ? error.message : "Syscom page unavailable";
          failedPaths.push(path);
          this.logger.warn(`Syscom catalog page retry queued: ${path} - ${message}`);
        }

        completed += 1;
        if (completed % 25 === 0 || completed === total) {
          this.logger.log(`Syscom catalog progress ${completed}/${total} pages, ${productsById.size} products with stock >= 5`);
        }
      }
    });

    await Promise.all(workers);

    if (failedPaths.length > 0) {
      this.logger.warn(`Syscom catalog retrying ${failedPaths.length} failed pages`);
      const recovered = await this.retryFailedCatalogPages(failedPaths, productsById);
      this.logger.log(`Syscom catalog recovered ${recovered}/${failedPaths.length} failed pages`);
    }
  }

  private async retryFailedCatalogPages(paths: string[], productsById: Map<string, SyscomCatalogProduct>) {
    const concurrency = Math.min(4, paths.length);
    let cursor = 0;
    let completed = 0;
    let recovered = 0;

    const workers = Array.from({ length: concurrency }, async () => {
      while (cursor < paths.length) {
        const path = paths[cursor];
        cursor += 1;

        try {
          const response = await this.requestCatalogPage(path, 1);
          this.addCatalogProducts(productsById, response.productos ?? []);
          recovered += 1;
        } catch (error) {
          const message = error instanceof Error ? error.message : "Syscom page unavailable";
          this.logger.warn(`Syscom catalog page skipped after final retry: ${path} - ${message}`);
        }

        completed += 1;
        if (completed % 10 === 0 || completed === paths.length) {
          this.logger.log(`Syscom catalog final retry progress ${completed}/${paths.length}, recovered ${recovered}`);
        }
      }
    });

    await Promise.all(workers);
    return recovered;
  }

  private async requestCatalogPage(path: string, retries = 2): Promise<SyscomProductSearchResponse> {
    let lastError: unknown;

    for (let attempt = 0; attempt <= retries; attempt += 1) {
      try {
        return await this.request<SyscomProductSearchResponse>(path);
      } catch (error) {
        lastError = error;
        if (attempt < retries) {
          await this.sleep(700 * (attempt + 1));
        }
      }
    }

    throw lastError instanceof Error ? lastError : new Error("Syscom page unavailable");
  }

  private sleep(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  private addCatalogProducts(productsById: Map<string, SyscomCatalogProduct>, products: SyscomApiProduct[]) {
    for (const product of products) {
      const mapped = this.mapCatalogProduct(product);
      if (!mapped.id) continue;
      if (mapped.stock < 5) continue;
      productsById.set(mapped.id, mapped);
    }
  }

  private getCatalogCategoryIds() {
    const configured = this.config.get<string>("SYSCOM_CATALOG_CATEGORY_IDS");
    if (configured) {
      return configured
        .split(",")
        .map((value) => value.trim())
        .filter(Boolean);
    }

    return [
      "22", // Videovigilancia
      "26", // Redes e IT
      "30", // Energia / Herramientas
      "32", // Automatizacion e Intrusion
      "37", // Control de Acceso
      "38", // Deteccion de Fuego
      "65811", // Cableado Estructurado
      "66523", // Audio y Video Profesional
      "25", // Radiocomunicacion
      "27", // GPS
      "42", // Herramientas
      "66630", // Industria / BMS / Robots
      "65747", // Marketing
    ];
  }

  private getCatalogMaxRequests() {
    const rawValue = this.config.get<string>("SYSCOM_CATALOG_MAX_REQUESTS") ?? "0";
    if (rawValue.toLowerCase() === "all") return Number.POSITIVE_INFINITY;

    const configured = Number(rawValue);
    if (configured === 0) return Number.POSITIVE_INFINITY;
    return Number.isFinite(configured) && configured > 0 ? Math.floor(configured) : Number.POSITIVE_INFINITY;
  }

  private getCatalogConcurrency() {
    const configured = Number(this.config.get<string>("SYSCOM_CATALOG_CONCURRENCY") ?? 24);
    return Number.isFinite(configured) && configured > 0 ? Math.min(50, Math.floor(configured)) : 24;
  }

  private isConfigured() {
    return Boolean(this.config.get<string>("SYSCOM_CLIENT_ID") && this.config.get<string>("SYSCOM_CLIENT_SECRET"));
  }

  private buildSearchTerms(input: SyscomProductLookupInput) {
    const values = [input.clave, input.sku, ...this.extractModelCandidates(input.name ?? "")];
    const unique = new Map<string, string>();

    for (const value of values) {
      const cleanValue = this.cleanTerm(value);
      const normalized = this.normalizeCode(cleanValue);
      if (cleanValue.length >= 4 && normalized.length >= 4 && !/^\d+$/.test(normalized)) {
        unique.set(normalized, cleanValue);
      }
    }

    return [...unique.values()].slice(0, 8);
  }

  private extractModelCandidates(value: string) {
    const matches = value.match(/\b[A-Z0-9]{2,}(?:[-_/][A-Z0-9()]+){1,}\b/gi) ?? [];
    return matches.map((match) => match.replace(/[.,;:]+$/g, ""));
  }

  private scoreProductMatch(input: SyscomProductLookupInput, terms: string[], product: SyscomApiProduct): SyscomMatchedProduct {
    const model = product.modelo ?? "";
    const title = product.titulo ?? "";
    const brand = product.marca ?? "";
    const normalizedModel = this.normalizeCode(model);
    const normalizedTitle = this.normalizeCode(title);
    const normalizedBrand = this.normalizeText(brand);
    const inputBrand = this.normalizeText(input.brand ?? "");
    let score = 0;

    for (const term of terms) {
      const normalizedTerm = this.normalizeCode(term);
      if (!normalizedTerm || normalizedTerm.length < 4) continue;

      if (normalizedModel === normalizedTerm) score = Math.max(score, 120);
      if (normalizedModel.includes(normalizedTerm) && normalizedTerm.length >= 6) score = Math.max(score, 110);
      if (normalizedTerm.includes(normalizedModel) && normalizedModel.length >= 6) score = Math.max(score, 105);
      if (normalizedTitle.includes(normalizedTerm) && normalizedTerm.length >= 8) score = Math.max(score, 82);
    }

    if (inputBrand && normalizedBrand.includes(inputBrand)) score += 10;
    if (product.total_existencia && product.total_existencia > 0) score += 3;

    return {
      id: String(product.producto_id ?? ""),
      model,
      brand,
      title,
      stock: Number(product.total_existencia ?? 0),
      price: this.pickPrice(product),
      score,
    };
  }

  private mapCatalogProduct(product: SyscomApiProduct): SyscomCatalogProduct {
    return {
      id: String(product.producto_id ?? ""),
      model: product.modelo ?? "",
      brand: product.marca ?? "Syscom",
      title: product.titulo ?? product.modelo ?? "Producto Syscom",
      stock: Number(product.total_existencia ?? 0),
      price: this.pickPrice(product) ?? 0,
      category: this.pickCategory(product),
      image: this.pickImage(product),
      description: this.cleanDescription(product.descripcion ?? ""),
    };
  }

  private pickCategory(product: SyscomApiProduct) {
    const categories = product.categorias ?? [];
    const leaf = [...categories].sort((a, b) => Number(b.nivel ?? 0) - Number(a.nivel ?? 0))[0];
    return leaf?.nombre ? `Syscom / ${leaf.nombre}` : "Syscom / Catalogo";
  }

  private pickPrice(product: SyscomApiProduct) {
    const value = product.precios?.precio_descuento ?? product.precios?.precio_especial ?? product.precios?.precio_1 ?? product.precios?.precio_lista;
    if (!value) return null;
    const parsed = Number(value);
    return Number.isFinite(parsed) ? Math.round(parsed * this.usdToMxnRate * 100) / 100 : null;
  }

  private async refreshExchangeRate() {
    if (this.exchangeRateExpiresAt > Date.now() && this.usdToMxnRate > 1) return this.usdToMxnRate;

    try {
      const response = await this.request<SyscomExchangeRateResponse>("tipocambio");
      const rate = Number(response.normal);
      if (!Number.isFinite(rate) || rate <= 1) throw new Error("Syscom returned an invalid exchange rate");

      this.usdToMxnRate = rate;
      this.exchangeRateExpiresAt = Date.now() + 60 * 60 * 1000;
      return rate;
    } catch (error) {
      const fallback = Number(this.config.get<string>("SYSCOM_USD_MXN_FALLBACK") ?? 18);
      if (this.usdToMxnRate <= 1) this.usdToMxnRate = Number.isFinite(fallback) && fallback > 1 ? fallback : 18;
      this.exchangeRateExpiresAt = Date.now() + 5 * 60 * 1000;
      const message = error instanceof Error ? error.message : "Exchange rate unavailable";
      this.logger.warn(`Syscom exchange rate unavailable, using ${this.usdToMxnRate} MXN/USD: ${message}`);
      return this.usdToMxnRate;
    }
  }

  private pickImage(product: SyscomApiProduct) {
    const image = product.imagen ?? product.img_portada;
    if (!image) return undefined;
    if (image.startsWith("http")) return image;
    return `https://www.syscom.mx/${image.replace(/^\//, "")}`;
  }

  private cleanDescription(value: string) {
    return value
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<\/p>/gi, "\n")
      .replace(/<[^>]+>/g, " ")
      .replace(/&nbsp;/gi, " ")
      .replace(/&amp;/gi, "&")
      .replace(/&quot;/gi, "\"")
      .replace(/&#39;/gi, "'")
      .replace(/[ \t]+/g, " ")
      .replace(/\n\s+/g, "\n")
      .trim();
  }

  private cleanTechnicalHtml(value: string) {
    const withoutLinkedActions = value.replace(/<a\b[^>]*>[\s\S]*?<\/a>/gi, "");

    return sanitizeHtml(withoutLinkedActions, {
      allowedTags: [
        "section", "article", "div", "span", "p", "br", "hr",
        "h1", "h2", "h3", "h4", "h5",
        "strong", "b", "em", "i", "small",
        "ul", "ol", "li",
        "table", "thead", "tbody", "tr", "th", "td",
        "figure", "figcaption", "img",
      ],
      allowedAttributes: {
        "*": ["class", "style"],
        img: ["src", "alt", "title", "width", "height", "loading"],
        td: ["colspan", "rowspan"],
        th: ["colspan", "rowspan"],
      },
      allowedSchemes: ["https", "http"],
      allowedStyles: {
        "*": {
          color: [/^#[0-9a-f]{3,8}$/i, /^rgb\(/i, /^[a-z]+$/i],
          "background-color": [/^#[0-9a-f]{3,8}$/i, /^rgba?\(/i, /^transparent$/i],
          "text-align": [/^(left|right|center|justify)$/],
          "font-size": [/^\d+(\.\d+)?(px|rem|em|%)$/],
          "font-weight": [/^(normal|bold|[1-9]00)$/],
          width: [/^\d+(\.\d+)?(px|%|rem|em|vw)$/],
          "max-width": [/^\d+(\.\d+)?(px|%|rem|em|vw)$/],
          height: [/^\d+(\.\d+)?(px|%|rem|em|vh|auto)$/],
          margin: [/^[\d.\s%-]+(px|rem|em|%)?$/],
          padding: [/^[\d.\s%-]+(px|rem|em|%)?$/],
          border: [/^[\w\s#(),.%/-]+$/],
          "border-radius": [/^\d+(\.\d+)?(px|rem|em|%)$/],
          display: [/^(block|inline|inline-block|flex|grid)$/],
          "flex-direction": [/^(row|row-reverse|column|column-reverse)$/],
          "flex-wrap": [/^(nowrap|wrap|wrap-reverse)$/],
          "align-items": [/^(stretch|center|flex-start|flex-end|baseline)$/],
          "align-content": [/^(stretch|center|flex-start|flex-end|space-between|space-around|space-evenly)$/],
          "justify-content": [/^(center|flex-start|flex-end|space-between|space-around|space-evenly)$/],
          "line-height": [/^(normal|\d+(\.\d+)?(px|rem|em|%)?)$/],
          "box-sizing": [/^border-box$/],
          gap: [/^\d+(\.\d+)?(px|rem|em)$/],
          "grid-template-columns": [/^[\w\s().,%/-]+$/],
        },
      },
      transformTags: {
        img: (_tagName, attributes) => ({
          tagName: "img",
          attribs: {
            ...attributes,
            src: this.normalizeMediaUrl(attributes.src ?? ""),
            loading: "lazy",
          },
        }),
      },
      exclusiveFilter: (frame) =>
        frame.tag === "img" && !frame.attribs.src,
    });
  }

  private normalizeMediaUrl(value: string) {
    const clean = value.trim();
    if (!clean || /\.(mp4|webm|mov|avi)(?:\?|$)/i.test(clean) || /(?:youtube|youtu\.be|vimeo)/i.test(clean)) return "";
    if (clean.startsWith("//")) return `https:${clean}`;
    if (clean.startsWith("http://")) return `https://${clean.slice(7)}`;
    if (clean.startsWith("/")) return `https://www.syscom.mx${clean}`;
    return clean;
  }

  private cleanTerm(value?: string) {
    return (value ?? "").replace(/\s+/g, " ").trim();
  }

  private normalizeCode(value: string) {
    return this.cleanTerm(value)
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, "");
  }

  private normalizeText(value: string) {
    return this.cleanTerm(value)
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase();
  }

  private async getAccessToken() {
    const now = Date.now();
    if (this.accessToken && now < this.accessTokenExpiresAt) {
      return this.accessToken;
    }

    const clientId = this.config.get<string>("SYSCOM_CLIENT_ID");
    const clientSecret = this.config.get<string>("SYSCOM_CLIENT_SECRET");
    if (!clientId || !clientSecret) {
      throw new Error("Syscom credentials missing");
    }

    const body = new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: "client_credentials",
    });

    const response = await fetch("https://developers.syscom.mx/oauth/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body,
    });

    if (!response.ok) {
      throw new Error(`Syscom OAuth failed with ${response.status}`);
    }

    const token = (await response.json()) as SyscomTokenResponse;
    if (!token.access_token) {
      throw new Error("Syscom OAuth did not return an access token");
    }

    const expiresInSeconds = Math.max(60, Number(token.expires_in ?? 3600) - 60);
    this.accessToken = token.access_token;
    this.accessTokenExpiresAt = Date.now() + expiresInSeconds * 1000;
    return this.accessToken;
  }

  private async request<T = unknown>(path: string): Promise<T> {
    const token = await this.getAccessToken();
    const baseUrl = this.config.get<string>("SYSCOM_API_BASE_URL") ?? "https://developers.syscom.mx/api/v1";
    const response = await fetch(`${baseUrl.replace(/\/$/, "")}/${path.replace(/^\//, "")}`, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
      },
      signal: AbortSignal.timeout(30_000),
    });

    if (!response.ok) {
      throw new Error(`Syscom API failed with ${response.status}`);
    }

    return (await response.json()) as T;
  }
}
