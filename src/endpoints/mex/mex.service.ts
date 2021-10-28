import { Injectable } from "@nestjs/common";
import { CachingService } from "src/common/caching/caching.service";
import { ElasticService } from "src/common/elastic/elastic.service";
import { ElasticQuery } from "src/common/elastic/entities/elastic.query";
import { QueryConditionOptions } from "src/common/elastic/entities/query.condition.options";
import { QueryType } from "src/common/elastic/entities/query.type";
import { AddressUtils } from "src/utils/address.utils";
import { ApiUtils } from "src/utils/api.utils";
import { Constants } from "src/utils/constants";
import { MexDay } from "./entities/mex.day";
import { MexWeek } from "./entities/mex.week";

@Injectable()
export class MexService {
  constructor(
    private readonly elasticService: ElasticService,
    private readonly cachingService: CachingService,
  ) { }

  async getMexForAddress(address: string): Promise<MexWeek[]> {
    return await this.cachingService.getOrSetCache(
      `mex:${address}`,
      async () => await this.getMexForAddressRaw(address),
      Constants.oneMonth()
    )
  }

  async getMexForAddressRaw(address: string): Promise<MexWeek[]> {
    AddressUtils.bech32Decode(address);


    const elasticQuery: ElasticQuery = ElasticQuery.create()
      .withCondition(QueryConditionOptions.must, [QueryType.Match('address', address)])

    const mexForAddress: MexWeek[] = [];

    for (let week = 1; week <= 12; week++) {
      const snapshotCollection = [2].includes(week) ? 
        `snapshot-week-${week}-v2`
        : `snapshot-week-${week}`;
      const mexRewardsCollection =  `mex-week-${week}-v3`;

      const snapshots = await this.elasticService.getList(snapshotCollection, 'snapshot', elasticQuery, true);
      const mex = await this.elasticService.getList(mexRewardsCollection, 'mex', elasticQuery, true);

      let undelegates = [];

      if (week === 1) {
        const undelegatedCollection = `undelegated-week-1-v2`;

        undelegates = await this.elasticService.getList(undelegatedCollection, 'undelegated', elasticQuery, true);
      }

      for (let day = 0; day < 7; day++) {
        const snapshot = snapshots.find(({ dayOfTheWeek }) => dayOfTheWeek === day);

        let mexDay: MexDay = new MexDay;

        if (snapshot) {
          mexDay = ApiUtils.mergeObjects(new MexDay(), snapshot);
        }

        if (undelegates.length) {
          const undelegated = undelegates.find(({ dayOfTheWeek }) => dayOfTheWeek === day);

          if (undelegated && undelegated.unstaked) {
            mexDay.unstaked = (BigInt(mexDay.unstaked) + BigInt(undelegated.unstaked)).toString();
          }
        }

        if (!mexForAddress[week - 1]) {
          mexForAddress[week - 1] = new MexWeek();

          if (mex && mex[0] && mex[0].value) {
            mexForAddress[week - 1].mex = mex[0].value;
          }
        }

        mexForAddress[week - 1].days.push(mexDay);
      }

      const sunday = mexForAddress[week - 1].days[0];
      mexForAddress[week - 1].days.shift();
      mexForAddress[week - 1].days.push(sunday);
    }

    return mexForAddress;
  }
}