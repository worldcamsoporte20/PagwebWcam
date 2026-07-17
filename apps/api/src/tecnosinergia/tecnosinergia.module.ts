import { Module } from "@nestjs/common";
import { TecnosinergiaService } from "./tecnosinergia.service";

@Module({
  providers: [TecnosinergiaService],
  exports: [TecnosinergiaService],
})
export class TecnosinergiaModule {}
