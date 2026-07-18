import { Body, Controller, Get, Param, Post, Query, Res } from "@nestjs/common";
import { IsArray, IsOptional, IsString } from "class-validator";
import { CatalogService } from "./catalog.service";

class AdvisorChatDto {
  @IsOptional()
  @IsString()
  message?: string;

  @IsOptional()
  @IsArray()
  contextProducts?: unknown[];
}

@Controller("catalog")
export class CatalogController {
  constructor(private readonly catalog: CatalogService) {}

  @Get("products")
  async getProducts(@Res({ passthrough: true }) response: { setHeader(name: string, value: string): void }) {
    const result = await this.catalog.findProductsResult();
    response.setHeader("X-Catalog-Status", result.status);
    if (result.message) {
      response.setHeader("X-Catalog-Message", result.message);
    }
    return result.products;
  }

  @Get("products-page")
  async getProductsPage(
    @Query("search") search: string | undefined,
    @Query("brand") brand: string | undefined,
    @Query("category") category: string | undefined,
    @Query("cameraResolution") cameraResolution: string | undefined,
    @Query("cameraType") cameraType: string | undefined,
    @Query("onlyStock") onlyStock: string | undefined,
    @Query("sort") sort: "price-asc" | "price-desc" | "name-asc" | "stock-desc" | undefined,
    @Query("limit") limit: string | undefined,
    @Query("offset") offset: string | undefined,
    @Res({ passthrough: true }) response: { setHeader(name: string, value: string): void },
  ) {
    const result = await this.catalog.findProductsPageResult({
      search,
      brand,
      category,
      cameraResolution,
      cameraType,
      onlyStock: onlyStock === "true",
      sort,
      limit: Number(limit),
      offset: Number(offset),
    });
    response.setHeader("X-Catalog-Status", result.status);
    if (result.message) {
      response.setHeader("X-Catalog-Message", result.message);
    }
    return result;
  }

  @Get("products/:productId/image")
  async getProductImage(@Param("productId") productId: string, @Res() response: any) {
    const image = await this.catalog.findProductImage(productId);
    if (!image) {
      response.status(404).send();
      return;
    }

    response.setHeader("Content-Type", "image/png");
    response.setHeader("Cache-Control", "public, max-age=300");
    response.send(image);
  }

  @Get("syscom-products/:productId/image")
  async getSyscomProductImage(@Param("productId") productId: string, @Res() response: any) {
    const image = await this.catalog.findSyscomProductImage(productId);
    if (!image) {
      response.status(404).send();
      return;
    }

    response.setHeader("Content-Type", image.contentType);
    response.setHeader("Cache-Control", "public, max-age=86400");
    response.send(image.data);
  }

  @Get("products/:productId/warehouses")
  getProductWarehouses(@Param("productId") productId: string) {
    return this.catalog.findWarehouseAvailability(productId);
  }

  @Get("products/:productId")
  async getProduct(@Param("productId") productId: string, @Res({ passthrough: true }) response: { setHeader(name: string, value: string): void }) {
    const result = await this.catalog.findProductResult(productId);
    response.setHeader("X-Catalog-Status", result.status);
    if (result.message) {
      response.setHeader("X-Catalog-Message", result.message);
    }
    return result.product;
  }

  @Get("odoo-status")
  getOdooStatus() {
    return this.catalog.getOdooStatus();
  }

  @Get("syscom-status")
  getSyscomStatus() {
    return this.catalog.getSyscomStatus();
  }

  @Post("advisor-chat")
  advisorChat(@Body() body: AdvisorChatDto) {
    return this.catalog.answerAdvisorChat(body.message ?? "", body.contextProducts);
  }
}
