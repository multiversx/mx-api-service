import { Injectable } from "@nestjs/common";
import { GatewayService } from "./gateway.service";
import { GatewayComponentRequest } from "./entities/gateway.component.request";
import { IterateKeysPageLimitError } from "./exceptions/iterate.keys.page.limit.error";

@Injectable()
export class GatewayIterateKeysService {
  private readonly numKeysPerRequest = 5000;
  private readonly maxPages = 40;
  private readonly maxAttemptsPerRequest = 3;
  private readonly busyRetryDelayMs = 300;

  constructor(
    private readonly gatewayService: GatewayService,
  ) { }

  async iterateKeys(address: string, keyPrefix?: string): Promise<Record<string, string>> {
    const keyPrefixHex = Buffer.from(keyPrefix ?? '').toString('hex');
    const pairs: Record<string, string> = {};
    let iteratorState: string[] = [];
    let pages = 0;

    do {
      if (pages >= this.maxPages) {
        throw new IterateKeysPageLimitError();
      }

      pages++;
      const response = await this.getKeysPage(address, iteratorState);

      for (const [key, value] of Object.entries<string>(response?.pairs ?? {})) {
        if (key.startsWith(keyPrefixHex)) {
          pairs[key] = value;
        }
      }

      iteratorState = response?.newIteratorState ?? [];
    } while (iteratorState.length > 0);

    return pairs;
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
