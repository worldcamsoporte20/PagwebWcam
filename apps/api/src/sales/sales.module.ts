import { Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module";
import { DatabaseModule } from "../database/database.module";
import { OdooModule } from "../odoo/odoo.module";
import { SalesController } from "./sales.controller";
import { SalesService } from "./sales.service";

@Module({
  imports: [AuthModule, DatabaseModule, OdooModule],
  controllers: [SalesController],
  providers: [SalesService],
})
export class SalesModule {}
