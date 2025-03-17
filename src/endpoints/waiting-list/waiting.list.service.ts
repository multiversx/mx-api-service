import { AddressUtils, NumberUtils } from "@multiversx/sdk-nestjs-common";
import { CacheService } from "@multiversx/sdk-nestjs-cache";
import { Injectable } from "@nestjs/common";
import { ApiConfigService } from "src/common/api-config/api.config.service";
import { QueryPagination } from "src/common/entities/query.pagination";
import { CacheInfo } from "src/utils/cache.info";
import { VmQueryService } from "../vm.query/vm.query.service";
import { WaitingList } from "./entities/waiting.list";

@Injectable()
export class WaitingListService {
  constructor(
    private readonly vmQueryService: VmQueryService,
    private readonly apiConfigService: ApiConfigService,
    private readonly cachingService: CacheService,
  ) { }

  async getWaitingList(queryPagination: QueryPagination): Promise<WaitingList[]> {
    const { from, size } = queryPagination;

    let waitingList = await this.getFullWaitingList();

    waitingList = waitingList.slice(from, from + size);

    return waitingList;
  }

  async getWaitingListForAddress(address: string): Promise<WaitingList[]> {
    const fullWaitingList = await this.getFullWaitingList();

    return fullWaitingList.filter(x => x.address === address);
  }

  async getWaitingListCount(): Promise<number> {
    const fullWaitingList = await this.getFullWaitingList();

    return fullWaitingList.length;
  }

  private async getFullWaitingList(): Promise<WaitingList[]> {
    return await this.cachingService.getOrSet(
      CacheInfo.FullWaitingList.key,
      async () => await this.getFullWaitingListRaw(),
      CacheInfo.FullWaitingList.ttl
    );
  }

  private async getFullWaitingListRaw(): Promise<WaitingList[]> {
    const delegationContractAddress = this.apiConfigService.getDelegationContractAddress();
    if (!delegationContractAddress) {
      return [];
    }

    const fullWaitingListEncoded = await this.vmQueryService.vmQuery(
      delegationContractAddress,
      'getFullWaitingList',
    );

    const fullWaitingList: WaitingList[] = fullWaitingListEncoded.reduce((result, _, index, array) => {
      if (index % 3 === 0) {
        const [publicKeyEncoded, valueEncoded, nonceEncoded] = array.slice(index, index + 3);

        const publicKey = Buffer.from(publicKeyEncoded, 'base64').toString('hex');
        const address = AddressUtils.bech32Encode(publicKey);
        const value = NumberUtils.numberDecode(valueEncoded);
        const nonce = parseInt(NumberUtils.numberDecode(nonceEncoded));

        const waitingList: WaitingList = { address, value, nonce, rank: 0 };

        // @ts-ignore
        result.push(waitingList);
      }

      return result;
    }, []);

    for (const [index, waitingListItem] of fullWaitingList.entries()) {
      waitingListItem.rank = index + 1;
    }

    return fullWaitingList;
  }
}
