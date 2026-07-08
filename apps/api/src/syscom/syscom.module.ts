import { Module } from "@nestjs/common";
import { SyscomService } from "./syscom.service";

@Module({
  providers: [SyscomService],
  exports: [SyscomService],
})
export class SyscomModule {}
