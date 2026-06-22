import { Body, Controller, Get, Headers, Param, Patch, Post } from "@nestjs/common";
import { Type } from "class-transformer";
import { IsArray, IsNumber, IsOptional, IsString, ValidateNested } from "class-validator";
import { AuthService } from "../auth/auth.service";
import { OdooService } from "../odoo/odoo.service";
import { SalesService } from "./sales.service";

class SaleItemDto {
  @IsNumber()
  productId!: number;

  @IsNumber()
  qty!: number;
}

class CreateQuotationDto {
  @IsNumber()
  partnerId!: number;

  @IsOptional()
  @IsString()
  paymentTerm?: string;

  @IsOptional()
  @IsString()
  paymentMethod?: string;

  @IsOptional()
  @IsString()
  quotationTemplate?: string;

  @IsOptional()
  @IsString()
  fiscalUse?: string;

  @IsOptional()
  @IsString()
  dueDate?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SaleItemDto)
  items!: SaleItemDto[];
}

@Controller("sales")
export class SalesController {
  constructor(
    private readonly auth: AuthService,
    private readonly odoo: OdooService,
    private readonly sales: SalesService,
  ) {}

  @Get("orders")
  async getOrders(@Headers("authorization") authorization?: string) {
    await this.auth.requireEmployee(authorization);
    return this.sales.listLocalQuotations();
  }

  @Post("quotations")
  async createQuotation(@Headers("authorization") authorization: string | undefined, @Body() body: CreateQuotationDto) {
    const user = await this.auth.requireEmployee(authorization);
    return this.sales.createLocalQuotation(body, user.email);
  }

  @Patch("quotations/:id")
  async updateQuotation(@Headers("authorization") authorization: string | undefined, @Param("id") id: string, @Body() body: CreateQuotationDto) {
    await this.auth.requireEmployee(authorization);
    return this.sales.updateLocalQuotation(id, body);
  }

  @Get("odoo-orders")
  async getOdooOrders(@Headers("authorization") authorization?: string) {
    await this.auth.requireEmployee(authorization);
    return this.odoo.getSalesOrders(["draft", "sent", "sale", "done", "cancel"], true, 80);
  }

  @Get("quotation-templates")
  async getQuotationTemplates(@Headers("authorization") authorization?: string) {
    await this.auth.requireEmployee(authorization);
    return this.odoo.getQuotationTemplates();
  }

  @Post("quotations/:id/send")
  async sendQuotation(@Headers("authorization") authorization: string | undefined, @Param("id") id: string) {
    await this.auth.requireEmployee(authorization);
    return this.sales.markSent(id);
  }

  @Post("quotations/:id/confirm")
  async confirmQuotation(@Headers("authorization") authorization: string | undefined, @Param("id") id: string) {
    await this.auth.requireEmployee(authorization);
    return this.sales.confirmInOdoo(id);
  }
}
