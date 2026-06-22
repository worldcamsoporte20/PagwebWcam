import { Module } from "@nestjs/common";
import { OdooModule } from "../odoo/odoo.module";
import { PosController } from "./pos.controller";

@Module({
  imports: [OdooModule],
  controllers: [PosController],
})
export class PosModule {}
