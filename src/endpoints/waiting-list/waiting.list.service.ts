import { Injectable } from "@nestjs/common";
import { ApiConfigService } from "src/common/api-config/api.config.service";
import { CachingService } from "src/common/caching/caching.service";
import { AddressUtils } from "src/utils/address.utils";
import { BinaryUtils } from "src/utils/binary.utils";
import { Constants } from "src/utils/constants";
import { VmQueryService } from "../vm.query/vm.query.service";
import { WaitingList } from "./entities/waiting.list";

@Injectable()
export class WaitingListService {
  constructor(
    private readonly vmQueryService: VmQueryService,
    private readonly apiConfigService: ApiConfigService,
    private readonly cachingService: CachingService,
  ) {}

  async getWaitingList(): Promise<WaitingList[]> {
    return await this.getFullWaitingList();
  }

  async getWaitingListForAddress(address: string): Promise<WaitingList[]> {
    let fullWaitingList = await this.getFullWaitingList();

    return fullWaitingList.filter(x => x.address === address);
  }

  async getWaitingListCount(): Promise<number> {
    let fullWaitingList = await this.getFullWaitingList();
    
    return fullWaitingList.length;
  }

  private async getFullWaitingList(): Promise<WaitingList[]> {
    return await this.cachingService.getOrSetCache(
      'waiting-list',
      async () => await this.getFullWaitingListRaw(),
      Constants.oneMinute() * 5
    );
  }

  private async getFullWaitingListRaw(): Promise<WaitingList[]> {
    const fullWaitingListEncoded = await this.vmQueryService.vmQuery(
      this.apiConfigService.getDelegationContractAddress(),
      'getFullWaitingList',
      undefined,
      []
    );

    const fullWaitingList: WaitingList[] = fullWaitingListEncoded.reduce((result, _, index, array) => {
      if (index % 3 === 0) {
        const [publicKeyEncoded, valueEncoded, nonceEncoded] = array.slice(index, index + 3);

        const publicKey = Buffer.from(publicKeyEncoded, 'base64').toString('hex');
        const address = AddressUtils.bech32Encode(publicKey);
        const value = BinaryUtils.hexToBigInt(valueEncoded).toString();
        const nonce = BinaryUtils.hexToNumber(nonceEncoded);

        let waitingList: WaitingList = { address, value, nonce, rank: 0 };

        // @ts-ignore
        result.push(waitingList);
      }

      return result;
    }, []);

    for (let [index, waitingListItem] of fullWaitingList.entries()) {
      waitingListItem.rank = index + 1;
    }

    return fullWaitingList;
  }
}