import { Args, Float, Query, Resolver } from "@nestjs/graphql";
import { SmartContractResultService } from "src/endpoints/sc-results/scresult.service";
import { SmartContractResult } from "src/endpoints/sc-results/entities/smart.contract.result";
import { GetSmartContractHashInput, GetSmartContractResultInput } from "./smart.contract.result.input";
import { SmartContractResultFilter } from "src/endpoints/sc-results/entities/smart.contract.result.filter";
import { QueryPagination } from "src/common/entities/query.pagination";
import { NotFoundException } from "@nestjs/common";

@Resolver()
export class SmartContractResultQuery {
  constructor(protected readonly smartContractResultService: SmartContractResultService) { }

  @Query(() => [SmartContractResult], { name: "results", description: "Retrieve all smart contract results for the given input." })
  public async getScResults(@Args("input", { description: "Input to retrieve the given smart contract results for." }) input: GetSmartContractResultInput): Promise<SmartContractResult[]> {
    return await this.smartContractResultService.getScResults(
      new QueryPagination({
        from: input.from,
        size: input.size,
      }),
      new SmartContractResultFilter({
        miniBlockHash: input.miniBlockHash,
        originalTxHashes: input.originalTxHashes,
      })
    );
  }

  @Query(() => Float, { name: "resultsCount", description: "Returns total number of smart contracts." })
  public async getScResultsCount(): Promise<number> {
    return await this.smartContractResultService.getScResultsCount();
  }

  @Query(() => SmartContractResult, { name: "result", description: "Retrieve the smart contract details for the given input.", nullable: true })
  public async getScResult(@Args("input", { description: "Input to retrieve the given smart contract for." }) input: GetSmartContractHashInput): Promise<SmartContractResult | undefined> {
    try {
      return await this.smartContractResultService.getScResult(input.scHash);
    } catch {
      throw new NotFoundException('Smart contract not found');
    }
  }
}
