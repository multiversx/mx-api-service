import { Injectable } from "@nestjs/common";
import { GatewayService } from "./gateway.service";
import { GatewayComponentRequest } from "./entities/gateway.component.request";
import { IterateKeysResult } from "./entities/iterate.keys.result";

@Injectable()
export class GatewayIterateKeysService {
  private readonly numKeysPerRequest = 5000;
  private readonly maxAttemptsPerRequest = 3;
  private readonly busyRetryDelayMs = 300;

  constructor(
    private readonly gatewayService: GatewayService,
  ) { }

  async iterateKeys(address: string, keyPrefix?: string): Promise<IterateKeysResult> {
    const keyPrefixHex = Buffer.from(keyPrefix ?? '').toString('hex');
    const result = new IterateKeysResult();
    let iteratorState: string[] = [];

    do {
      const response = await this.getKeysPage(address, iteratorState);

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

  private async getKeysPage(address: string, iteratorState: string[]): Promise<any> {
    for (let attempt = 1; ; attempt++) {
      try {
        return await this.gatewayService.create('address/iterate-keys', GatewayComponentRequest.addressIterateKeys, {
          address,
          numKeys: this.numKeysPerRequest,
          iteratorState,
        });
      } catch (error: any) {
        const isBusy = error?.response?.error?.includes('too many concurrent trie operations');
        if (!isBusy || attempt >= this.maxAttemptsPerRequest) {
          throw error;
        }

        await new Promise(resolve => setTimeout(resolve, this.busyRetryDelayMs * attempt));
      }
    }
  }
}
