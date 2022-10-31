import { Module } from "@nestjs/common";
import { WaitingListModule as InternalWaitingListModule } from "src/endpoints/waiting-list/waiting.list.module";
import { WaitingListResolver } from "./waiting.list.resolver";

@Module({
  imports: [InternalWaitingListModule],
  providers: [WaitingListResolver],
})
export class WaitingListModule { }
