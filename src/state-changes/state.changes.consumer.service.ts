import { CompetingRabbitConsumer } from "src/common/rabbitmq/rabbitmq.consumers";
import { BlockWithStateChangesRaw, ESDTType, StateChanges } from "./entities";
import { decodeStateChangesFinal } from "./utils/state-changes.utils";
import { AccountDetails, AccountDetailsRepository } from "src/common/indexer/db";
import { Inject, Injectable } from "@nestjs/common";
import { TokenWithBalance } from "src/endpoints/tokens/entities/token.with.balance";
import { CacheService } from "@multiversx/sdk-nestjs-cache";
import { CacheInfo } from "src/utils/cache.info";
import { NftAccount } from "src/endpoints/nfts/entities/nft.account";
import { TokenType } from "src/common/indexer/entities";
import { NftType } from "src/endpoints/nfts/entities/nft.type";
import { NftSubType } from "src/endpoints/nfts/entities/nft.sub.type";
import { ClientProxy } from "@nestjs/microservices";

@Injectable()
export class StateChangesConsumerService {
    constructor(
        // private readonly apiConfigService: ApiConfigService,
        private readonly cacheService: CacheService,
        private readonly accountDetailsRepository: AccountDetailsRepository,
        @Inject('PUBSUB_SERVICE') private clientProxy: ClientProxy,
    ) { }

    @CompetingRabbitConsumer({
        exchange: 'state_accesses',
        queueName: 'state_changes_test-stefan',
        deadLetterExchange: 'state_changes_test_dlx-stefan',
    })
    async consumeEvents(blockWithStateChanges: BlockWithStateChangesRaw) {
        try {
            const start = Date.now();

            const startDecoding = start;
            const finalStates = this.decodeStateChangesFinal(blockWithStateChanges);

            const transformedFinalStates = this.transformFinalStatesToDbFormat(finalStates, blockWithStateChanges.shardID, blockWithStateChanges.timestampMs);

            const endDecoding = Date.now();
            const decodingDuration = endDecoding - startDecoding;
            await this.updateAccounts(transformedFinalStates);

            await this.cacheService.setRemote(
                CacheInfo.StateChangesConsumerLatestProcessedBlockTimestamp(blockWithStateChanges.shardID).key,
                blockWithStateChanges.timestampMs,
                CacheInfo.StateChangesConsumerLatestProcessedBlockTimestamp(blockWithStateChanges.shardID).ttl,
            );
            // console.timeEnd(`processing time shard ${blockWithStateChanges.shardID}`)
            const end = Date.now(); // ms la final
            const duration = end - start;
            if (duration > 10) {
                // console.dir(finalStates, { depth: null })
                console.log(`decoding duration: ${decodingDuration}ms`)
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

    private async updateAccounts(transformedFinalStates: AccountDetails[]) {
        const promisesToWaitFor = [this.accountDetailsRepository.updateAccounts(transformedFinalStates)];

        // set as healthy 
        const cacheKeys = [];
        const values = [];
        for (const account of transformedFinalStates) {
            cacheKeys.push(CacheInfo.AccountState(account.address).key);
            const { tokens, nfts, ...accountWithoutAssets } = account;
            values.push(accountWithoutAssets);
        }
        promisesToWaitFor.push(
            this.cacheService.setManyRemote(
                cacheKeys,
                values,
                CacheInfo.AccountState('any').ttl,
            )
        );
        this.deleteLocalCache(cacheKeys);

        await Promise.all(promisesToWaitFor)
    }
    private decodeStateChangesFinal(blockWithStateChanges: BlockWithStateChangesRaw) {
        return decodeStateChangesFinal(blockWithStateChanges);
    }

    private transformFinalStatesToDbFormat(finalStates: Record<string, StateChanges>, shardID: number, blockTimestampMs: number) {
        const transformed: AccountDetails[] = [];

        for (const [_address, state] of Object.entries(finalStates)) {
            // t1 + 0.5
            // const accountExists = await this.accountDetailsRepository.accountExists(address);
            // if (!accountExists) {
            //     continue;
            // }
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
                const parsedAccount =
                    new AccountDetails({
                        ...newAccountState,
                        shard: shardID,
                        timestamp: blockTimestampMs,
                        ...this.parseCodeMetadata(newAccountState.codeMetadata),
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
                    });
                transformed.push(parsedAccount);
                console.log(parsedAccount)
            }

        }

        return transformed;
    }


    private deleteLocalCache(cacheKeys: string[]) {
        this.clientProxy.emit('deleteCacheKeys', cacheKeys);
    }

    private parseCodeMetadata(hexStr?: string) {
        const UPGRADEABLE = 0x01_00; // 256
        const READABLE = 0x04_00; // 1024
        const PAYABLE = 0x00_02; // 2
        const PAYABLE_BY_SC = 0x00_04; // 4
        if (!hexStr || hexStr === '') {
            return {};
        }
        const value = parseInt(hexStr, 16);

        return {
            isUpgradeable: (value & UPGRADEABLE) !== 0,
            isReadable: (value & READABLE) !== 0,
            isPayable: (value & PAYABLE) !== 0,
            isPayableBySmartContract: (value & PAYABLE_BY_SC) !== 0,
        };
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