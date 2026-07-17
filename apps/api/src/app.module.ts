import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { ThrottlerModule } from "@nestjs/throttler";

import { AuthModule } from "./auth/auth.module";
import { BannerModule } from "./banner/banner.module";
import { CatalogModule } from "./catalog/catalog.module";
import { HealthController } from "./health.controller";
import { OdooModule } from "./odoo/odoo.module";
import { PosModule } from "./pos/pos.module";
import { SalesModule } from "./sales/sales.module";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [".env", "../../.env"],
    }),
    ThrottlerModule.forRoot([
      {
        ttl: 60_000,
        limit: 120,
      },
    ]),
    OdooModule,
    CatalogModule,
    AuthModule,
    PosModule,
    SalesModule,
    BannerModule, // ← Agregar aquí
  ],
  controllers: [HealthController],
})
export class AppModule {}