import { Injectable, Logger } from "@nestjs/common";
import { promises as fs } from "fs";
import * as path from "path";
import { CacheService } from "../common/cache.service";
import { OdooProduct, OdooService } from "../odoo/odoo.service";
import { SyscomCatalogProduct, SyscomService } from "../syscom/syscom.service";

type AdvisorProduct = {
  name: string;
  sku: string;
  model: string;
  brand: string;
  category: string;
  price: number;
  stock: number;
  image?: string;
};

export type CatalogProductsResult = {
  products: OdooProduct[];
  status: "odoo" | "unavailable";
  message?: string;
};

export type CatalogProductResult = {
  product: OdooProduct | null;
  status: "odoo" | "unavailable";
  message?: string;
};

export type CatalogProductsPageQuery = {
  search?: string;
  brand?: string;
  category?: string;
  onlyStock?: boolean;
  sort?: "price-asc" | "price-desc" | "name-asc" | "stock-desc";
  limit?: number;
  offset?: number;
};

export type CatalogProductsPageResult = CatalogProductsResult & {
  total: number;
  brands: string[];
  categories: string[];
};

export type CatalogWarehouseAvailability = {
  id: "wcam" | "tvc" | "syscom";
  label: string;
  stock: number | null;
  status: "active" | "pending" | "unconfigured" | "error";
  price?: number | null;
  externalId?: string;
  matchedModel?: string;
  message?: string;
};

type CatalogProductSource = OdooProduct & {
  source?: "odoo" | "syscom" | "merged";
  syscomId?: string;
  syscomModel?: string;
  syscomStock?: number;
  wcamStock?: number;
};

@Injectable()
export class CatalogService {
  private readonly logger = new Logger(CatalogService.name);
  private fullCatalogBuild?: Promise<void>;
  private fullCatalogMemory: CatalogProductSource[] | null = null;
  private readonly pageCache = new Map<string, { expiresAt: number; result: CatalogProductsPageResult }>();
  private readonly cameraPriorityCache = new Map<string, number>();

  constructor(
    private readonly cache: CacheService,
    private readonly odoo: OdooService,
    private readonly syscom: SyscomService,
  ) {}

  async findProducts(): Promise<OdooProduct[]> {
    const result = await this.findProductsResult();
    return result.products;
  }

  async findProductsResult(): Promise<CatalogProductsResult> {
    const cacheKey = "catalog:products:all:v13";
    if (this.fullCatalogMemory) {
      return { products: this.fullCatalogMemory, status: "odoo" };
    }

    const cached = await this.cache.getJson<CatalogProductSource[]>(cacheKey);

    if (cached) {
      this.fullCatalogMemory = cached;
      return { products: cached, status: "odoo" };
    }

    const fileCached = await this.readFullCatalogFile();
    if (fileCached) {
      this.fullCatalogMemory = fileCached;
      await this.cache.setJson(cacheKey, fileCached, 24 * 60 * 60);
      return { products: fileCached, status: "odoo" };
    }

    try {
      const baseCacheKey = "catalog:products:odoo-base:v13";
      const cachedBase = await this.cache.getJson<CatalogProductSource[]>(baseCacheKey);
      const lightweightProducts =
        cachedBase ??
        (await this.odoo.getProducts()).map((product) => ({
          ...product,
          image: `/api/catalog/products/${product.id}/image`,
          source: "odoo" as const,
          wcamStock: product.stock,
          syscomStock: 0,
        }));

      if (!cachedBase) {
        await this.cache.setJson(baseCacheKey, lightweightProducts, 900);
      }

      this.startFullCatalogBuild(lightweightProducts, cacheKey);
      return {
        products: lightweightProducts,
        status: "odoo",
        message: "Catalogo Syscom completo cargandose en segundo plano.",
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Odoo catalog unavailable";
      this.logger.warn(`Catalog products unavailable: ${message}`);
      return { products: [], status: "unavailable", message };
    }
  }

  async findProductsPageResult(query: CatalogProductsPageQuery): Promise<CatalogProductsPageResult> {
    const pageCacheKey = JSON.stringify({
      search: query.search?.trim() ?? "",
      brand: query.brand ?? "",
      category: query.category ?? "",
      onlyStock: Boolean(query.onlyStock),
      sort: query.sort ?? "price-asc",
      limit: Math.min(Math.max(Number(query.limit ?? 60), 1), 120),
      offset: Math.max(Number(query.offset ?? 0), 0),
    });
    const pageCached = this.pageCache.get(pageCacheKey);
    if (pageCached && pageCached.expiresAt > Date.now()) {
      return pageCached.result;
    }

    const result = await this.findProductsResult();
    const products = result.products as CatalogProductSource[];
    const search = query.search?.trim() ?? "";
    const brand = query.brand && query.brand !== "Todas" ? query.brand : "";
    const category = query.category && query.category !== "Todas" ? query.category : "";
    const sort = query.sort ?? "price-asc";
    const limit = Math.min(Math.max(Number(query.limit ?? 60), 1), 120);
    const offset = Math.max(Number(query.offset ?? 0), 0);
    const hasSearch = this.searchTokens(search).length > 0;

    const brands = ["Todas", ...Array.from(new Set(products.map((product) => product.brand || "Worldcam"))).sort()];
    const categories = ["Todas", ...Array.from(new Set(products.map((product) => product.category || "Sin categoria"))).sort()];

    const scoredProducts = products.flatMap((product) => {
      if (brand && product.brand !== brand) return [];
      if (category && product.category !== category) return [];
      if (query.onlyStock && Number(product.stock ?? 0) <= 0) return [];

      const score = this.productSearchScore(product, search);
      if (hasSearch && score <= 0) return [];
      return [{
        product,
        score,
        cameraPriority: hasSearch ? 0 : this.cachedCameraPriority(product),
        hasImage: Number(Boolean(product.image)),
        price: Number(product.price ?? 0),
        stock: Number(product.stock ?? 0),
      }];
    });

    scoredProducts.sort((a, b) => {
      if (hasSearch && b.score !== a.score) return b.score - a.score;
      if (!hasSearch) {
        const cameraSort = b.cameraPriority - a.cameraPriority;
        if (cameraSort !== 0) return cameraSort;

        const imagePriority = b.hasImage - a.hasImage;
        if (imagePriority !== 0) return imagePriority;
      }
      if (sort === "price-desc") return b.price - a.price;
      if (sort === "name-asc") return a.product.name.localeCompare(b.product.name);
      if (sort === "stock-desc") return b.stock - a.stock;
      return a.price - b.price;
    });

    const pageResult = {
      products: scoredProducts.slice(offset, offset + limit).map((item) => item.product),
      total: scoredProducts.length,
      brands,
      categories,
      status: result.status,
      message: result.message,
    };
    this.pageCache.set(pageCacheKey, { expiresAt: Date.now() + 60_000, result: pageResult });
    return pageResult;
  }

  private searchTokens(value: string) {
    return this.normalizeSearch(value)
      .split(" ")
      .map((token) => this.normalizeSearchToken(token))
      .filter((token) => token.length > 1);
  }

  private normalizeSearch(value: string) {
    return value
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, " ")
      .trim();
  }

  private normalizeSearchToken(token: string) {
    const aliases: Record<string, string> = {
      cam: "camara",
      cams: "camara",
      camera: "camara",
      cameras: "camara",
      camar: "camara",
      camaras: "camara",
      hik: "hikvision",
      hikvison: "hikvision",
      hicvision: "hikvision",
      hickvision: "hikvision",
      hkv: "hikvision",
      dahu: "dahua",
      dehua: "dahua",
    };
    return aliases[token] ?? token;
  }

  private productSearchScore(product: CatalogProductSource, query: string) {
    const tokens = this.searchTokens(query);
    if (!tokens.length) return 1;

    const name = this.normalizeSearch(product.name);
    const category = this.normalizeSearch(product.category);
    const brand = this.normalizeSearch(product.brand);
    const sku = this.normalizeSearch(product.sku);
    const clave = this.normalizeSearch(product.clave);
    const text = `${name} ${category} ${brand} ${sku} ${clave}`;
    let score = 0;

    for (const token of tokens) {
      const candidates = this.expandSearchToken(token);
      const matched = candidates.some((candidate) => text.includes(candidate));
      if (!matched) return -1;

      for (const candidate of candidates) {
        if (sku === candidate || clave === candidate) score += 120;
        else if (sku.includes(candidate) || clave.includes(candidate)) score += 80;
        if (name.startsWith(candidate)) score += 70;
        else if (name.includes(candidate)) score += 45;
        if (category.includes(candidate)) score += 28;
        if (brand.includes(candidate)) score += 24;
      }
    }

    if (tokens.includes("camara")) score += this.cameraPriority(product) * 45;
    if (Number(product.stock ?? 0) > 0) score += 4;
    return score;
  }

  private expandSearchToken(token: string) {
    const synonyms: Record<string, string[]> = {
      camara: ["camara", "camera", "camaras", "ipc", "ptz", "bullet", "domo", "dome", "turret", "cctv", "videovigilancia"],
      fuente: ["fuente", "power", "adaptador", "cargador"],
      hikvision: ["hikvision", "hik", "hik connect", "hikconnect", "hilook"],
      nvr: ["nvr", "grabador", "recorder"],
      dvr: ["dvr", "grabador", "recorder"],
    };
    return synonyms[token] ?? [token];
  }

  private cameraPriority(product: CatalogProductSource) {
    const name = this.normalizeSearch(product.name);
    const category = this.normalizeSearch(product.category);
    const nonCameraProduct =
      /\b(gps|localizador|rastreador|dvr|nvr|xvr|servidor|server|switch|fuente|power|adaptador|cargador|cable|conector|conectores|conexion|conexiones|jack|divisor|bracket|soporte|montaje|base|brazo|caja|cajas|compatible|disco|hdd|ssd|monitor|teclado|mouse|microfono|sirena|sensor|control|ups|gabinete|rack)\b/.test(name);
    if (nonCameraProduct) return 0;

    const cameraName = /^(camara|camera|camaras)\b/.test(name);
    const cameraModel = /\b(dh ?ipc|ipc|ez ?ipc|ds ?2c|ds ?2d|ptz|bullet|domo|dome|turret|eyeball)\b/.test(name);
    const cameraFormFactor = /\b(lente|mp|megapixel|wizcolor|colorvu|acuface|acusense|ir)\b/.test(name);
    const cameraCategory = /\b(videovigilancia|cctv|camara|camaras)\b/.test(category);

    if (cameraName && cameraModel) return 5;
    if (cameraName) return 4;
    if (cameraModel) return 3;
    if (cameraCategory && cameraFormFactor) return 2;
    return 0;
  }

  private cachedCameraPriority(product: CatalogProductSource) {
    const key = String(product.variantId ?? product.id ?? product.sku ?? product.name);
    const cached = this.cameraPriorityCache.get(key);
    if (cached !== undefined) return cached;

    const priority = this.cameraPriority(product);
    this.cameraPriorityCache.set(key, priority);
    return priority;
  }

  private startFullCatalogBuild(baseProducts: CatalogProductSource[], cacheKey: string) {
    if (this.fullCatalogBuild) return;

    this.fullCatalogBuild = (async () => {
      const startedAt = Date.now();
      try {
        this.logger.log("Building full catalog with Syscom products...");
        const syscomProducts = await this.syscom.getCatalogProducts();
        const mergedProducts = this.mergeSyscomCatalog(baseProducts, syscomProducts);
        this.fullCatalogMemory = mergedProducts;
        await this.cache.setJson(cacheKey, mergedProducts, 24 * 60 * 60);
        await this.writeFullCatalogFile(mergedProducts);
        this.logger.log(`Full catalog ready: ${mergedProducts.length} products in ${Date.now() - startedAt}ms`);
      } catch (error) {
        const message = error instanceof Error ? error.message : "Syscom catalog build failed";
        this.logger.warn(`Full catalog build failed: ${message}`);
      } finally {
        this.fullCatalogBuild = undefined;
      }
    })();
  }

  private fullCatalogFilePath() {
    return path.join(process.cwd(), ".cache", "catalog-products-all-v13.json");
  }

  private async readFullCatalogFile() {
    try {
      const raw = await fs.readFile(this.fullCatalogFilePath(), "utf8");
      const products = JSON.parse(raw) as CatalogProductSource[];
      return Array.isArray(products) && products.length > 0 ? products : null;
    } catch {
      return null;
    }
  }

  private async writeFullCatalogFile(products: CatalogProductSource[]) {
    try {
      const filePath = this.fullCatalogFilePath();
      await fs.mkdir(path.dirname(filePath), { recursive: true });
      await fs.writeFile(filePath, JSON.stringify(products), "utf8");
    } catch (error) {
      const message = error instanceof Error ? error.message : "File cache unavailable";
      this.logger.warn(`Full catalog file cache unavailable: ${message}`);
    }
  }

  private mergeSyscomCatalog(odooProducts: OdooProduct[], syscomProducts: SyscomCatalogProduct[]): CatalogProductSource[] {
    const products: CatalogProductSource[] = odooProducts.map((product) => ({
      ...product,
      source: "odoo" as const,
      wcamStock: product.stock,
      syscomStock: 0,
    }));
    const byModel = new Map<string, CatalogProductSource>();

    for (const product of products) {
      for (const key of this.productModelKeys(product)) {
        if (!byModel.has(key)) byModel.set(key, product);
      }
    }

    for (const syscomProduct of syscomProducts) {
      const syscomKey = this.normalizeModelKey(syscomProduct.model);
      if (!syscomKey) continue;

      const existing = byModel.get(syscomKey);
      if (existing) {
        existing.stock = Number(existing.stock ?? 0) + syscomProduct.stock;
        existing.source = "merged";
        existing.syscomId = syscomProduct.id;
        existing.syscomModel = syscomProduct.model;
        existing.syscomStock = syscomProduct.stock;
        if (!existing.price && syscomProduct.price) existing.price = syscomProduct.price;
        continue;
      }

      products.push({
        id: -Number(syscomProduct.id || products.length + 1),
        variantId: -Number(syscomProduct.id || products.length + 1),
        sku: syscomProduct.model || syscomProduct.id,
        clave: syscomProduct.model || syscomProduct.id,
        name: `${syscomProduct.brand} ${syscomProduct.model} ${syscomProduct.title}`.replace(/\s+/g, " ").trim(),
        stock: syscomProduct.stock,
        price: syscomProduct.price,
        category: syscomProduct.category,
        brand: syscomProduct.brand || "Syscom",
        image: syscomProduct.image,
        description: syscomProduct.title,
        source: "syscom",
        syscomId: syscomProduct.id,
        syscomModel: syscomProduct.model,
        syscomStock: syscomProduct.stock,
        wcamStock: 0,
      });
    }

    return products;
  }

  private productModelKeys(product: Pick<OdooProduct, "name" | "sku" | "clave">) {
    const values = [product.clave, product.sku, ...this.extractModelCandidates(product.name)];
    return values.map((value) => this.normalizeModelKey(value)).filter(Boolean);
  }

  private extractModelCandidates(value: string) {
    return value.match(/\b[A-Z0-9]{2,}(?:[-_/][A-Z0-9()]+){1,}\b/gi) ?? [];
  }

  private normalizeModelKey(value?: string) {
    return (value ?? "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, "");
  }

  async findProductResult(productId: string): Promise<CatalogProductResult> {
    try {
      const products = await this.findProducts();
      const summary = products.find((product) => {
        const catalogProduct = product as CatalogProductSource;
        const syscomId = catalogProduct.syscomId ? String(catalogProduct.syscomId) : "";
        const normalizedProductId = productId.replace(/^-/, "");
        return (
          String(product.id) === productId ||
          String(Math.abs(Number(product.id))) === normalizedProductId ||
          String(product.variantId) === productId ||
          syscomId === normalizedProductId ||
          product.sku === productId ||
          product.clave === productId
        );
      });

      if (!summary?.id) {
        const numericProductId = Number(productId);
        if (Number.isFinite(numericProductId) && numericProductId > 0) {
          const directProduct = await this.odoo.getProductDetail(numericProductId);
          if (directProduct) {
            return { product: directProduct, status: "odoo" };
          }
        }
        return { product: null, status: "odoo", message: "Product not found" };
      }

      const catalogSummary = summary as CatalogProductSource;
      if (catalogSummary.source === "syscom") {
        return { product: catalogSummary, status: "odoo" };
      }

      const cacheKey = `catalog:products:detail:v3:${summary.id}`;
      const cached = await this.cache.getJson<OdooProduct>(cacheKey);
      if (cached) {
        return { product: cached, status: "odoo" };
      }

      const product = await this.odoo.getProductDetail(summary.id);
      if (!product) {
        return { product: null, status: "odoo", message: "Product not found" };
      }
      await this.cache.setJson(cacheKey, product, 900);
      return { product, status: "odoo" };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Odoo product unavailable";
      this.logger.warn(`Catalog product unavailable: ${message}`);
      return { product: null, status: "unavailable", message };
    }
  }

  async findProductImage(productId: string): Promise<Buffer | null> {
    const numericProductId = Number(productId);
    if (!Number.isFinite(numericProductId)) return null;

    const cacheKey = `catalog:products:image:v1:${numericProductId}`;
    const cached = await this.cache.getJson<string>(cacheKey);
    if (cached) {
      return Buffer.from(cached, "base64");
    }

    const image = await this.odoo.getProductImage(numericProductId);
    if (!image) return null;

    await this.cache.setJson(cacheKey, image.toString("base64"), 3600);
    return image;
  }

  async getOdooStatus() {
    return this.odoo.getConnectionStatus();
  }

  async getSyscomStatus() {
    return this.syscom.getConnectionStatus();
  }

  async findWarehouseAvailability(productId: string): Promise<CatalogWarehouseAvailability[]> {
    const productResult = await this.findProductResult(productId);
    const product = productResult.product as CatalogProductSource | null;
    const wcamStock = product?.wcamStock ?? product?.stock ?? 0;
    const syscomMatch = product
      ? product.source === "syscom" || product.source === "merged"
        ? {
            status: "matched" as const,
            product: {
              id: product.syscomId ?? "",
              model: product.syscomModel ?? product.clave,
              brand: product.brand,
              title: product.description ?? product.name,
              stock: product.syscomStock ?? 0,
              price: product.source === "syscom" ? product.price : null,
              score: 120,
            },
          }
        : { status: "not_found" as const, message: "Este producto no esta combinado con Syscom en el catalogo actual." }
      : { status: "not_found" as const, message: "Producto no encontrado en Odoo." };

    return [
      {
        id: "wcam",
        label: "Almacen Wcam",
        stock: wcamStock,
        status: "active",
        message: `${wcamStock} unidades disponibles de este producto.`,
      },
      {
        id: "tvc",
        label: "Almacen TVC",
        stock: null,
        status: "pending",
        message: "Pendiente por conectar.",
      },
      this.toSyscomWarehouse(syscomMatch),
    ];
  }

  private toSyscomWarehouse(syscomMatch: Awaited<ReturnType<SyscomService["findMatchingProduct"]>>): CatalogWarehouseAvailability {
    if (syscomMatch.status === "matched" && syscomMatch.product) {
      const product = syscomMatch.product;
      const priceLabel = product.price !== null ? ` Precio Syscom: $${product.price.toFixed(2)} USD.` : "";
      return {
        id: "syscom",
        label: "Almacen Syscom",
        stock: product.stock,
        status: "active",
        price: product.price,
        externalId: product.id,
        matchedModel: product.model,
        message: `Coincide con ${product.brand} ${product.model}.${priceLabel}`,
      };
    }

    return {
      id: "syscom",
      label: "Almacen Syscom",
      stock: null,
      status: syscomMatch.status === "unconfigured" ? "unconfigured" : syscomMatch.status === "error" ? "error" : "pending",
      message: syscomMatch.message,
    };
  }

  async answerAdvisorChat(message: string, contextProducts?: unknown[]) {
    const question = message.trim();
    if (!question) {
      return {
        answer: "Cuentame que necesitas instalar o que producto buscas y reviso el catalogo de Worldcam.",
        products: [],
      };
    }

    const normalized = this.normalize(question);
    if (!this.isAllowedTopic(normalized)) {
      if (this.isGenericAssistantQuestion(normalized)) {
        return {
          answer: [
            "Puedo ayudarte como asesor de Worldcam en temas de seguridad electronica, camaras, DVR/NVR, redes, almacenamiento, energia solar, instalacion y soporte tecnico.",
            "Puedo hacer diagnostico de necesidades, explicar conceptos, comparar opciones, armar kits base, estimar grabacion/PoE y detectar cuando conviene pasarte con ventas por WhatsApp.",
            "No respondo temas fuera de ese giro.",
          ].join("\n"),
          products: [],
        };
      }

      return {
        answer: "Solo puedo ayudarte con productos tecnologicos, camaras, redes, seguridad, energia solar y soluciones de Worldcam.",
        products: [],
      };
    }

    if (this.isWhatsAppHandoffQuestion(normalized)) {
      return {
        answer: [
          "Puedo ayudarte con informacion general, pero esto ya requiere una cotizacion personalizada o una solucion a medida.",
          "Un asesor de Worldcam puede revisar cantidades, ubicacion, accesorios, disponibilidad, envio, instalacion y precio final contigo por WhatsApp.",
          "Te recomiendo mandar el contexto del proyecto: tipo de lugar, numero de camaras, areas a cubrir, presupuesto y si quieres verlo desde celular.",
        ].join("\n"),
        products: [],
        handoff: true,
      };
    }

    const products = await this.findProducts();
    const exactProductMatches = this.findExactLookupProducts(products, normalized);
    if (exactProductMatches.length) {
      const exactProducts = exactProductMatches.slice(0, 2).map((product) => this.toAdvisorProduct(product));
      return {
        answer: this.formatProductAnswer("Te dejo la ficha encontrada en el catalogo de Worldcam:", exactProducts),
        products: exactProducts,
      };
    }

    const context = this.parseContextProducts(contextProducts);
    if (this.isContextFollowUp(normalized) && context.length) {
      return this.answerContextFollowUp(products, normalized, context);
    }

    const technical = this.answerTechnicalSupport(products, normalized);
    if (technical) {
      return technical;
    }

    const definition = this.answerDefinition(normalized);
    if (definition) {
      const related = this.searchAdvisorProducts(products, normalized).slice(0, 4).map((product) => this.toAdvisorProduct(product));
      return { answer: definition, products: related };
    }

    if (this.isPackageRequest(normalized)) {
      return this.answerPackageRequest(products, normalized);
    }

    const matches = this.searchAdvisorProducts(products, normalized).slice(0, 5);
    if (matches.length === 0) {
      return {
        answer: this.answerFreeAdvisorFallback(normalized),
        products: [],
      };
    }

    const topProducts = matches.map((product) => this.toAdvisorProduct(product));
    const intro = this.isProductDetailQuestion(normalized)
      ? "Te dejo la ficha encontrada en el catalogo de Worldcam:"
      : this.isPriceQuestion(normalized)
        ? "Estos son precios encontrados en el catalogo de Worldcam:"
        : "Encontre opciones del catalogo de Worldcam que pueden servirte:";

    return {
      answer: this.formatProductAnswer(intro, topProducts),
      products: topProducts,
    };
  }

  private answerDefinition(normalizedQuestion: string) {
    const isDefinition =
      normalizedQuestion.includes("que es") ||
      normalizedQuestion.includes("para que sirve") ||
      normalizedQuestion.includes("diferencia") ||
      normalizedQuestion.includes("como funciona");

    if (!isDefinition) return null;

    if (normalizedQuestion.includes("nvr")) {
      return [
        "Un NVR es un grabador de video en red para camaras IP.",
        "Se usa cuando las camaras trabajan por red, normalmente con cable UTP, switch PoE o puertos PoE integrados.",
        "Sirve para grabar, administrar canales, ver remotamente y guardar evidencia en disco duro.",
        "Para elegirlo hay que validar: numero de canales, resolucion de camaras, capacidad de disco, ancho de banda y si necesitas PoE.",
      ].join("\n");
    }

    if (normalizedQuestion.includes("dvr") || normalizedQuestion.includes("xvr")) {
      return [
        "Un DVR/XVR es un grabador para camaras analogicas HD como HDCVI, HDTVI, AHD o CVBS.",
        "Muchos XVR tambien aceptan algunas camaras IP, dependiendo del modelo.",
        "Para elegirlo hay que validar canales, resolucion soportada, tipo de camara, disco duro y salida HDMI/VGA.",
      ].join("\n");
    }

    if (normalizedQuestion.includes("poe")) {
      return [
        "PoE significa energia por cable de red.",
        "Permite alimentar camaras IP usando el mismo cable UTP que transmite datos.",
        "Necesitas camaras compatibles PoE y un NVR PoE o switch PoE con potencia suficiente.",
      ].join("\n");
    }

    if (normalizedQuestion.includes("disco") || normalizedQuestion.includes("hdd")) {
      return [
        "Para videovigilancia se recomienda disco duro de vigilancia, no disco comun de computadora.",
        "La capacidad depende de cantidad de camaras, resolucion, fps, compresion y dias de grabacion requeridos.",
        "Si me dices cuantas camaras y cuantos dias quieres grabar, puedo buscar opciones en catalogo.",
      ].join("\n");
    }

    return null;
  }

  private answerContextFollowUp(products: OdooProduct[], normalizedQuestion: string, contextProducts: AdvisorProduct[]) {
    const referenced = contextProducts[0];
    const referencedText = this.normalize([referenced.name, referenced.model, referenced.sku, referenced.brand, referenced.category].join(" "));

    if (normalizedQuestion.includes("dvr") || normalizedQuestion.includes("nvr") || normalizedQuestion.includes("grabador") || normalizedQuestion.includes("compatible")) {
      const isIpCamera =
        referencedText.includes(" ip ") ||
        referencedText.includes("ipc") ||
        referencedText.includes("poe") ||
        referenced.model.toLowerCase().startsWith("dh-ipc") ||
        referenced.model.toLowerCase().startsWith("ds-2cd");
      const isAnalogCamera =
        referencedText.includes("hdcvi") ||
        referencedText.includes("analog") ||
        referencedText.includes("cooper") ||
        referenced.model.toLowerCase().startsWith("dh-hac") ||
        referenced.model.toLowerCase().startsWith("ds-2ce");
      const recorderQuery = isIpCamera ? "nvr poe 8 canales" : isAnalogCamera ? "dvr xvr 8 canales" : "dvr xvr nvr 8 canales";
      const recorders = this.searchAdvisorProducts(products, recorderQuery).slice(0, 5).map((product) => this.toAdvisorProduct(product));
      const recorderType = isIpCamera ? "NVR" : isAnalogCamera ? "DVR/XVR" : "DVR/XVR o NVR, segun la tecnologia exacta";

      return {
        answer: [
          `Tomo como referencia esta camara: ${referenced.name}.`,
          `Para esa camara buscaria ${recorderType}.`,
          isIpCamera
            ? "Como parece ser camara IP/PoE, valida que el NVR soporte su resolucion, canales, ancho de banda, protocolo/ONVIF y PoE si quieres alimentarla por cable de red."
            : isAnalogCamera
              ? "Como parece ser camara analogica/HDCVI, valida que el DVR/XVR soporte su tecnologia, resolucion, audio si aplica y formato de video."
              : "No puedo confirmar solo con el contexto si es IP o analogica. Valida el modelo exacto antes de comprar grabador.",
          "Tambien revisa cantidad de camaras futuras y disco duro para los dias de grabacion que necesitas.",
        ].join("\n"),
        products: recorders,
      };
    }

    if (normalizedQuestion.includes("porque") || normalizedQuestion.includes("por que")) {
      return {
        answer: [
          `La recomendacion anterior se baso en este producto: ${referenced.name}.`,
          `Modelo: ${referenced.model || "sin modelo confirmado"} | SKU: ${referenced.sku || "sin SKU confirmado"} | Precio catalogo: ${this.money(referenced.price)} | Stock: ${referenced.stock}.`,
          "Para decir si es la mejor opcion necesito saber distancia, interior/exterior, grabacion, audio y presupuesto.",
        ].join("\n"),
        products: contextProducts.slice(0, 3),
      };
    }

    return {
      answer: [
        `Sigo tomando como referencia: ${referenced.name}.`,
        "Puedo ayudarte a validar compatibilidad, grabador, fuente, cableado, almacenamiento o alternativas.",
        "Dime que quieres revisar de ese producto: DVR/NVR compatible, alcance, audio, instalacion, precio o accesorios.",
      ].join("\n"),
      products: contextProducts.slice(0, 3),
    };
  }

  private isContextFollowUp(normalizedQuestion: string) {
    return (
      normalizedQuestion.includes("esa camara") ||
      normalizedQuestion.includes("esta camara") ||
      normalizedQuestion.includes("ese producto") ||
      normalizedQuestion.includes("este producto") ||
      normalizedQuestion.includes("esa opcion") ||
      normalizedQuestion.includes("esta opcion") ||
      normalizedQuestion.includes("el anterior") ||
      normalizedQuestion.includes("la anterior") ||
      normalizedQuestion.includes("de esa") ||
      normalizedQuestion.includes("de ese")
    );
  }

  private parseContextProducts(value: unknown): AdvisorProduct[] {
    if (!Array.isArray(value)) return [];

    return value
      .map((item) => {
        if (!item || typeof item !== "object") return null;
        const product = item as Partial<AdvisorProduct>;
        const parsed: AdvisorProduct = {
          name: String(product.name ?? ""),
          sku: String(product.sku ?? ""),
          model: String(product.model ?? ""),
          brand: String(product.brand ?? ""),
          category: String(product.category ?? ""),
          price: Number(product.price ?? 0),
          stock: Number(product.stock ?? 0),
          image: typeof product.image === "string" ? product.image : "",
        };
        return parsed;
      })
      .filter((product): product is AdvisorProduct => Boolean(product?.name || product?.model || product?.sku))
      .slice(0, 5);
  }

  private answerFreeAdvisorFallback(normalizedQuestion: string) {
    const intent = this.detectAdvisorIntent(normalizedQuestion);

    if (intent === "sales") {
      return [
        "Te puedo orientar comercialmente, pero no debo inventar precio, stock, garantia, envio o descuento si no aparece confirmado en catalogo.",
        "Dime el modelo, SKU o el tipo de solucion que buscas y te ayudo a ubicar opciones.",
        "Si ya necesitas cotizacion formal, proyecto o instalacion, conviene pasarlo con un asesor por WhatsApp.",
      ].join("\n");
    }

    if (intent === "support") {
      return [
        "Lo revisamos como soporte tecnico. Para diagnosticar bien necesito algunos datos:",
        "1. Que equipo falla: camara, DVR/NVR, router, switch, disco o fuente?",
        "2. Marca y modelo si lo tienes.",
        "3. Que sintoma aparece: sin imagen, offline, no graba, se reinicia, no detecta, imagen congelada o mala calidad?",
        "4. Ya probaste otro cable, puerto, fuente o reinicio?",
        "Con eso puedo guiarte paso a paso sin adivinar.",
      ].join("\n");
    }

    if (intent === "network") {
      return [
        "Para redes puedo ayudarte a elegir router, switch, access point, antena o enlace, pero necesito contexto.",
        "Dime metros cuadrados, numero de pisos, cantidad de usuarios/equipos, si tienes fibra optica y si necesitas cobertura interior, exterior o entre edificios.",
        "Si tambien vas a conectar camaras IP, hay que calcular puertos, PoE, ancho de banda y cableado.",
      ].join("\n");
    }

    if (intent === "solar") {
      return [
        "Para energia solar o sitio sin electricidad, la recomendacion depende del consumo y autonomia.",
        "Necesito saber cuantas camaras, si habra router/NVR, watts aproximados, horas de sol, dias de respaldo y si debe funcionar 24/7.",
        "Con esos datos se dimensiona panel, bateria, controlador, protecciones y gabinete.",
      ].join("\n");
    }

    if (intent === "installation") {
      return [
        "Para instalacion puedo orientarte con una lista base, pero depende de si sera IP/PoE o analogico.",
        "Normalmente se valida: camaras, grabador, disco, cableado, conectores, fuente o switch PoE, gabinete/proteccion, monitor para configuracion y acceso a internet si quieres ver desde celular.",
        "Dime cuantas camaras, interior/exterior, distancia aproximada de cable y dias de grabacion.",
      ].join("\n");
    }

    return [
      "Si, te puedo ayudar como asesor tecnico de Worldcam dentro de seguridad, camaras, DVR/NVR, redes, cableado, almacenamiento, energia solar e instalacion.",
      "Para darte una respuesta util necesito un poco mas de contexto: que quieres proteger, cuantas areas son, si es interior/exterior, si tienes internet/electricidad y tu presupuesto aproximado.",
      "Si me das esos datos, te puedo recomendar una solucion base y despues buscar productos del catalogo.",
    ].join("\n");
  }

  private detectAdvisorIntent(normalizedQuestion: string) {
    if (["precio", "existencia", "stock", "descuento", "mayoreo", "envio", "garantia", "factura", "cotizacion"].some((term) => normalizedQuestion.includes(term))) return "sales";
    if (["falla", "no funciona", "no prende", "no se ve", "offline", "contrasena", "contraseña", "reinicia", "no graba", "soporte"].some((term) => normalizedQuestion.includes(term))) return "support";
    if (["router", "wifi", "switch", "access point", "antena", "fibra", "red", "internet"].some((term) => normalizedQuestion.includes(term))) return "network";
    if (["solar", "panel", "bateria", "electricidad", "autonoma"].some((term) => normalizedQuestion.includes(term))) return "solar";
    if (["instalar", "instalacion", "cable", "conector", "fuente", "herramienta", "accesorio"].some((term) => normalizedQuestion.includes(term))) return "installation";
    return "general";
  }

  private answerPackageRequest(products: OdooProduct[], normalizedQuestion: string) {
    const channels = this.extractChannels(normalizedQuestion) ?? (normalizedQuestion.includes("negocio") ? 8 : 4);
    const wantsIp = normalizedQuestion.includes("ip") || normalizedQuestion.includes("nvr") || normalizedQuestion.includes("poe");
    const cameraQuery = [
      "camara",
      normalizedQuestion.includes("exterior") || normalizedQuestion.includes("casa") || normalizedQuestion.includes("negocio") ? "exterior" : "",
      normalizedQuestion.includes("audio") ? "audio" : "",
      normalizedQuestion.includes("2m") || normalizedQuestion.includes("2mp") ? "2mp" : "",
      normalizedQuestion.includes("5m") || normalizedQuestion.includes("5mp") ? "5mp" : "",
    ].join(" ");
    const recorderQuery = `${wantsIp ? "nvr" : "dvr xvr"} ${channels} canales`;

    const recorders = this.searchAdvisorProducts(products, this.normalize(recorderQuery)).slice(0, 2);
    const cameras = this.searchAdvisorProducts(products, this.normalize(cameraQuery)).slice(0, 2);
    const storage = this.searchAdvisorProducts(products, "disco duro vigilancia hdd").slice(0, 1);
    const cable = this.searchAdvisorProducts(products, "cable utp cat6").slice(0, 1);
    const selected = [...recorders, ...cameras, ...storage, ...cable];
    const unique = Array.from(new Map(selected.map((product) => [product.variantId, product])).values()).slice(0, 6);

    if (unique.length === 0) {
      return {
        answer: "No tengo ese dato confirmado en catalogo. Te recomiendo hablar con un asesor.",
        products: [],
      };
    }

    const advisorProducts = unique.map((product) => this.toAdvisorProduct(product));
    const answer = [
      `Te puedo armar una base de paquete de videovigilancia de ${channels} canales con productos del catalogo:`,
      ...advisorProducts.map((product, index) =>
        `${index + 1}. ${product.name} | Modelo: ${product.model} | SKU: ${product.sku} | Precio: ${this.money(product.price)} | Stock: ${product.stock}`,
      ),
      "Faltaria confirmar distancia de cableado, tipo de camara, ubicacion interior/exterior, dias de grabacion y si necesitas audio o PoE.",
    ].join("\n");

    return { answer, products: advisorProducts };
  }

  private answerTechnicalSupport(products: OdooProduct[], normalizedQuestion: string) {
    if (this.isDiscoveryRequest(normalizedQuestion)) {
      return {
        answer: [
          "Claro. Para recomendarte una solucion adecuada necesito entender el lugar y el objetivo.",
          "1. Es para casa, negocio, escuela, bodega o industria?",
          "2. Cuantas areas quieres vigilar y cuales son las mas importantes?",
          "3. Es interior, exterior o ambos?",
          "4. Quieres ver desde celular y recibir alertas?",
          "5. Tienes internet y electricidad en el sitio?",
          "6. Que presupuesto aproximado tienes?",
          "Con esos datos puedo armarte una propuesta mas aterrizada con camaras, grabador, disco y accesorios.",
        ].join("\n"),
        products: [],
      };
    }

    if (this.isObjectionQuestion(normalizedQuestion)) {
      return this.answerObjection(normalizedQuestion);
    }

    if (this.isCompanyInfoQuestion(normalizedQuestion)) {
      return {
        answer: [
          "Puedo orientarte, pero no debo inventar politicas de la empresa.",
          "Horarios, sucursales, garantias, envios, instalacion, facturacion, devoluciones y formas de pago deben confirmarse con un asesor de Worldcam.",
          "Si me dices que producto o solucion necesitas, te preparo la informacion tecnica y comercial para que ventas confirme condiciones.",
        ].join("\n"),
        products: [],
      };
    }

    if (this.isAutomaticKitRequest(normalizedQuestion)) {
      return this.answerAutomaticKit(products, normalizedQuestion);
    }

    if (this.isCalculationQuestion(normalizedQuestion)) {
      return this.answerApproximateCalculation(products, normalizedQuestion);
    }

    if (this.isSolarQuestion(normalizedQuestion)) {
      return {
        answer: [
          "Para alimentar camaras con panel solar hay que calcular consumo, horas de uso, autonomia y clima del sitio.",
          "Necesito saber: cuantas camaras, consumo en watts, si hay NVR/router, horas de sol, dias de respaldo y si el sitio no tiene electricidad.",
          "Una solucion autonoma normalmente lleva panel, controlador, bateria, gabinete, protecciones y una camara/equipo de bajo consumo.",
          "No recomiendo definir cantidad de paneles o bateria sin calculo electrico; puedo ayudarte a listar los datos para que ventas lo dimensione.",
        ].join("\n"),
        products: this.searchAdvisorProducts(products, "panel solar bateria controlador camara solar").slice(0, 5).map((product) => this.toAdvisorProduct(product)),
      };
    }

    if (this.isDetailedTroubleshootingQuestion(normalizedQuestion)) {
      return this.answerDetailedTroubleshooting(normalizedQuestion);
    }

    if (this.isBrandKnowledgeQuestion(normalizedQuestion)) {
      return {
        answer: [
          "Manejo varias familias de marca dentro del giro: Dahua/IMOU para CCTV y hogar inteligente, TP-Link para redes, Ubiquiti y MikroTik para redes mas profesionales, y Seagate/Western Digital para almacenamiento.",
          "La mejor marca depende del proyecto: compatibilidad, presupuesto, disponibilidad, soporte y nivel tecnico requerido.",
          "Si me dices si buscas camaras, red, disco o enlace, te recomiendo opciones del catalogo sin inventar stock ni precios.",
        ].join("\n"),
        products: this.searchAdvisorProducts(products, normalizedQuestion).slice(0, 5).map((product) => this.toAdvisorProduct(product)),
      };
    }

    if (this.isOpenSecurityAdviceQuestion(normalizedQuestion)) {
      return {
        answer: [
          "Para mejorar seguridad sin gastar de mas, lo ideal es cubrir primero los puntos criticos: entrada, caja, almacen, cochera, pasillos y zonas oscuras.",
          "Empieza con pocas camaras bien ubicadas en vez de muchas mal colocadas. Prioriza exterior, audio si aplica, grabacion local y acceso desde celular si hay internet.",
          "Si no quieres gastar mucho, una solucion de 4 canales puede ser buena primera etapa y dejar margen para crecer a 8 canales.",
          "Dime tipo de lugar, presupuesto y areas criticas para aterrizarlo mejor.",
        ].join("\n"),
        products: this.searchAdvisorProducts(products, "kit camara dvr nvr 4 canales exterior audio").slice(0, 5).map((product) => this.toAdvisorProduct(product)),
      };
    }

    if (this.isLowCableQuestion(normalizedQuestion)) {
      return {
        answer: [
          "Si no tienes mucho cableado, hay varias rutas:",
          "1. Camaras WiFi: practicas, pero dependen de buena señal y energia cercana.",
          "2. Camaras IP PoE: requieren cable UTP, pero llevan energia y datos por un solo cable.",
          "3. Enlaces inalambricos: utiles para conectar edificios o zonas lejanas con linea de vista.",
          "4. Sistema local con DVR/NVR: graba aunque no tengas internet; internet solo se necesita para ver remoto.",
          "La mejor opcion depende de distancia, muros, electricidad disponible y si quieres grabacion continua.",
        ].join("\n"),
        products: this.searchAdvisorProducts(products, "camara wifi nvr poe enlace antena").slice(0, 5).map((product) => this.toAdvisorProduct(product)),
      };
    }

    if (this.isSolutionScenarioQuestion(normalizedQuestion)) {
      return this.answerSolutionScenario(products, normalizedQuestion);
    }

    if (this.isPreSalesScenarioQuestion(normalizedQuestion)) {
      return this.answerPreSalesScenario(products, normalizedQuestion);
    }

    if (this.isAnalogVsIpQuestion(normalizedQuestion)) {
      const relatedQuery = normalizedQuestion.includes("ip") ? "camara ip nvr poe" : "camara analogica dvr xvr";
      return {
        answer: [
          "Depende del proyecto. Para instalaciones nuevas normalmente recomiendo IP si buscas mejor escalabilidad, PoE, mas resolucion y red mas ordenada.",
          "Analogico/XVR conviene cuando ya tienes cable coaxial instalado o quieres renovar camaras sin cambiar todo el cableado.",
          "IP: mejor para negocios, crecimiento, PoE, analiticos y administracion por red.",
          "Analogico: suele ser mas economico y practico si ya existe infraestructura coaxial.",
          "Para decidir bien dime: cuantas camaras necesitas, distancia de cableado, si ya hay cable instalado y cuantos dias quieres grabar.",
        ].join("\n"),
        products: this.searchAdvisorProducts(products, this.normalize(relatedQuery)).slice(0, 4).map((product) => this.toAdvisorProduct(product)),
      };
    }

    if (this.isBrandComparisonQuestion(normalizedQuestion)) {
      return {
        answer: [
          "Dahua y Hikvision son marcas fuertes. No hay una sola mejor para todos los casos; depende del proyecto, compatibilidad y presupuesto.",
          "Dahua suele ser muy competitiva en costo-beneficio y variedad de soluciones HDCVI/IP.",
          "Hikvision destaca mucho en ecosistema IP, AcuSense, analiticos y opciones profesionales.",
          "Mi recomendacion: elige por compatibilidad con tu grabador, resolucion, lente, audio, disponibilidad y soporte, no solo por marca.",
        ].join("\n"),
        products: this.searchAdvisorProducts(products, "dahua hikvision camara nvr dvr").slice(0, 5).map((product) => this.toAdvisorProduct(product)),
      };
    }

    if (this.isResolutionComparisonQuestion(normalizedQuestion)) {
      return {
        answer: [
          "5MP da mas detalle que 2MP, pero tambien consume mas almacenamiento y ancho de banda.",
          "2MP suele ser suficiente para vista general en casa, pasillos, entradas y areas cortas.",
          "5MP conviene si quieres mas detalle en rostros, caja, acceso, estacionamiento o zonas donde necesitas acercarte digitalmente.",
          "Para elegir bien dime distancia al objetivo y si necesitas identificar rostro, placa o solo ver movimiento.",
        ].join("\n"),
        products: this.searchAdvisorProducts(products, "camara 2mp 5mp exterior audio").slice(0, 5).map((product) => this.toAdvisorProduct(product)),
      };
    }

    if (this.isRecordingDaysQuestion(normalizedQuestion)) {
      return {
        answer: [
          "Los dias de grabacion dependen de cantidad de camaras, resolucion, fps, compresion, movimiento y capacidad del disco.",
          "Como regla: mas camaras, mas megapixeles o grabacion 24/7 consumen mas disco. H.265/H.265+ ayuda a ahorrar espacio.",
          "Para calcularlo bien necesito: numero de camaras, resolucion, si grabara continuo o por movimiento, y cuantos dias quieres guardar.",
          "Para CCTV recomiendo discos de videovigilancia, no discos comunes de computadora.",
        ].join("\n"),
        products: this.searchAdvisorProducts(products, "disco duro vigilancia hdd purple cctv").slice(0, 5).map((product) => this.toAdvisorProduct(product)),
      };
    }

    if (this.isCellPhoneQuestion(normalizedQuestion)) {
      return {
        answer: [
          "Si puedes ver camaras desde el celular, pero necesitas que el DVR/NVR tenga red y que haya internet para acceso remoto.",
          "Sin internet puedes grabar localmente, pero no ver desde fuera de casa o negocio.",
          "Normalmente se configura con la app de la marca, escaneando QR o agregando el dispositivo por nube/P2P.",
          "Para ayudarte exacto necesito marca y modelo del DVR/NVR o camara.",
        ].join("\n"),
        products: this.searchAdvisorProducts(products, "dvr nvr wifi camara ip").slice(0, 4).map((product) => this.toAdvisorProduct(product)),
      };
    }

    if (this.isCompatibilityQuestion(normalizedQuestion)) {
      return {
        answer: [
          "Para validar compatibilidad necesito modelo exacto de camara y modelo exacto del DVR/NVR.",
          "En analogico revisa tecnologia soportada: HDCVI, TVI, AHD, CVBS, resolucion y formato del DVR/XVR.",
          "En IP revisa canales, resolucion maxima, protocolo, ONVIF, ancho de banda, PoE y firmware.",
          "Si me escribes ambos modelos, busco coincidencias en catalogo y te digo que revisar antes de comprar.",
        ].join("\n"),
        products: this.searchAdvisorProducts(products, normalizedQuestion).slice(0, 5).map((product) => this.toAdvisorProduct(product)),
      };
    }

    if (this.isInstallMaterialsQuestion(normalizedQuestion)) {
      return {
        answer: [
          "Para instalar camaras normalmente necesitas: camaras, DVR/NVR, disco duro, cable, conectores, fuente o PoE, monitor para configuracion y accesorios de montaje.",
          "Si son IP PoE: cable UTP, NVR PoE o switch PoE, conectores RJ45 y proteccion si va exterior.",
          "Si son analogicas: coaxial o UTP con baluns, fuente 12V, conectores y DVR/XVR compatible.",
          "Para 4 camaras recomiendo definir primero: interior/exterior, distancia de cableado, audio, dias de grabacion y si quieres ver desde celular.",
        ].join("\n"),
        products: this.searchAdvisorProducts(products, "kit camara dvr nvr cable fuente conector switch poe disco").slice(0, 6).map((product) => this.toAdvisorProduct(product)),
      };
    }

    if (this.isNetworkQuestion(normalizedQuestion)) {
      return {
        answer: [
          "En redes, la recomendacion depende de velocidad contratada, cobertura, muros, cantidad de usuarios y si habra camaras IP.",
          "2.4 GHz llega mas lejos y atraviesa mejor paredes, pero es mas lenta y saturada. 5 GHz es mas rapida, pero cubre menos distancia.",
          "Para camaras IP por cable conviene switch PoE con puertos suficientes y presupuesto de energia adecuado.",
          "Para enlazar edificios se usan antenas punto a punto con linea de vista; hay que validar distancia, obstaculos y ancho de banda.",
        ].join("\n"),
        products: this.searchAdvisorProducts(products, normalizedQuestion.includes("antena") ? "antena enlace punto a punto" : "router switch poe fibra wifi").slice(0, 5).map((product) => this.toAdvisorProduct(product)),
      };
    }

    if (this.isSalesPolicyQuestion(normalizedQuestion)) {
      return {
        answer: [
          "Puedo mostrar precio y stock cuando el producto aparece en catalogo.",
          "Descuentos por mayoreo, fecha de llegada, envio a ciudad y pagos con tarjeta deben confirmarse con ventas porque pueden cambiar.",
          "Si me dices el modelo o SKU, te ayudo a ubicarlo y preparo la informacion para que un asesor confirme disponibilidad y condiciones.",
        ].join("\n"),
        products: this.searchAdvisorProducts(products, normalizedQuestion).slice(0, 5).map((product) => this.toAdvisorProduct(product)),
      };
    }

    if (this.isNoInternetQuestion(normalizedQuestion)) {
      return {
        answer: [
          "Si en la casa no tienes internet, aun puedes instalar videovigilancia local.",
          "Lo recomendable es usar DVR/XVR o NVR con disco duro para que grabe sin depender de internet.",
          "Sin internet podras ver las camaras en un monitor conectado por HDMI/VGA al grabador, pero no tendras visualizacion remota en celular hasta conectar internet.",
          "Si necesitas ver desde el celular sin internet fijo, se puede evaluar router 4G/LTE o enlace inalambrico, segun cobertura y presupuesto.",
        ].join("\n"),
        products: this.searchAdvisorProducts(products, "dvr xvr nvr disco duro vigilancia").slice(0, 5).map((product) => this.toAdvisorProduct(product)),
      };
    }

    if (this.isTroubleshootingQuestion(normalizedQuestion)) {
      return {
        answer: [
          "Vamos por pasos. Si una camara no funciona, primero valida energia: fuente, PoE, transformador o puerto del NVR/switch.",
          "Despues revisa cableado y conectores: prueba otro cable, otro puerto y confirma que no haya humedad o falso contacto.",
          "Si es IP, valida que este en la misma red, que tenga IP correcta y que el NVR soporte esa resolucion/protocolo.",
          "Si es analogica, revisa balun/coaxial, formato de video compatible con el DVR/XVR y alimentacion de 12V.",
          "Si prende pero no da imagen, dime marca/modelo, tipo de camara, grabador y que mensaje aparece para guiarte mejor.",
        ].join("\n"),
        products: [],
      };
    }

    if (this.isHdmiDistanceQuestion(normalizedQuestion)) {
      return {
        answer: [
          "Un cable HDMI pasivo normalmente se recomienda corto: 1 a 5 metros trabaja muy bien; 10 metros puede funcionar si el cable es de buena calidad.",
          "Para distancias mayores, como 15, 20, 30 metros o mas, conviene usar cable HDMI activo, extensor HDMI por UTP, fibra HDMI o un convertidor segun resolucion.",
          "Si vas a sacar video de un DVR/NVR a una pantalla lejana, dime cuantos metros son y si necesitas 1080p o 4K para buscarte una opcion adecuada.",
        ].join("\n"),
        products: this.searchAdvisorProducts(products, "cable hdmi extensor hdmi").slice(0, 5).map((product) => this.toAdvisorProduct(product)),
      };
    }

    if (this.isZoomQuestion(normalizedQuestion)) {
      return {
        answer: [
          "El zoom depende del tipo de camara.",
          "Una camara fija con lente 2.8 mm normalmente no hace zoom optico; solo puedes acercar digitalmente desde la app o el grabador, pero pierde detalle.",
          "Para zoom real necesitas camara PTZ o camara varifocal/motorizada. Ahi el modelo debe indicar zoom optico, por ejemplo 4X, 12X, 25X o mas.",
          "Para activar zoom en una PTZ se usa el control PTZ desde el NVR, la app o el software, siempre que el modelo y el protocolo lo soporten.",
        ].join("\n"),
        products: this.searchAdvisorProducts(products, "camara ptz zoom varifocal motorizada").slice(0, 5).map((product) => this.toAdvisorProduct(product)),
      };
    }

    if (this.isCameraRangeQuestion(normalizedQuestion)) {
      return {
        answer: [
          "La distancia que ve una camara no depende solo de megapixeles. Depende del lente, iluminacion, altura de instalacion, angulo y si quieres detectar, reconocer o identificar.",
          "Como regla practica: lente 2.8 mm da angulo amplio para areas cortas; 3.6 mm cierra un poco mas; varifocal permite ajustar encuadre.",
          "El alcance nocturno se mide por IR o luz blanca: muchas camaras indican 20 m, 30 m, 50 m o mas, pero eso es en condiciones ideales.",
          "Para recomendarte una exacta dime: distancia al objetivo, interior/exterior, si quieres rostro o solo vista general, y si hay luz por la noche.",
        ].join("\n"),
        products: this.searchAdvisorProducts(products, "camara exterior ir nocturna varifocal").slice(0, 5).map((product) => this.toAdvisorProduct(product)),
      };
    }

    if (this.isCameraConceptQuestion(normalizedQuestion)) {
      return {
        answer: [
          "Conceptos clave para elegir camara:",
          "Resolucion: 2MP sirve para vigilancia general; 4MP/5MP da mas detalle; 8MP/4K exige mas almacenamiento y ancho de banda.",
          "Lente: 2.8 mm abre mas la imagen; 3.6 mm acerca un poco; varifocal permite ajustar.",
          "IR o luz blanca: define vision nocturna. Audio: puede ser microfono integrado o entrada externa.",
          "IP67 es proteccion para exterior. WDR ayuda cuando hay contraluz. PoE permite energia y datos por el mismo cable UTP.",
        ].join("\n"),
        products: this.searchAdvisorProducts(products, "camara 2mp 4mp exterior audio ir poe").slice(0, 5).map((product) => this.toAdvisorProduct(product)),
      };
    }

    if (this.isBestQuestion(normalizedQuestion)) {
      const query = this.detectProductFamily(normalizedQuestion) === "recorder" ? normalizedQuestion : `${normalizedQuestion} camara exterior`;
      const best = this.searchAdvisorProducts(products, query).slice(0, 5).map((product) => this.toAdvisorProduct(product));
      return {
        answer: [
          "Para decir cual es el mejor necesito el uso exacto, pero puedo ordenar opciones por coincidencia con tu necesidad.",
          "Me fijo en: tipo de instalacion, resolucion, exterior/interior, audio, PoE, stock, precio y compatibilidad con grabador.",
          "Si me dices presupuesto, metros de distancia, cantidad de camaras y si quieres verlo desde celular, te lo cierro mucho mejor.",
        ].join("\n"),
        products: best,
      };
    }

    if (this.isHowToUseQuestion(normalizedQuestion)) {
      return {
        answer: [
          "Para usar una camara primero hay que identificar si es IP, analogica o WiFi.",
          "IP/PoE: se conecta por cable UTP al NVR PoE o a un switch PoE y despues se agrega al grabador por red.",
          "Analogica: se conecta al DVR/XVR con coaxial o UTP con baluns, y requiere alimentacion de 12V.",
          "WiFi: se configura desde app/red WiFi, pero para grabacion continua conviene validar compatibilidad con NVR o microSD.",
          "Si me pasas modelo o SKU te digo los pasos mas aterrizados para esa camara.",
        ].join("\n"),
        products: this.searchAdvisorProducts(products, normalizedQuestion).slice(0, 4).map((product) => this.toAdvisorProduct(product)),
      };
    }

    return null;
  }

  private answerPreSalesScenario(products: OdooProduct[], normalizedQuestion: string) {
    const place = this.detectPlace(normalizedQuestion);
    const wantsAudio = normalizedQuestion.includes("audio") || normalizedQuestion.includes("escuchar") || normalizedQuestion.includes("caja");
    const wantsRemote = normalizedQuestion.includes("celular") || normalizedQuestion.includes("viaje") || normalizedQuestion.includes("otro pais") || normalizedQuestion.includes("remoto");
    const wantsAccess = normalizedQuestion.includes("acceso") || normalizedQuestion.includes("empleados") || normalizedQuestion.includes("llegan");
    const likelyChannels = place === "escuela" || place === "bodega" ? 16 : place === "negocio" || place === "restaurante" || place === "farmacia" ? 8 : 4;
    const productsQuery = wantsAccess
      ? "control acceso camara nvr dvr"
      : `${place === "casa" ? "kit camara casa" : "camara negocio exterior"} ${wantsAudio ? "audio" : ""} ${wantsRemote ? "nvr dvr wifi" : ""}`;

    return {
      answer: [
        `Perfecto. Para ${place} yo empezaria pensando en una solucion de ${likelyChannels} canales, pero antes necesito cerrar estos datos:`,
        "1. Que zonas son criticas: entrada, caja, cochera, pasillos, patios, almacen o estacionamiento?",
        wantsAudio ? "2. Como quieres audio, hay que validar si la camara lo trae integrado y si legalmente puedes grabarlo en esa area." : "2. Necesitas audio o solo video?",
        wantsRemote ? "3. Para ver desde celular necesitas internet estable en el sitio y configurar la app del equipo." : "3. Quieres ver desde celular o solo grabacion local?",
        "4. Interior, exterior o ambos?",
        "5. Cuantos dias quieres conservar grabacion?",
        "6. Tienes presupuesto aproximado?",
        "Con eso puedo armarte paquete con camaras, grabador, disco, cableado, energia y accesorios.",
      ].join("\n"),
      products: this.searchAdvisorProducts(products, this.normalize(productsQuery)).slice(0, 5).map((product) => this.toAdvisorProduct(product)),
    };
  }

  private answerAutomaticKit(products: OdooProduct[], normalizedQuestion: string) {
    const channels = this.extractChannels(normalizedQuestion) ?? this.extractCameraCount(normalizedQuestion) ?? 4;
    const wantsIp = normalizedQuestion.includes("ip") || normalizedQuestion.includes("poe");
    const wantsAudio = normalizedQuestion.includes("audio") || normalizedQuestion.includes("escuchar");
    const wantsBudget = this.extractBudget(normalizedQuestion);
    const recorderQuery = `${wantsIp ? "nvr poe" : "dvr xvr"} ${channels} canales`;
    const cameraQuery = `camara ${wantsAudio ? "audio microfono" : ""} ${normalizedQuestion.includes("exterior") ? "exterior" : ""}`;
    const selected = [
      ...this.searchAdvisorProducts(products, this.normalize(cameraQuery)).slice(0, 2),
      ...this.searchAdvisorProducts(products, this.normalize(recorderQuery)).slice(0, 2),
      ...this.searchAdvisorProducts(products, "disco duro vigilancia").slice(0, 1),
      ...this.searchAdvisorProducts(products, wantsIp ? "switch poe cable utp cat6" : "fuente cable conector balun").slice(0, 2),
    ];
    const advisorProducts = Array.from(new Map(selected.map((product) => [product.variantId, product])).values())
      .slice(0, 7)
      .map((product) => this.toAdvisorProduct(product));

    return {
      answer: [
        `Kit recomendado para ${channels} camara(s):`,
        `${channels} camara(s) segun interior/exterior y si necesitas audio.`,
        `1 ${wantsIp ? "NVR PoE o NVR + switch PoE" : "DVR/XVR"} de ${channels} canales o superior.`,
        "1 disco duro de videovigilancia calculado por dias de grabacion.",
        wantsIp ? "Cable UTP Cat5e/Cat6, conectores RJ45 y proteccion si va exterior." : "Fuente de poder, conectores, baluns/coaxial o UTP segun instalacion.",
        wantsBudget ? `Con presupuesto de $${wantsBudget.toLocaleString("es-MX")} hay que priorizar equipo esencial y confirmar precios vigentes.` : "Para cerrar precio necesito presupuesto y metros aproximados de cable.",
      ].join("\n"),
      products: advisorProducts,
    };
  }

  private answerApproximateCalculation(products: OdooProduct[], normalizedQuestion: string) {
    const cameras = this.extractCameraCount(normalizedQuestion) ?? 4;
    const tb = this.extractTerabytes(normalizedQuestion);
    const megapixels = this.extractMegapixels(normalizedQuestion) ?? 2;
    const watts = this.extractWatts(normalizedQuestion);

    if (tb) {
      const baseDays = Math.max(3, Math.round((tb * 18) / Math.max(1, cameras) / Math.max(1, megapixels / 2)));
      return {
        answer: [
          `Calculo aproximado: con ${cameras} camara(s) de ${megapixels}MP y disco de ${tb}TB podrias tener alrededor de ${baseDays} a ${baseDays + 10} dias de grabacion.`,
          "Puede variar mucho por fps, compresion H.265/H.265+, grabacion continua o por movimiento, escena y bitrate.",
          "Para dimensionarlo mejor dime fps, resolucion exacta y si quieres grabar 24/7 o solo movimiento.",
        ].join("\n"),
        products: this.searchAdvisorProducts(products, "disco duro vigilancia hdd").slice(0, 5).map((product) => this.toAdvisorProduct(product)),
      };
    }

    if (watts || normalizedQuestion.includes("poe")) {
      const assumedWatts = watts ?? cameras * 8;
      return {
        answer: [
          `Para PoE calcula consumo total y deja margen. Si son ${cameras} camara(s), estima al menos ${assumedWatts}W y agrega 25% de reserva.`,
          `Switch recomendado: presupuesto PoE aproximado de ${Math.ceil(assumedWatts * 1.25)}W o mas.`,
          "Valida si las camaras son PoE, PoE+ o requieren alimentacion especial.",
        ].join("\n"),
        products: this.searchAdvisorProducts(products, "switch poe").slice(0, 5).map((product) => this.toAdvisorProduct(product)),
      };
    }

    return {
      answer: [
        "Puedo hacer calculos aproximados de dias de grabacion, disco, consumo PoE, cable y cobertura, pero necesito datos base.",
        "Para grabacion: numero de camaras, megapixeles, disco, fps y si sera continuo o por movimiento.",
        "Para cable: distancia por camara y tipo de sistema.",
        "Para WiFi: metros cuadrados, pisos, muros y velocidad contratada.",
      ].join("\n"),
      products: [],
    };
  }

  private answerObjection(normalizedQuestion: string) {
    if (normalizedQuestion.includes("caro") || normalizedQuestion.includes("barato")) {
      return {
        answer: [
          "Te entiendo. En seguridad no conviene comparar solo precio; hay que comparar garantia, compatibilidad, soporte, calidad de imagen, almacenamiento y vida util.",
          "Puedo buscar una opcion mas economica, una calidad-precio o una profesional. Dime presupuesto maximo y que area quieres cubrir.",
        ].join("\n"),
        products: [],
      };
    }

    if (normalizedQuestion.includes("pensar")) {
      return {
        answer: [
          "Claro. Para que lo pienses con datos, te puedo dejar una propuesta comparando opcion economica, equilibrada y profesional.",
          "Lo mas importante es no quedarte corto en canales, disco o cableado, porque despues sale mas caro ampliar.",
        ].join("\n"),
        products: [],
      };
    }

    if (normalizedQuestion.includes("no conozco la marca")) {
      return {
        answer: [
          "Es normal. La marca se debe evaluar por soporte, garantia, compatibilidad, disponibilidad y casos de uso.",
          "Si me dices la marca/modelo que dudas, te explico para que tipo de instalacion conviene y que validar antes de comprar.",
        ].join("\n"),
        products: [],
      };
    }

    return {
      answer: [
        "Podemos ajustar la solucion a tu presupuesto y nivel tecnico.",
        "Si no sabes instalarlo, conviene elegir un kit mas sencillo y confirmar accesorios completos para evitar compras incompletas.",
        "Dime presupuesto, lugar de instalacion y si quieres verlo desde celular para aterrizarlo.",
      ].join("\n"),
      products: [],
    };
  }

  private answerDetailedTroubleshooting(normalizedQuestion: string) {
    if (normalizedQuestion.includes("blanco y negro") || normalizedQuestion.includes("sin color")) {
      return {
        answer: [
          "Si la camara se ve en blanco y negro puede estar en modo nocturno, con poca luz, con IR activo o con filtro ICR atorado.",
          "Prueba iluminar la zona, reiniciar la camara, revisar configuracion dia/noche y confirmar que la fuente entregue voltaje correcto.",
        ].join("\n"),
        products: [],
      };
    }

    if (normalizedQuestion.includes("dvr no detecta") || normalizedQuestion.includes("no detecta la camara")) {
      return {
        answer: [
          "Si el DVR no detecta la camara revisa compatibilidad de tecnologia y resolucion: HDCVI, TVI, AHD, CVBS o IP.",
          "Prueba otro canal, otro cable, otra fuente y confirma que el DVR soporte la resolucion de la camara.",
        ].join("\n"),
        products: [],
      };
    }

    if (normalizedQuestion.includes("celular")) {
      return {
        answer: [
          "Si no puedes ver camaras en celular revisa internet del sitio, QR/P2P en linea, usuario/contraseña, permisos de app y fecha/hora del DVR/NVR.",
          "Si el equipo aparece offline, prueba reiniciar modem y grabador, revisar cable de red y DNS.",
        ].join("\n"),
        products: [],
      };
    }

    if (normalizedQuestion.includes("contrasena") || normalizedQuestion.includes("contraseña") || normalizedQuestion.includes("olvide")) {
      return {
        answer: [
          "Si olvidaste la contraseña, el proceso depende de marca y modelo.",
          "Por seguridad no se debe prometer desbloqueo sin validar propiedad del equipo. Te recomiendo contactar soporte con modelo, serie y comprobante si aplica.",
        ].join("\n"),
        products: [],
      };
    }

    if (normalizedQuestion.includes("reinicia")) {
      return {
        answer: [
          "Si el DVR se reinicia solo revisa fuente de poder, disco duro, temperatura, firmware y regulacion electrica.",
          "Prueba desconectar disco temporalmente para diagnostico y usar un regulador/UPS si hay variaciones de energia.",
        ].join("\n"),
        products: [],
      };
    }

    return null;
  }

  private answerSolutionScenario(products: OdooProduct[], normalizedQuestion: string) {
    const channels =
      this.extractChannels(normalizedQuestion) ??
      (normalizedQuestion.includes("escuela") || normalizedQuestion.includes("gasolinera") || normalizedQuestion.includes("bodega") ? 16 : normalizedQuestion.includes("negocio") || normalizedQuestion.includes("restaurante") ? 8 : 4);
    const wantsAudio = normalizedQuestion.includes("audio") || normalizedQuestion.includes("escuchar") || normalizedQuestion.includes("conversaciones") || normalizedQuestion.includes("caja");
    const wantsAi = normalizedQuestion.includes("inteligencia") || normalizedQuestion.includes("personas") || normalizedQuestion.includes("vehiculos") || normalizedQuestion.includes("ia");
    const wantsPlate = normalizedQuestion.includes("placa") || normalizedQuestion.includes("placas");
    const wantsLongStorage = normalizedQuestion.includes("30 dias") || normalizedQuestion.includes("30 dia") || normalizedQuestion.includes("continuos");
    const budget = normalizedQuestion.match(/\b(?:presupuesto|de)\s*\$?\s*(\d{4,6})\b/)?.[1];
    const recorderQuery = `${wantsAi ? "nvr inteligencia personas vehiculos" : "nvr dvr xvr"} ${channels} canales`;
    const cameraQuery = [
      "camara",
      normalizedQuestion.includes("casa") || normalizedQuestion.includes("negocio") || normalizedQuestion.includes("bodega") || normalizedQuestion.includes("gasolinera") ? "exterior" : "",
      wantsAudio ? "audio microfono" : "",
      wantsAi ? "wizsense acusense personas vehiculos" : "",
      wantsPlate ? "placas varifocal zoom" : "",
    ].join(" ");
    const diskQuery = wantsLongStorage ? "disco duro vigilancia 4tb 6tb 8tb" : "disco duro vigilancia";
    const cameraMatches = this.searchAdvisorProducts(products, this.normalize(cameraQuery)).slice(0, wantsPlate ? 4 : 3);
    const recorderMatches = this.searchAdvisorProducts(products, this.normalize(recorderQuery)).slice(0, 2);
    const selected = [
      ...cameraMatches,
      ...recorderMatches,
      ...this.searchAdvisorProducts(products, this.normalize(diskQuery)).slice(0, 1),
      ...this.searchAdvisorProducts(products, "cable utp cat6 switch poe fuente").slice(0, 1),
    ];
    const advisorProducts = Array.from(new Map(selected.map((product) => [product.variantId, product])).values())
      .slice(0, 6)
      .map((product) => this.toAdvisorProduct(product));

    return {
      answer: [
        `Te propongo una base de solucion de ${channels} canales para ese escenario.`,
        budget ? `Tomo como referencia tu presupuesto de $${Number(budget).toLocaleString("es-MX")}, pero hay que validar precios finales y stock.` : "Para afinarla necesito presupuesto aproximado.",
        wantsAudio ? "Incluyo prioridad por camaras con audio o microfono para el area indicada." : "Si necesitas audio, hay que elegir camaras con microfono o entrada de audio compatible.",
        wantsAi ? "Para inteligencia artificial conviene buscar deteccion de personas/vehiculos y validar que el grabador tambien lo soporte." : "Si quieres analiticos, hay que validar funciones del grabador y de la camara.",
        wantsPlate ? "Para placas se requiere camara/lente adecuado, buena iluminacion, angulo correcto y distancia controlada; no cualquier camara sirve." : "La seleccion final depende de distancia, altura, luz y puntos ciegos.",
        wantsLongStorage ? "Para 30 dias continuos hay que calcular disco con resolucion, fps, compresion y numero de camaras." : "Tambien falta definir cuantos dias quieres conservar grabacion.",
      ].join("\n"),
      products: advisorProducts,
    };
  }

  private searchAdvisorProducts(products: OdooProduct[], normalizedQuestion: string) {
    const terms = normalizedQuestion.split(" ").filter((term) => term.length > 1 && !this.isSearchStopWord(term));
    const expandedTerms = new Set(terms.flatMap((term) => this.expandTerm(term)));
    const family = this.detectProductFamily(normalizedQuestion);
    const channels = this.extractChannels(normalizedQuestion);
    const lookupCode = this.extractLookupCode(normalizedQuestion);

    return products
      .map((product) => ({
        product,
        score: this.scoreProduct(product, expandedTerms, normalizedQuestion, family, channels, lookupCode),
      }))
      .filter((item) => item.score > 0)
      .sort((a, b) => b.score - a.score || b.product.stock - a.product.stock)
      .map((item) => item.product);
  }

  private findExactLookupProducts(products: OdooProduct[], normalizedQuestion: string) {
    const lookup = this.extractLookupCode(normalizedQuestion);
    if (!lookup) return [];

    const compactLookup = lookup.replace(/\s+/g, "");
    if (compactLookup.length < 5) return [];

    return products.filter((product) => {
      const compactModel = this.normalize(product.clave).replace(/\s+/g, "");
      const compactSku = this.normalize(product.sku).replace(/\s+/g, "");
      const compactBarcode = this.normalize(product.barcode ?? "").replace(/\s+/g, "");
      return compactModel === compactLookup || compactSku === compactLookup || compactBarcode === compactLookup;
    });
  }

  private scoreProduct(product: OdooProduct, terms: Set<string>, normalizedQuestion: string, family: string | null, channels: number | null, lookupCode: string | null) {
    const text = this.normalize([product.name, product.sku, product.clave, product.barcode, product.brand, product.category].join(" "));
    const compactText = text.replace(/\s+/g, "");
    let score = 0;

    if (family && !this.productMatchesFamily(text, family)) return 0;

    if (lookupCode) {
      const compactLookup = lookupCode.replace(/\s+/g, "");
      if (compactLookup.length >= 5 && compactText.includes(compactLookup)) score += 100;
    }

    for (const term of terms) {
      if (text.includes(term)) score += term.length > 3 ? 3 : 1;
    }

    if (channels) {
      const channelPatterns = [`${channels} canales`, `${channels} canal`, `${channels}ch`, `${channels} ch`, `${channels} puertos`];
      if (channelPatterns.some((pattern) => text.includes(pattern))) score += 12;
      else if (family === "recorder") score -= 4;
    }

    if ((normalizedQuestion.includes("casa") || normalizedQuestion.includes("hogar")) && (text.includes("kit") || text.includes("wifi") || text.includes("2mp") || text.includes("4 canales"))) score += 6;
    if ((normalizedQuestion.includes("casa") || normalizedQuestion.includes("hogar")) && this.isAccessoryText(text)) score -= 18;
    if (product.stock > 0) score += 2;
    if (normalizedQuestion.includes("exterior") && text.includes("exterior")) score += 5;
    if (normalizedQuestion.includes("audio") && text.includes("audio")) score += 5;
    if (normalizedQuestion.includes("nvr") && text.includes("nvr")) score += 5;
    if (normalizedQuestion.includes("dvr") && text.includes("dvr")) score += 5;
    if (normalizedQuestion.includes("poe") && text.includes("poe")) score += 5;
    if ((normalizedQuestion.includes("solar") || normalizedQuestion.includes("panel")) && text.includes("solar")) score += 5;
    if ((normalizedQuestion.includes("switch") || normalizedQuestion.includes("router")) && (text.includes("switch") || text.includes("router"))) score += 5;
    if (normalizedQuestion.includes("placa") || normalizedQuestion.includes("placas")) {
      if (text.includes("lpr") || text.includes("placa") || text.includes("placas") || text.includes("varifocal") || text.includes("motorizada") || text.includes("zoom")) score += 18;
      if (text.includes("kit")) score -= 14;
    }

    return score;
  }

  private detectProductFamily(normalizedQuestion: string) {
    if (this.isPackageRequest(normalizedQuestion)) return null;
    if (normalizedQuestion.includes("nvr") || normalizedQuestion.includes("dvr") || normalizedQuestion.includes("xvr") || normalizedQuestion.includes("grabador")) return "recorder";
    if (normalizedQuestion.includes("camara") || normalizedQuestion.includes("camera")) return "camera";
    if (normalizedQuestion.includes("disco") || normalizedQuestion.includes("hdd")) return "storage";
    if (normalizedQuestion.includes("switch")) return "switch";
    if (normalizedQuestion.includes("router")) return "router";
    if (normalizedQuestion.includes("cable") || normalizedQuestion.includes("utp") || normalizedQuestion.includes("cat6")) return "cable";
    if (normalizedQuestion.includes("solar") || normalizedQuestion.includes("panel")) return "solar";
    return null;
  }

  private productMatchesFamily(text: string, family: string) {
    if (family === "recorder") return text.includes("nvr") || text.includes("dvr") || text.includes("xvr") || text.includes("grabador");
    if (family === "camera") {
      if (this.isAccessoryText(text)) return false;
      return text.includes("camara") || text.includes("camera") || text.includes("bullet") || text.includes("domo") || text.includes("kit");
    }
    if (family === "storage") return text.includes("disco") || text.includes("hdd") || text.includes("purple") || text.includes("surveillance");
    if (family === "switch") return text.includes("switch");
    if (family === "router") return text.includes("router");
    if (family === "cable") return text.includes("cable") || text.includes("utp") || text.includes("cat5") || text.includes("cat6");
    if (family === "solar") return text.includes("solar") || text.includes("panel");
    return true;
  }

  private isAccessoryText(text: string) {
    return (
      text.includes("caja de conexiones") ||
      text.includes("junction box") ||
      text.includes("soporte") ||
      text.includes("montaje") ||
      text.includes("base para") ||
      text.includes("conector") ||
      text.includes("adaptador")
    );
  }

  private expandTerm(term: string) {
    const expansions: Record<string, string[]> = {
      camara: ["camara", "camera", "camaras", "ip", "bullet", "domo"],
      camaras: ["camara", "camera", "camaras", "ip", "bullet", "domo"],
      camera: ["camara", "camera", "camaras", "ip", "bullet", "domo"],
      exterior: ["exterior", "intemperie", "outdoor"],
      interior: ["interior", "indoor"],
      audio: ["audio", "microfono", "mic"],
      noche: ["noche", "nocturna", "ir", "infrarrojo"],
      nocturna: ["noche", "nocturna", "ir", "infrarrojo"],
      grabacion: ["grabacion", "disco", "hdd", "nvr", "dvr", "xvr"],
      negocio: ["negocio", "comercial", "empresa", "oficina"],
      local: ["local", "negocio", "comercial", "oficina"],
      oficina: ["oficina", "negocio", "comercial"],
      casa: ["casa", "hogar", "residencial"],
      cable: ["cable", "utp", "cat5", "cat6", "coaxial"],
      hdmi: ["hdmi", "monitor", "pantalla", "video"],
      paquete: ["paquete", "kit", "solucion", "sistema"],
      vigilancia: ["vigilancia", "videovigilancia", "seguridad"],
      video: ["video", "videovigilancia", "vigilancia"],
      zoom: ["zoom", "ptz", "varifocal", "motorizada"],
    };

    if (/^\d+m$/.test(term)) {
      const value = term.replace("m", "");
      return [term, `${value}mp`, `${value} megapixel`, `${value} megapixeles`];
    }

    if (/^\d+mp$/.test(term)) {
      const value = term.replace("mp", "");
      return [term, `${value}m`, `${value} megapixel`, `${value} megapixeles`];
    }

    return expansions[term] ?? [term];
  }

  private extractChannels(normalizedQuestion: string) {
    const match = normalizedQuestion.match(/\b(4|8|16|24|32|64)\s*(canales|canal|ch|puertos)?\b/);
    return match ? Number(match[1]) : null;
  }

  private isPriceQuestion(normalizedQuestion: string) {
    return normalizedQuestion.includes("precio") || normalizedQuestion.includes("cuesta") || normalizedQuestion.includes("costo") || normalizedQuestion.includes("vale");
  }

  private isAnalogVsIpQuestion(normalizedQuestion: string) {
    return (
      (normalizedQuestion.includes("analogico") || normalizedQuestion.includes("analogo")) &&
      normalizedQuestion.includes("ip") &&
      (normalizedQuestion.includes("mejor") || normalizedQuestion.includes("diferencia") || normalizedQuestion.includes("conviene"))
    );
  }

  private isBrandComparisonQuestion(normalizedQuestion: string) {
    return (
      normalizedQuestion.includes("dahua") &&
      (normalizedQuestion.includes("hikvision") || normalizedQuestion.includes("hilook")) &&
      (normalizedQuestion.includes("mejor") || normalizedQuestion.includes("diferencia") || normalizedQuestion.includes("comparar"))
    );
  }

  private isResolutionComparisonQuestion(normalizedQuestion: string) {
    return (
      (normalizedQuestion.includes("2mp") || normalizedQuestion.includes("2 megapixel") || normalizedQuestion.includes("2 megapixeles")) &&
      (normalizedQuestion.includes("5mp") || normalizedQuestion.includes("5 megapixel") || normalizedQuestion.includes("5 megapixeles"))
    );
  }

  private isRecordingDaysQuestion(normalizedQuestion: string) {
    return (
      normalizedQuestion.includes("cuantos dias") ||
      normalizedQuestion.includes("dias graba") ||
      normalizedQuestion.includes("grabar 30 dias") ||
      normalizedQuestion.includes("30 dias") ||
      normalizedQuestion.includes("500 gb") ||
      normalizedQuestion.includes("1 tb") ||
      normalizedQuestion.includes("disco duro necesito")
    );
  }

  private isCellPhoneQuestion(normalizedQuestion: string) {
    return normalizedQuestion.includes("celular") || normalizedQuestion.includes("telefono") || normalizedQuestion.includes("app") || normalizedQuestion.includes("remoto");
  }

  private isCompatibilityQuestion(normalizedQuestion: string) {
    return (
      normalizedQuestion.includes("compatible") ||
      normalizedQuestion.includes("compatibilidad") ||
      normalizedQuestion.includes("soporta") ||
      normalizedQuestion.includes("funciona con mi dvr") ||
      normalizedQuestion.includes("mezclar camaras")
    );
  }

  private isInstallMaterialsQuestion(normalizedQuestion: string) {
    return (
      normalizedQuestion.includes("que necesito para instalar") ||
      normalizedQuestion.includes("herramientas necesito") ||
      normalizedQuestion.includes("accesorios me faltan") ||
      normalizedQuestion.includes("puedo instalarlo yo") ||
      normalizedQuestion.includes("fuente necesito") ||
      normalizedQuestion.includes("cable debo usar") ||
      normalizedQuestion.includes("metros de cable")
    );
  }

  private isNetworkQuestion(normalizedQuestion: string) {
    return (
      normalizedQuestion.includes("router") ||
      normalizedQuestion.includes("fibra optica") ||
      normalizedQuestion.includes("2 4 ghz") ||
      normalizedQuestion.includes("5 ghz") ||
      normalizedQuestion.includes("switch") ||
      normalizedQuestion.includes("antena") ||
      normalizedQuestion.includes("enlazar")
    );
  }

  private isSalesPolicyQuestion(normalizedQuestion: string) {
    return (
      normalizedQuestion.includes("existencias") ||
      normalizedQuestion.includes("descuento") ||
      normalizedQuestion.includes("mayoreo") ||
      normalizedQuestion.includes("cuando llega") ||
      normalizedQuestion.includes("envio") ||
      normalizedQuestion.includes("ciudad") ||
      normalizedQuestion.includes("tarjeta") ||
      normalizedQuestion.includes("pago")
    );
  }

  private isGenericAssistantQuestion(normalizedQuestion: string) {
    return (
      normalizedQuestion.includes("que puedes hacer") ||
      normalizedQuestion.includes("como me puedes ayudar") ||
      normalizedQuestion.includes("en que me ayudas") ||
      normalizedQuestion.includes("que sabes hacer") ||
      normalizedQuestion === "hola" ||
      normalizedQuestion === "buenas" ||
      normalizedQuestion === "buen dia" ||
      normalizedQuestion === "buenas tardes"
    );
  }

  private isWhatsAppHandoffQuestion(normalizedQuestion: string) {
    return (
      normalizedQuestion.includes("cotizacion") ||
      normalizedQuestion.includes("cotizar") ||
      normalizedQuestion.includes("propuesta formal") ||
      normalizedQuestion.includes("proyecto completo") ||
      normalizedQuestion.includes("visita tecnica") ||
      normalizedQuestion.includes("asesor") ||
      normalizedQuestion.includes("whatsapp") ||
      normalizedQuestion.includes("instalar 20 camaras") ||
      normalizedQuestion.includes("20 camaras") ||
      normalizedQuestion.includes("varias sucursales") ||
      normalizedQuestion.includes("empresa") ||
      normalizedQuestion.includes("escuela completa") ||
      normalizedQuestion.includes("control de acceso") ||
      normalizedQuestion.includes("solucion a medida")
    );
  }

  private isAutomaticKitRequest(normalizedQuestion: string) {
    return (
      normalizedQuestion.includes("necesito") &&
      (normalizedQuestion.includes("camara") || normalizedQuestion.includes("camaras")) &&
      (this.extractCameraCount(normalizedQuestion) !== null || normalizedQuestion.includes("kit"))
    );
  }

  private isCalculationQuestion(normalizedQuestion: string) {
    return (
      normalizedQuestion.includes("calcula") ||
      normalizedQuestion.includes("aproximadamente") ||
      normalizedQuestion.includes("cuantos dias") ||
      normalizedQuestion.includes("capacidad") ||
      normalizedQuestion.includes("consumo") ||
      normalizedQuestion.includes("watts") ||
      normalizedQuestion.includes("potencia poe") ||
      normalizedQuestion.includes("cuanto cable") ||
      normalizedQuestion.includes("cobertura wifi") ||
      /\b\d+\s*tb\b/.test(normalizedQuestion)
    );
  }

  private isObjectionQuestion(normalizedQuestion: string) {
    return (
      normalizedQuestion.includes("muy caro") ||
      normalizedQuestion.includes("esta caro") ||
      normalizedQuestion.includes("mas barato") ||
      normalizedQuestion.includes("lo vi barato") ||
      normalizedQuestion.includes("lo voy a pensar") ||
      normalizedQuestion.includes("no conozco la marca") ||
      normalizedQuestion.includes("no se instalar") ||
      normalizedQuestion.includes("no tengo presupuesto")
    );
  }

  private isCompanyInfoQuestion(normalizedQuestion: string) {
    return (
      normalizedQuestion.includes("horario") ||
      normalizedQuestion.includes("sucursal") ||
      normalizedQuestion.includes("sucursales") ||
      normalizedQuestion.includes("garantia") ||
      normalizedQuestion.includes("garantias") ||
      normalizedQuestion.includes("facturacion") ||
      normalizedQuestion.includes("factura") ||
      normalizedQuestion.includes("devolucion") ||
      normalizedQuestion.includes("devoluciones") ||
      normalizedQuestion.includes("soporte tecnico") ||
      normalizedQuestion.includes("instalacion") ||
      normalizedQuestion.includes("formas de pago")
    );
  }

  private isDetailedTroubleshootingQuestion(normalizedQuestion: string) {
    return (
      normalizedQuestion.includes("blanco y negro") ||
      normalizedQuestion.includes("sin color") ||
      normalizedQuestion.includes("no detecta") ||
      normalizedQuestion.includes("dvr no detecta") ||
      normalizedQuestion.includes("celular") ||
      normalizedQuestion.includes("contrasena") ||
      normalizedQuestion.includes("contraseña") ||
      normalizedQuestion.includes("olvide") ||
      normalizedQuestion.includes("reinicia")
    );
  }

  private isBrandKnowledgeQuestion(normalizedQuestion: string) {
    return ["imou", "tp link", "tplink", "ubiquiti", "mikrotik", "seagate", "western digital", "wd"].some((brand) => normalizedQuestion.includes(brand));
  }

  private isOpenSecurityAdviceQuestion(normalizedQuestion: string) {
    return (
      normalizedQuestion.includes("mejorar la seguridad") ||
      normalizedQuestion.includes("seguridad de mi negocio") ||
      normalizedQuestion.includes("seguridad de mi casa") ||
      normalizedQuestion.includes("sin gastar mucho") ||
      normalizedQuestion.includes("economico")
    );
  }

  private isLowCableQuestion(normalizedQuestion: string) {
    return (
      normalizedQuestion.includes("sin cableado") ||
      normalizedQuestion.includes("poco cableado") ||
      normalizedQuestion.includes("mucho cableado") ||
      normalizedQuestion.includes("no tengo cableado") ||
      normalizedQuestion.includes("sin cables")
    );
  }

  private isSolutionScenarioQuestion(normalizedQuestion: string) {
    return (
      normalizedQuestion.includes("necesito vigilar") ||
      normalizedQuestion.includes("quiero poner camaras") ||
      normalizedQuestion.includes("tengo una bodega") ||
      normalizedQuestion.includes("bodega") ||
      normalizedQuestion.includes("estacionamiento") ||
      normalizedQuestion.includes("placas") ||
      normalizedQuestion.includes("rostros") ||
      normalizedQuestion.includes("escuchar conversaciones") ||
      normalizedQuestion.includes("escuela") ||
      normalizedQuestion.includes("restaurante") ||
      normalizedQuestion.includes("gasolinera") ||
      normalizedQuestion.includes("sucursal") ||
      normalizedQuestion.includes("presupuesto") ||
      normalizedQuestion.includes("kit completo") ||
      normalizedQuestion.includes("inteligencia artificial") ||
      normalizedQuestion.includes("personas y vehiculos") ||
      normalizedQuestion.includes("grabar 30 dias")
    );
  }

  private isDiscoveryRequest(normalizedQuestion: string) {
    const broadRequests = [
      "quiero camaras",
      "necesito camaras",
      "quiero poner camaras",
      "necesito poner camaras",
      "quiero seguridad",
      "necesito seguridad",
      "quiero vigilancia",
    ];
    const hasSpecificContext =
      normalizedQuestion.includes("casa") ||
      normalizedQuestion.includes("negocio") ||
      normalizedQuestion.includes("tienda") ||
      normalizedQuestion.includes("farmacia") ||
      normalizedQuestion.includes("escuela") ||
      normalizedQuestion.includes("restaurante") ||
      normalizedQuestion.includes("bodega") ||
      normalizedQuestion.includes("estacionamiento") ||
      normalizedQuestion.includes("placas") ||
      normalizedQuestion.includes("presupuesto") ||
      normalizedQuestion.includes("metros") ||
      normalizedQuestion.includes("pisos");

    return broadRequests.some((request) => normalizedQuestion === request || normalizedQuestion.startsWith(`${request} `)) && !hasSpecificContext;
  }

  private isSolarQuestion(normalizedQuestion: string) {
    return (
      normalizedQuestion.includes("panel solar") ||
      normalizedQuestion.includes("energia solar") ||
      normalizedQuestion.includes("bateria") ||
      normalizedQuestion.includes("sin electricidad") ||
      normalizedQuestion.includes("no tengo electricidad") ||
      normalizedQuestion.includes("solucion autonoma") ||
      normalizedQuestion.includes("autonoma")
    );
  }

  private isPreSalesScenarioQuestion(normalizedQuestion: string) {
    return (
      normalizedQuestion.includes("casa de") ||
      normalizedQuestion.includes("dos pisos") ||
      normalizedQuestion.includes("2 pisos") ||
      normalizedQuestion.includes("cochera") ||
      normalizedQuestion.includes("puerta") ||
      normalizedQuestion.includes("viaje") ||
      normalizedQuestion.includes("otro pais") ||
      normalizedQuestion.includes("tienda") ||
      normalizedQuestion.includes("farmacia") ||
      normalizedQuestion.includes("robando") ||
      normalizedQuestion.includes("robo") ||
      normalizedQuestion.includes("empleados") ||
      normalizedQuestion.includes("sucursales") ||
      normalizedQuestion.includes("controlar accesos") ||
      normalizedQuestion.includes("hora llegan") ||
      normalizedQuestion.includes("primaria") ||
      normalizedQuestion.includes("salones") ||
      normalizedQuestion.includes("patios") ||
      normalizedQuestion.includes("cocina") ||
      normalizedQuestion.includes("mesas") ||
      normalizedQuestion.includes("andenes") ||
      normalizedQuestion.includes("estacionamiento") ||
      normalizedQuestion.includes("placas")
    );
  }

  private detectPlace(normalizedQuestion: string) {
    if (normalizedQuestion.includes("farmacia")) return "farmacia";
    if (normalizedQuestion.includes("tienda") || normalizedQuestion.includes("negocio") || normalizedQuestion.includes("local")) return "negocio";
    if (normalizedQuestion.includes("escuela") || normalizedQuestion.includes("primaria") || normalizedQuestion.includes("salones")) return "escuela";
    if (normalizedQuestion.includes("restaurante") || normalizedQuestion.includes("cocina") || normalizedQuestion.includes("mesas")) return "restaurante";
    if (normalizedQuestion.includes("bodega") || normalizedQuestion.includes("almacen") || normalizedQuestion.includes("andenes")) return "bodega";
    if (normalizedQuestion.includes("estacionamiento") || normalizedQuestion.includes("placas")) return "estacionamiento";
    if (normalizedQuestion.includes("sucursal") || normalizedQuestion.includes("sucursales")) return "sucursal";
    return "casa";
  }

  private isNoInternetQuestion(normalizedQuestion: string) {
    return normalizedQuestion.includes("sin internet") || normalizedQuestion.includes("no tengo internet") || normalizedQuestion.includes("no hay internet");
  }

  private isTroubleshootingQuestion(normalizedQuestion: string) {
    return (
      normalizedQuestion.includes("no funciona") ||
      normalizedQuestion.includes("no prende") ||
      normalizedQuestion.includes("no se ve") ||
      normalizedQuestion.includes("sin video") ||
      normalizedQuestion.includes("offline") ||
      normalizedQuestion.includes("no graba") ||
      normalizedQuestion.includes("falla") ||
      normalizedQuestion.includes("fallando")
    );
  }

  private isHdmiDistanceQuestion(normalizedQuestion: string) {
    return normalizedQuestion.includes("hdmi") && (normalizedQuestion.includes("metros") || normalizedQuestion.includes("distancia") || normalizedQuestion.includes("alcanza"));
  }

  private isZoomQuestion(normalizedQuestion: string) {
    return normalizedQuestion.includes("zoom") || normalizedQuestion.includes("ptz") || normalizedQuestion.includes("varifocal");
  }

  private isCameraRangeQuestion(normalizedQuestion: string) {
    return (
      (normalizedQuestion.includes("camara") || normalizedQuestion.includes("camera")) &&
      (normalizedQuestion.includes("distancia") ||
        normalizedQuestion.includes("metros") ||
        normalizedQuestion.includes("alcanza") ||
        normalizedQuestion.includes("alcance") ||
        normalizedQuestion.includes("ve") ||
        normalizedQuestion.includes("vision nocturna") ||
        normalizedQuestion.includes("nocturna"))
    );
  }

  private isCameraConceptQuestion(normalizedQuestion: string) {
    return (
      normalizedQuestion.includes("concepto") ||
      normalizedQuestion.includes("conceptos") ||
      normalizedQuestion.includes("resolucion") ||
      normalizedQuestion.includes("lente") ||
      normalizedQuestion.includes("wdr") ||
      normalizedQuestion.includes("ip67") ||
      normalizedQuestion.includes("ir") ||
      normalizedQuestion.includes("megapixel") ||
      normalizedQuestion.includes("megapixeles")
    );
  }

  private isBestQuestion(normalizedQuestion: string) {
    return normalizedQuestion.includes("cual es el mejor") || normalizedQuestion.includes("cual es mejor") || normalizedQuestion.includes("mejor camara") || normalizedQuestion.includes("mejor nvr");
  }

  private isHowToUseQuestion(normalizedQuestion: string) {
    return (
      normalizedQuestion.includes("como utilizo") ||
      normalizedQuestion.includes("como uso") ||
      normalizedQuestion.includes("como instalar") ||
      normalizedQuestion.includes("como configuro") ||
      normalizedQuestion.includes("como activo") ||
      normalizedQuestion.includes("activar")
    );
  }

  private extractLookupCode(normalizedQuestion: string) {
    const match = normalizedQuestion.match(/\b(?:modelo|sku|referencia|ficha)\s+([a-z0-9][a-z0-9 ]{3,})$/);
    return match ? match[1].trim() : null;
  }

  private extractCameraCount(normalizedQuestion: string) {
    const match = normalizedQuestion.match(/\b(\d{1,2})\s*(camaras|camara|cams?)\b/);
    return match ? Number(match[1]) : null;
  }

  private extractTerabytes(normalizedQuestion: string) {
    const match = normalizedQuestion.match(/\b(\d{1,2})\s*tb\b/);
    return match ? Number(match[1]) : null;
  }

  private extractMegapixels(normalizedQuestion: string) {
    const match = normalizedQuestion.match(/\b(\d{1,2})\s*(mp|megapixel|megapixeles)\b/);
    return match ? Number(match[1]) : null;
  }

  private extractWatts(normalizedQuestion: string) {
    const match = normalizedQuestion.match(/\b(\d{1,4})\s*(w|watts)\b/);
    return match ? Number(match[1]) : null;
  }

  private extractBudget(normalizedQuestion: string) {
    const match = normalizedQuestion.match(/\$?\s*(\d{4,6})\b/);
    return match ? Number(match[1]) : null;
  }

  private isSearchStopWord(term: string) {
    return [
      "dame",
      "mas",
      "más",
      "detalle",
      "detalles",
      "del",
      "de",
      "la",
      "el",
      "los",
      "las",
      "un",
      "una",
      "modelo",
      "sku",
      "referencia",
      "ficha",
      "producto",
    ].includes(term);
  }

  private isProductDetailQuestion(normalizedQuestion: string) {
    return (
      normalizedQuestion.includes("modelo") ||
      normalizedQuestion.includes("sku") ||
      normalizedQuestion.includes("referencia") ||
      normalizedQuestion.includes("detalles") ||
      normalizedQuestion.includes("ficha")
    );
  }

  private isPackageRequest(normalizedQuestion: string) {
    return (
      normalizedQuestion.includes("armame") ||
      normalizedQuestion.includes("paquete") ||
      normalizedQuestion.includes("kit") ||
      normalizedQuestion.includes("solucion") ||
      normalizedQuestion.includes("sistema")
    ) && (
      normalizedQuestion.includes("casa") ||
      normalizedQuestion.includes("hogar") ||
      normalizedQuestion.includes("negocio") ||
      normalizedQuestion.includes("local") ||
      normalizedQuestion.includes("oficina") ||
      normalizedQuestion.includes("videovigilancia") ||
      normalizedQuestion.includes("vigilancia")
    );
  }

  private isAllowedTopic(normalized: string) {
    const allowed = [
      "camara",
      "camera",
      "dahua",
      "hikvision",
      "hilook",
      "tiandy",
      "dvr",
      "nvr",
      "xvr",
      "ip",
      "analogico",
      "analogo",
      "disco",
      "hdd",
      "router",
      "switch",
      "antena",
      "enlazar",
      "cable",
      "conector",
      "solar",
      "panel",
      "bateria",
      "electricidad",
      "autonoma",
      "alarma",
      "sensor",
      "seguridad",
      "videovigilancia",
      "vigilancia",
      "grabacion",
      "grabar",
      "graba",
      "dias",
      "continuos",
      "audio",
      "zoom",
      "ptz",
      "varifocal",
      "lente",
      "resolucion",
      "megapixel",
      "megapixeles",
      "2mp",
      "5mp",
      "nocturna",
      "ir",
      "wdr",
      "ip67",
      "exterior",
      "interior",
      "poe",
      "red",
      "wifi",
      "internet",
      "celular",
      "telefono",
      "app",
      "remoto",
      "hdmi",
      "monitor",
      "pantalla",
      "metros",
      "distancia",
      "alcance",
      "alcanza",
      "instalacion",
      "instalar",
      "configurar",
      "configuro",
      "activar",
      "activo",
      "utilizo",
      "uso",
      "funciona",
      "falla",
      "offline",
      "video",
      "fuente",
      "voltaje",
      "watts",
      "consumo",
      "potencia",
      "capacidad",
      "tb",
      "gb",
      "calcula",
      "aproximadamente",
      "compatible",
      "compatibilidad",
      "soporta",
      "mezclar",
      "herramientas",
      "accesorios",
      "existencias",
      "cotizacion",
      "cotizar",
      "propuesta",
      "formal",
      "proyecto",
      "visita",
      "tecnica",
      "asesor",
      "whatsapp",
      "horario",
      "horarios",
      "garantia",
      "garantias",
      "factura",
      "facturacion",
      "devolucion",
      "devoluciones",
      "precio",
      "cuesta",
      "costo",
      "descuento",
      "mayoreo",
      "llega",
      "envio",
      "ciudad",
      "tarjeta",
      "fibra",
      "ghz",
      "bodega",
      "almacen",
      "andenes",
      "placas",
      "rostros",
      "escuela",
      "primaria",
      "salones",
      "patios",
      "restaurante",
      "cocina",
      "mesas",
      "gasolinera",
      "estacionamiento",
      "sucursal",
      "sucursales",
      "farmacia",
      "tienda",
      "cochera",
      "puerta",
      "viaje",
      "pais",
      "robando",
      "robo",
      "empleados",
      "accesos",
      "llegan",
      "presupuesto",
      "vehiculos",
      "caro",
      "barato",
      "pensar",
      "marca",
      "imou",
      "tp",
      "tplink",
      "ubiquiti",
      "mikrotik",
      "seagate",
      "western",
      "wd",
      "blanco",
      "negro",
      "contrasena",
      "contraseña",
      "olvide",
      "reinicia",
      "detecta",
      "kit",
      "paquete",
      "sistema",
      "solucion",
      "local",
      "oficina",
      "negocio",
      "empresa",
      "recomienda",
      "recomiendas",
      "recomendar",
      "mejor",
      "concepto",
      "conceptos",
      "modelo",
      "sku",
      "referencia",
      "detalles",
      "ficha",
    ];

    return allowed.some((term) => normalized.includes(term));
  }

  private toAdvisorProduct(product: OdooProduct): AdvisorProduct {
    return {
      name: product.name,
      sku: product.sku,
      model: product.clave,
      brand: product.brand,
      category: product.category,
      price: product.price,
      stock: product.stock,
      image: product.image,
    };
  }

  private normalize(value: string) {
    return value
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, " ")
      .replace(/\bcamaar\b/g, "camara")
      .replace(/\bcmara\b/g, "camara")
      .replace(/\bcamaraas\b/g, "camaras")
      .replace(/\bestacionamineto\b/g, "estacionamiento")
      .replace(/\bestacionamieto\b/g, "estacionamiento")
      .replace(/\bestacionaminto\b/g, "estacionamiento")
      .replace(/\brecomienbdas\b/g, "recomiendas")
      .replace(/\brecominedas\b/g, "recomiendas")
      .replace(/\s+/g, " ")
      .trim();
  }

  private money(value: number) {
    return value.toLocaleString("es-MX", { style: "currency", currency: "MXN" });
  }

  private formatProductAnswer(intro: string, products: AdvisorProduct[]) {
    return [
      intro,
      ...products.slice(0, 3).map((product, index) =>
        `${index + 1}. ${product.name} | Modelo: ${product.model} | SKU: ${product.sku} | Precio: ${this.money(product.price)} | Stock: ${product.stock}`,
      ),
      "No invento compatibilidades: valida modelo exacto, canal, resolucion, tipo de cableado y energia antes de comprar.",
    ].join("\n");
  }
}
