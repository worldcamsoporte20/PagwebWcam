import { Module } from "@nestjs/common";
import { PchService } from "./pch.service";

@Module({
  providers: [PchService],
  exports: [PchService],
})
export class PchModule {}
