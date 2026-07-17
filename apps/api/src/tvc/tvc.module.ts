import { Module } from "@nestjs/common";
import { TvcService } from "./tvc.service";

@Module({
  providers: [TvcService],
  exports: [TvcService],
})
export class TvcModule {}
