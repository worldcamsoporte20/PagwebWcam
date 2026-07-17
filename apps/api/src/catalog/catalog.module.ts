import { Module } from "@nestjs/common";
import { CacheService } from "../common/cache.service";
import { OdooModule } from "../odoo/odoo.module";
import { PchModule } from "../pch/pch.module";
import { SyscomModule } from "../syscom/syscom.module";
import { TecnosinergiaModule } from "../tecnosinergia/tecnosinergia.module";
import { TvcModule } from "../tvc/tvc.module";
import { CatalogController } from "./catalog.controller";
import { CatalogService } from "./catalog.service";

@Module({
  imports: [OdooModule, SyscomModule, TvcModule, TecnosinergiaModule, PchModule],
  controllers: [CatalogController],
  providers: [CatalogService, CacheService],
})
export class CatalogModule {}
