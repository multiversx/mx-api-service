import { Injectable } from "@nestjs/common";
import { GatewayService } from "./gateway.service";
import { GatewayComponentRequest } from "./entities/gateway.component.request";
import { IterateKeysResult } from "./entities/iterate.keys.result";

@Injectable()
export class GatewayIterateKeysService {
  private readonly numKeysPerRequest = 5000;

  constructor(
    private readonly gatewayService: GatewayService,
  ) { }

  async iterateKeys(address: string, keyPrefix?: string, errorHandler?: (error: any) => Promise<boolean>): Promise<IterateKeysResult> {
    const keyPrefixHex = Buffer.from(keyPrefix ?? '').toString('hex');
    const result = new IterateKeysResult();
    let iteratorState: string[] = [];

    do {
      const response = await this.gatewayService.create('address/iterate-keys', GatewayComponentRequest.addressIterateKeys, {
        address,
        numKeys: this.numKeysPerRequest,
        iteratorState,
      }, errorHandler);

      result.blockInfo = result.blockInfo ?? response?.blockInfo;

      for (const [key, value] of Object.entries<string>(response?.pairs ?? {})) {
        if (key.startsWith(keyPrefixHex)) {
          result.pairs[key] = value;
        }
      }

      iteratorState = response?.newIteratorState ?? [];
    } while (iteratorState.length > 0);

    return result;
  }
}
