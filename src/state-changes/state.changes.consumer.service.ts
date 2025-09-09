import { CompetingRabbitConsumer } from "src/common/rabbitmq/rabbitmq.consumers";
import { StateChanges, StateChangesRaw } from "./entities";
import { decodeStateChangesRaw, getFinalStates } from "./utils/state-changes.utils";
import { AccountDetails, AccountDetailsRepository } from "src/common/indexer/db";
import { Injectable } from "@nestjs/common";
import { TokenWithBalance } from "src/endpoints/tokens/entities/token.with.balance";
import { CacheService } from "@multiversx/sdk-nestjs-cache";
import { CacheInfo } from "src/utils/cache.info";
// import { ApiConfigService } from "src/common/api-config/api.config.service";

@Injectable()
export class StateChangesConsumerService {
    constructor(
        // private readonly apiConfigService: ApiConfigService,
        private readonly cacheService: CacheService,
        private readonly accountDetailsRepository: AccountDetailsRepository,
    ) { }

    @CompetingRabbitConsumer({
        exchange: 'state_accesses',
        queueName: 'state-changes-test',
        deadLetterExchange: 'state-changes-test_dlx',
    })
    async consumeEvents(stateChanges: StateChangesRaw) {
        // console.log(stateChanges)
        try {
            console.time(`processing time shard ${stateChanges.shardID}`)
            const decodedStateChanges = this.decodeStateChanges(stateChanges)
            if (Object.keys(decodedStateChanges).length !== 0) {
                const finalStates = getFinalStates(decodedStateChanges);
                const transformedStates = this.transformFinalStatesToDbFormat(finalStates);
                // transformedStates.forEach(s => {
                //     if (s.tokens && s.tokens.length > 0) console.log(s.address, s.tokens);
                // });

                // console.log(transformedStates)
                await this.accountDetailsRepository.updateAccounts(transformedStates);
            }

            await this.cacheService.setRemote(
                CacheInfo.LatestProcessedBlockTimestamp(stateChanges.shardID).key,
                stateChanges.timestampMs,
                CacheInfo.LatestProcessedBlockTimestamp(stateChanges.shardID).ttl,
            );
            console.timeEnd(`processing time shard ${stateChanges.shardID}`)
        } catch (error) {
            console.error(`Error consuming state changes:`, error);
            throw error;
        }
    }

    private decodeStateChanges(stateChanges: StateChangesRaw) {
        return decodeStateChangesRaw(stateChanges);
    }

    private transformFinalStatesToDbFormat(finalStates: Record<string, StateChanges>) {
        const transformed: AccountDetails[] = [];
        for (const [_key, value] of Object.entries(finalStates)) {
            const newAccountState = value.accountState;
            const tokens = [...value.esdtState.Fungible]; // TODO: add other token types

            if (newAccountState) {
                transformed.push(new AccountDetails({
                    ...newAccountState,
                    tokens: tokens.map(t => new TokenWithBalance({
                        identifier: t.identifier,
                        nonce: parseInt(t.nonce),
                        balance: t.value,
                    })),
                }));
            }

        }

        return transformed;
    }
}