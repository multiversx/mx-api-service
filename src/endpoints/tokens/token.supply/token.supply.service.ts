import { Injectable } from "@nestjs/common";
import { TokenDetailed } from "../entities/token.detailed";
import { TokenSupplyResult } from "../entities/token.supply.result";
import { TokenSupplyOptions } from "../entities/token.supply.options";
import { EsdtService } from "../../esdt/esdt.service";
import { NumberUtils } from "@multiversx/sdk-nestjs-common";

@Injectable()
export class TokenSupplyService {
  constructor(
    private readonly esdtService: EsdtService,
  ) { }

  async applySupply(token: TokenDetailed, supplyOptions?: TokenSupplyOptions): Promise<void> {
    const supply = await this.esdtService.getTokenSupply(token.identifier);
    const denominated = supplyOptions && supplyOptions.denominated;

    if (denominated === true) {
      token.supply = NumberUtils.denominate(BigInt(supply.totalSupply), token.decimals);
      token.circulatingSupply = NumberUtils.denominate(BigInt(supply.circulatingSupply), token.decimals);
    } else if (denominated === false) {
      token.supply = supply.totalSupply;
      token.circulatingSupply = supply.circulatingSupply;
    } else {
      token.supply = NumberUtils.denominate(BigInt(supply.totalSupply), token.decimals).toFixed();
      token.circulatingSupply = NumberUtils.denominate(BigInt(supply.circulatingSupply), token.decimals).toFixed();
    }

    if (supply.minted) {
      token.minted = supply.minted;
    }

    if (supply.burned) {
      token.burnt = supply.burned;
    }

    if (supply.initialMinted) {
      token.initialMinted = supply.initialMinted;
    }
  }

  async getTokenSupply(identifier: string, supplyOptions?: TokenSupplyOptions): Promise<TokenSupplyResult | undefined> {
    let totalSupply: string | number;
    let circulatingSupply: string | number;

    const properties = await this.esdtService.getEsdtTokenProperties(identifier);
    if (!properties) {
      return undefined;
    }

    const result = await this.esdtService.getTokenSupply(identifier);
    const denominated = supplyOptions && supplyOptions.denominated;

    if (denominated === true) {
      totalSupply = NumberUtils.denominateString(result.totalSupply, properties.decimals);
      circulatingSupply = NumberUtils.denominateString(result.circulatingSupply, properties.decimals);
    } else if (denominated === false) {
      totalSupply = result.totalSupply;
      circulatingSupply = result.circulatingSupply;
    } else {
      totalSupply = NumberUtils.denominateString(result.totalSupply, properties.decimals).toFixed();
      circulatingSupply = NumberUtils.denominateString(result.circulatingSupply, properties.decimals).toFixed();
    }

    let lockedAccounts = result.lockedAccounts;
    if (lockedAccounts !== undefined) {
      lockedAccounts = JSON.parse(JSON.stringify(lockedAccounts));
      if (denominated === true) {
        // @ts-ignore
        for (const lockedAccount of lockedAccounts) {
          lockedAccount.balance = NumberUtils.denominateString(lockedAccount.balance.toString(), properties.decimals);
        }
      }
    }

    return {
      supply: totalSupply,
      circulatingSupply: circulatingSupply,
      minted: denominated === true && result.minted ? NumberUtils.denominateString(result.minted, properties.decimals) : result.minted,
      burnt: denominated === true && result.burned ? NumberUtils.denominateString(result.burned, properties.decimals) : result.burned,
      initialMinted: denominated === true && result.initialMinted ? NumberUtils.denominateString(result.initialMinted, properties.decimals) : result.initialMinted,
      lockedAccounts: lockedAccounts?.sortedDescending(account => Number(account.balance)),
    };
  }
}
