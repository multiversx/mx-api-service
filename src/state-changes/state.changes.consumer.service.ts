import { CompetingRabbitConsumer } from "src/common/rabbitmq/rabbitmq.consumers";
import { BlockWithStateChangesRaw, ESDTType, StateChanges } from "./entities";
import { decodeStateChangesFinal } from "./utils/state-changes.utils";
import { AccountDetails, AccountDetailsRepository } from "src/common/indexer/db";
import { Injectable } from "@nestjs/common";
import { TokenWithBalance } from "src/endpoints/tokens/entities/token.with.balance";
import { CacheService } from "@multiversx/sdk-nestjs-cache";
import { CacheInfo } from "src/utils/cache.info";
import { NftAccount } from "src/endpoints/nfts/entities/nft.account";
import { TokenType } from "src/common/indexer/entities";
import { NftType } from "src/endpoints/nfts/entities/nft.type";
import { NftSubType } from "src/endpoints/nfts/entities/nft.sub.type";

@Injectable()
export class StateChangesConsumerService {
    constructor(
        // private readonly apiConfigService: ApiConfigService,
        private readonly cacheService: CacheService,
        private readonly accountDetailsRepository: AccountDetailsRepository,
    ) { }

    @CompetingRabbitConsumer({
        exchange: 'state_accesses',
        queueName: 'state_changes_test-stefan',
        deadLetterExchange: 'state_changes_test_dlx-stefan',
    })
    async consumeEvents(blockWithStateChanges: BlockWithStateChangesRaw) {
        try {
            const start = Date.now(); // ms la început
            // console.time(`processing time shard ${blockWithStateChanges.shardID}`)
            // console.time('decode time')
            // console.dir(blockWithStateChanges, { depth: null })
            const startDecoding = start;
            const finalStates = this.decodeStateChangesFinal(blockWithStateChanges);
            const transformedFinalStates = this.transformFinalStatesToDbFormat(finalStates, blockWithStateChanges.shardID);

            const endDecoding = Date.now();
            const decodingDuration = endDecoding - startDecoding;

            console.dir(finalStates, { depth: null })
            // console.timeEnd('decode time')
            this.accountDetailsRepository
            await this.accountDetailsRepository.updateAccounts(transformedFinalStates);

            await this.cacheService.setRemote(
                CacheInfo.LatestProcessedBlockTimestamp(blockWithStateChanges.shardID).key,
                blockWithStateChanges.timestampMs,
                CacheInfo.LatestProcessedBlockTimestamp(blockWithStateChanges.shardID).ttl,
            );
            // console.timeEnd(`processing time shard ${blockWithStateChanges.shardID}`)
            const end = Date.now(); // ms la final
            const duration = end - start;
            if (duration > 10) {
                // console.dir(finalStates, { depth: null })
                console.log(`decoding duration: ${decodingDuration}`)
                console.log(`processing time shard ${blockWithStateChanges.shardID}: ${duration}ms`);
            }
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

    private transformFinalStatesToDbFormat(finalStates: Record<string, StateChanges>, shardID: number) {
        const transformed: AccountDetails[] = [];
        for (const [_key, state] of Object.entries(finalStates)) {
            const newAccountState = state.accountState;

            const tokens = [
                ...state.esdtState.Fungible,

            ];

            const nfts = [
                ...state.esdtState.NonFungible,
                ...state.esdtState.NonFungibleV2,
                ...state.esdtState.DynamicNFT,
                ...state.esdtState.SemiFungible,
                ...state.esdtState.DynamicSFT,
                ...state.esdtState.MetaFungible,
                ...state.esdtState.DynamicMeta
            ];

            if (newAccountState) {
                transformed.push(new AccountDetails({
                    ...newAccountState,
                    shard: shardID,
                    tokens: tokens.map(token => new TokenWithBalance({
                        identifier: token.identifier,
                        nonce: parseInt(token.nonce),
                        balance: token.value,
                        type: this.parseEsdtType(token.type) as TokenType,
                        subType: NftSubType.None,
                    })),
                    nfts: nfts.map(nft => new NftAccount({
                        identifier: nft.identifier,
                        nonce: parseInt(nft.nonce),
                        type: this.parseEsdtType(nft.type) as NftType,
                        subType: this.parseEsdtSubtype(nft.type),
                        collection: nft.identifier.replace(/-[^-]*$/, ''), // delete everything after last `-` character inclusive
                        balance: nft.value,
                    }))
                }));
            }

        }

        return transformed;
    }

    private parseEsdtType(type: ESDTType): TokenType | NftType {
        switch (type) {
            case ESDTType.Fungible:
                return TokenType.FungibleESDT;

            case ESDTType.NonFungible:
            case ESDTType.DynamicNFT:
            case ESDTType.NonFungibleV2:
                return NftType.NonFungibleESDT;

            case ESDTType.SemiFungible:
            case ESDTType.DynamicSFT:
                return NftType.SemiFungibleESDT;
            case ESDTType.MetaFungible:
            case ESDTType.DynamicMeta:
                return NftType.MetaESDT;
        }
    }

    private parseEsdtSubtype(type: ESDTType): NftSubType {
        switch (type) {
            case ESDTType.Fungible:
                return NftSubType.None;

            case ESDTType.NonFungible:
                return NftSubType.NonFungibleESDT;
            case ESDTType.DynamicNFT:
                return NftSubType.DynamicNonFungibleESDT;
            case ESDTType.NonFungibleV2:
                return NftSubType.NonFungibleESDTv2;

            case ESDTType.SemiFungible:
                return NftSubType.SemiFungibleESDT;
            case ESDTType.DynamicSFT:
                return NftSubType.DynamicSemiFungibleESDT;
            case ESDTType.MetaFungible:
                return NftSubType.MetaESDT;
            case ESDTType.DynamicMeta:
                return NftSubType.DynamicMetaESDT;
        }
    }

}
