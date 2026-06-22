import { Module } from "@nestjs/common";
import { CacheService } from "../common/cache.service";
import { OdooModule } from "../odoo/odoo.module";
import { CatalogController } from "./catalog.controller";
import { CatalogService } from "./catalog.service";

@Module({
  imports: [OdooModule],
  controllers: [CatalogController],
  providers: [CatalogService, CacheService],
})
export class CatalogModule {}
