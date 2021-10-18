import { forwardRef, Module } from "@nestjs/common";
import { CommonModule } from "src/common/common.module";
import { NodeModule } from "../nodes/node.module";
import { IdentitiesController } from "./identities.controller";
import { IdentitiesService } from "./identities.service";

@Module({
  imports: [
    forwardRef(() => CommonModule),
    forwardRef(() => NodeModule),
  ],
  controllers: [
    IdentitiesController,
  ],
  providers: [
    IdentitiesService,
  ],
  exports: [
    IdentitiesService,
  ]
})
export class IdentitiesModule { }