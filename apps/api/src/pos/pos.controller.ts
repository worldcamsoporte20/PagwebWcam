import { Body, Controller, Get, Param, Post, Query } from "@nestjs/common";
import { IsArray, IsIn, IsNumber, IsOptional, IsString, ValidateNested } from "class-validator";
import { Type } from "class-transformer";
import { OdooService } from "../odoo/odoo.service";

class ProcessPaymentDto {
  @IsNumber()
  orderId!: number;

  @IsString()
  paymentMethod!: string;

  @IsNumber()
  amount!: number;

  @IsString()
  orderName!: string;
}

class QuickSaleItemDto {
  @IsNumber()
  productId!: number;

  @IsNumber()
  qty!: number;
}

class QuickSaleDto {
  @IsNumber()
  partnerId!: number;

  @IsOptional()
  @IsNumber()
  pricelistId?: number;

  @IsString()
  @IsIn(["cash", "card", "account"])
  paymentMethod!: "cash" | "card" | "account";

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => QuickSaleItemDto)
  items!: QuickSaleItemDto[];
}

class PricePreviewDto {
  @IsNumber()
  partnerId!: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => QuickSaleItemDto)
  items!: QuickSaleItemDto[];
}

@Controller("pos")
export class PosController {
  constructor(private readonly odoo: OdooService) {}

  @Get("quotes")
  getQuotes() {
    return this.odoo.getSalesOrders(["sale", "done"], false);
  }

  @Get("barcode/:code")
  getByBarcode(@Param("code") code: string) {
    return this.odoo.getProductByBarcode(code);
  }

  @Get("customers")
  getCustomers(@Query("search") search?: string) {
    return this.odoo.getCustomers(search ?? "");
  }

  @Get("pricelists")
  getPricelists() {
    return this.odoo.getPricelists();
  }

  @Post("process-payment")
  processPayment(@Body() body: ProcessPaymentDto) {
    const method = body.paymentMethod === "card" ? "card" : "cash";
    return this.odoo.processOrderPayment(body.orderId, method, body.amount, body.orderName);
  }

  @Post("quick-sale")
  quickSale(@Body() body: QuickSaleDto) {
    return this.odoo.createConfirmAndPayQuickSale(body);
  }

  @Post("price-preview")
  pricePreview(@Body() body: PricePreviewDto) {
    return this.odoo.getPricePreview(body);
  }
}
