import { CompetingRabbitConsumer } from "src/common/rabbitmq/rabbitmq.consumers";
import { BlockWithStateChangesRaw, StateChanges } from "./entities";
import { decodeStateChangesFinal } from "./utils/state-changes.utils";
import { AccountDetails, AccountDetailsRepository } from "src/common/indexer/db";
import { Injectable } from "@nestjs/common";
import { TokenWithBalance } from "src/endpoints/tokens/entities/token.with.balance";
import { CacheService } from "@multiversx/sdk-nestjs-cache";
import { CacheInfo } from "src/utils/cache.info";
import { NftAccount } from "src/endpoints/nfts/entities/nft.account";
@Injectable()
export class StateChangesConsumerService {
    constructor(
        // private readonly apiConfigService: ApiConfigService,
        private readonly cacheService: CacheService,
        private readonly accountDetailsRepository: AccountDetailsRepository,
    ) { }

    @CompetingRabbitConsumer({
        exchange: 'state_accesses',
        queueName: 'state_changes_test',
        deadLetterExchange: 'state_changes_test_dlx',
    })
    async consumeEvents(blockWithStateChanges: BlockWithStateChangesRaw) {
        try {
            console.time(`processing time shard ${blockWithStateChanges.shardID}`)
            console.time('decode time')
            const finalStates = this.decodeStateChangesFinal(blockWithStateChanges);
            const transformedFinalStates = this.transformFinalStatesToDbFormat(finalStates);
            // console.dir(finalStates, { depth: null })
            console.timeEnd('decode time')
            await this.accountDetailsRepository.updateAccounts(transformedFinalStates);

            await this.cacheService.setRemote(
                CacheInfo.LatestProcessedBlockTimestamp(blockWithStateChanges.shardID).key,
                blockWithStateChanges.timestampMs,
                CacheInfo.LatestProcessedBlockTimestamp(blockWithStateChanges.shardID).ttl,
            );
            console.timeEnd(`processing time shard ${blockWithStateChanges.shardID}`)
        } catch (error) {
            console.error(`Error consuming state changes:`, error);
            throw error;
        }
    }

    // private decodeStateChanges(stateChanges: StateChangesRaw) {
    //     return decodeStateChangesRaw(stateChanges);
    // }

    private decodeStateChangesFinal(blockWithStateChanges: BlockWithStateChangesRaw) {
        return decodeStateChangesFinal(blockWithStateChanges);
    }

    private transformFinalStatesToDbFormat(finalStates: Record<string, StateChanges>) {
        const transformed: AccountDetails[] = [];
        for (const [_key, state] of Object.entries(finalStates)) {
            const newAccountState = state.accountState;
            const tokens = [
                ...state.esdtState.Fungible,
                ...state.esdtState.SemiFungible,
                ...state.esdtState.DynamicSFT,
                ...state.esdtState.MetaFungible,
                ...state.esdtState.DynamicMeta
            ];

            const nfts = [
                ...state.esdtState.NonFungible,
                ...state.esdtState.NonFungibleV2,
                ...state.esdtState.DynamicNFT
            ];

            if (newAccountState) {
                transformed.push(new AccountDetails({
                    ...newAccountState,
                    tokens: tokens.map(token => new TokenWithBalance({
                        identifier: token.identifier,
                        nonce: parseInt(token.nonce),
                        balance: token.value,
                    })),
                    nfts: nfts.map(nft => new NftAccount({
                        identifier: nft.identifier,
                        nonce: parseInt(nft.nonce),
                        // type: nft.type.toString(),
                    }))
                }));
            }

        }

        return transformed;
    }
}