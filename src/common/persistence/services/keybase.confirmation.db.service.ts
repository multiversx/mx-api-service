import { ErrorLoggerAsync, PassthroughAsync } from "@multiversx/sdk-nestjs";
import { Repository } from "typeorm";
import { MetricsEvents } from "src/utils/metrics-events.constants";
import { LogPerformanceAsync } from "src/utils/log.performance.decorator";
import { InjectRepository } from "@nestjs/typeorm";
import { isPassThrough, PersistenceService } from "../persistence.service";
import { KeybaseConfirmationDb } from "../entities/keybase.confirmation.db";
import { Injectable } from "@nestjs/common";

@Injectable()
export class KeybaseConfirmationDbService extends PersistenceService {
  constructor(
    @InjectRepository(KeybaseConfirmationDb)
    private readonly keybaseConfirmationRepository: Repository<KeybaseConfirmationDb>,
  ) {
    super();
  }

  @PassthroughAsync(isPassThrough, null)
  @LogPerformanceAsync(MetricsEvents.SetPersistenceDuration, 'getKeybaseConfirmationForIdentity')
  @ErrorLoggerAsync({ logArgs: true })
  async getKeybaseConfirmationForIdentity(identity: string): Promise<string[] | undefined> {
    const keybaseConfirmation: KeybaseConfirmationDb | null = await this.keybaseConfirmationRepository.findOne({ where: { identity } });
    if (!keybaseConfirmation) {
      return undefined;
    }

    return keybaseConfirmation.keys;
  }

  @PassthroughAsync(isPassThrough, null)
  @LogPerformanceAsync(MetricsEvents.SetPersistenceDuration, 'setKeybaseConfirmationForIdentity')
  @ErrorLoggerAsync({ logArgs: true })
  async setKeybaseConfirmationForIdentity(identity: string, keys: string[]): Promise<void> {
    let keybaseConfirmation = await this.keybaseConfirmationRepository.findOne({ where: { identity } });
    if (!keybaseConfirmation) {
      keybaseConfirmation = new KeybaseConfirmationDb();
    }

    keybaseConfirmation.identity = identity;
    keybaseConfirmation.keys = keys;

    await this.save(this.keybaseConfirmationRepository, keybaseConfirmation);
  }
}
