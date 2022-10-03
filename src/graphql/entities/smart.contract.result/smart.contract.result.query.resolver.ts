import { Resolver } from "@nestjs/graphql";
import { SmartContractResult } from "src/endpoints/sc-results/entities/smart.contract.result";
import { SmartContractResultService } from "src/endpoints/sc-results/scresult.service";
import { SmartContractResultQuery } from "./smart.contract.result.query";

@Resolver(() => SmartContractResult)
export class SmartContractResultQueryResolver extends SmartContractResultQuery {
  constructor(smartContractResultsService: SmartContractResultService) {
    super(smartContractResultsService);
  }
}
