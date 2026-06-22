import { Body, Controller, Get, Post, Res } from "@nestjs/common";
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

  @Get("odoo-status")
  getOdooStatus() {
    return this.catalog.getOdooStatus();
  }

  @Post("advisor-chat")
  advisorChat(@Body() body: AdvisorChatDto) {
    return this.catalog.answerAdvisorChat(body.message ?? "", body.contextProducts);
  }
}
