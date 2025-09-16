import { Address } from "@multiversx/sdk-core/out";
import { UserAccountData } from "./user_account.pb";
import { ESDigitalToken } from "./esdt";
import { TrieLeafData } from "./trie_leaf_data";
import { TokenParser } from "./token.parser";
import { AccountChanges, AccountChangesRaw, AccountState, BlockWithStateChangesRaw, EsdtState, ESDTType, StateAccessOperation, StateAccessPerAccountRaw, StateChanges } from "../entities";
import { CacheInfo } from "src/utils/cache.info";
import { CacheService } from "@multiversx/sdk-nestjs-cache";

const bech32FromHex = (hex: any) => {
    const clean = hex.startsWith("0x") ? hex.slice(2) : hex;
    return Address.newFromHex(clean).toBech32();
};
const bech32FromBytes = (u8: any) => (u8 && u8.length ? Address.newFromHex(bytesToHex(u8)).toBech32() : "");

const bytesToHex = (u8: any) => (u8 && u8.length ? Buffer.from(u8).toString("hex") : "");
// const bytesToString = (u8: any) => (u8 && u8.length ? Buffer.from(u8).toString("utf8") : "");
const longToString = (v: any) =>
    v == null ? "" : (typeof v === "object" && typeof v.toString === "function" ? v.toString() : String(v));
function bigEndianBytesToBigInt(u8: any) {
    let v = BigInt(0);
    for (const b of u8) {
        v = (v << BigInt(8)) + BigInt(b);
    }
    return v;
}

/**
 * MultiversX custom sign & magnitude BigInt for proto:
 *  - zero => [0x00, 0x00]
 *  - positive non-zero => 0x00 || magnitude (big-endian)
 *  - (if present) negative => 0x01 || magnitude
 * Fallback: if first byte is not a sign marker, treat whole buffer as positive magnitude.
 */
function decodeMxSignMagBigInt(u8: any) {
    if (!u8 || u8.length === 0) return BigInt(0);

    // canonical zero used by the serializer
    if (u8.length === 2 && u8[0] === 0x00 && u8[1] === 0x00) return BigInt(0);

    const sign = u8[0];
    if (sign === 0x00 || sign === 0x01) {
        const mag = u8.slice(1);
        const m = bigEndianBytesToBigInt(mag);
        return sign === 0x01 ? -m : m;
    }

    // fallback for legacy "magnitude only" encodings
    return bigEndianBytesToBigInt(u8);
}

function getDecodedUserAccountData(buf: any) {
    try {
        const msg = UserAccountData.decode(buf);

        const balance = decodeMxSignMagBigInt(msg.Balance);
        const devReward = decodeMxSignMagBigInt(msg.DeveloperReward);
        const address = bech32FromBytes(msg.Address);
        const ownerAddress = bech32FromBytes(msg.OwnerAddress);

        return {
            nonce: longToString(msg.Nonce),
            balance: balance.toString(),
            developerReward: devReward.toString(),
            address: address,
            ownerAddress: ownerAddress,
            codeHash: bytesToHex(msg.CodeHash),
            rootHash: bytesToHex(msg.RootHash),
            userName: bytesToHex(msg.UserName),
            codeMetadata: bytesToHex(msg.CodeMetadata),
        };
    } catch (e: any) {
        console.warn(`Could not decode as UserAccountData: ${e.message}`);
        return null;
    }
}

export function decodeAccountChanges(flags: number | undefined): AccountChanges {
    if (!flags) {
        return new AccountChanges({
            nonceChanged: false,
            balanceChanged: false,
            codeHashChanged: false,
            rootHashChanged: false,
            developerRewardChanged: false,
            ownerAddressChanged: false,
            userNameChanged: false,
            codeMetadataChanged: false,
        });
    }
    return new AccountChanges({
        nonceChanged: (flags & AccountChangesRaw.NonceChanged) !== 0,
        balanceChanged: (flags & AccountChangesRaw.BalanceChanged) !== 0,
        codeHashChanged: (flags & AccountChangesRaw.CodeHashChanged) !== 0,
        rootHashChanged: (flags & AccountChangesRaw.RootHashChanged) !== 0,
        developerRewardChanged: (flags & AccountChangesRaw.DeveloperRewardChanged) !== 0,
        ownerAddressChanged: (flags & AccountChangesRaw.OwnerAddressChanged) !== 0,
        userNameChanged: (flags & AccountChangesRaw.UserNameChanged) !== 0,
        codeMetadataChanged: (flags & AccountChangesRaw.CodeMetadataChanged) !== 0,
    });
}

function getDecodedEsdtData(buf: any) {
    const esdtPrefix = 'ELDRONDesdt';
    try {
        const msgTrieLeafData: TrieLeafData = TrieLeafData.decode(buf);
        const bufEsdtData = msgTrieLeafData.value;
        const msgEsdtData: ESDigitalToken = ESDigitalToken.decode(bufEsdtData);

        const valueBigInt: bigint = decodeMxSignMagBigInt(msgEsdtData.Value);
        const keyRaw = Buffer.from(bytesToHex(msgTrieLeafData.key), "hex").toString();
        let key = keyRaw;
        if (keyRaw.startsWith(esdtPrefix)) {
            key = keyRaw.slice(esdtPrefix.length);
        } else {
            //TODO: handle if needed
            return null;
        }
        const [identifier, nonce] = TokenParser.extractTokenIDAndNonceFromTokenStorageKey(key);

        return {
            address: bech32FromHex(bytesToHex(msgTrieLeafData.address)),
            identifier,
            nonce,
            type: msgEsdtData.Type,
            value: valueBigInt.toString(),
            propertiesHex: bytesToHex(msgEsdtData.Properties),
            reservedHex: bytesToHex(msgEsdtData.Reserved),
            tokenMetaData: msgEsdtData.TokenMetaData ?? null,
        };
    } catch (e: any) {
        console.warn(`Could not decode as EsdtData: ${e.message}`);
        return null;
    }
}

export function decodeStateChangesRaw(blockWithStateChanges: BlockWithStateChangesRaw) {
    const allAccounts: Record<string, any[]> = {};
    const accounts = blockWithStateChanges.stateAccessesPerAccounts || {};

    for (const accountHex of Object.keys(accounts)) {
        const address = bech32FromHex(accountHex);

        const { stateAccess = [] } = accounts[accountHex] || {};
        const allDecoded: Record<string, any[]> = {};
        stateAccess.forEach((sa: StateAccessPerAccountRaw, i: number) => {

            const base64AccountData = sa.mainTrieVal;
            let decodedAccountData: any = null
            if (base64AccountData) {
                const bufAccountData = Buffer.from(base64AccountData, "base64");
                decodedAccountData = getDecodedUserAccountData(bufAccountData);
            }
            const dataTrieChanges = sa.dataTrieChanges;


            let allDecodedEsdtData: any[] = [];
            if (dataTrieChanges) {
                for (const dataTrieChange of dataTrieChanges) {
                    if (dataTrieChange.version === 0) {
                        console.warn(`Entry #${i}: unsupported dataTrieChanges version 0`);
                    } else {
                        const bufEsdtData = Buffer.from(dataTrieChange.val, "base64");

                        const decodedEsdtData = getDecodedEsdtData(bufEsdtData);
                        if (decodedEsdtData) {
                            allDecodedEsdtData.push(decodedEsdtData);
                        }
                    }
                }
            }

            if (decodedAccountData || allDecodedEsdtData.length > 0) {
                const groupedEsdtStates = allDecodedEsdtData.reduce<Record<string, typeof allDecodedEsdtData>>(
                    (acc, state) => {
                        const typeName = ESDTType[state.type]; // numeric -> string
                        if (typeName) {
                            acc[typeName].push(state);
                        }

                        return acc;
                    },
                    {
                        Fungible: [],
                        NonFungible: [],
                        NonFungibleV2: [],
                        SemiFungible: [],
                        MetaFungible: [],
                        DynamicNFT: [],
                        DynamicSFT: [],
                        DynamicMeta: [],
                    }
                );
                if (allDecoded[address] === undefined) allDecoded[address] = [];
                const newAccount = (sa.accountChanges === null || sa.accountChanges === undefined) && (sa.operation & StateAccessOperation.SaveAccount) ? true : false;

                const accountChanges = decodeAccountChanges(sa.accountChanges);

                allDecoded[address].push({
                    entry: `Entry #${i}`,
                    accountState: decodedAccountData,
                    esdtStates: groupedEsdtStates,
                    accountChanges,
                    newAccount,
                });
            }
        });
        if (Object.keys(allDecoded).length === 0) continue;

        allAccounts[address] = [...(allAccounts[address] || []), ...Object.values(allDecoded).flat()];
    }

    return allAccounts;
}

export function decodeStateChangesFinal(blockWithStateChanges: BlockWithStateChangesRaw) {
    const accounts = blockWithStateChanges.stateAccessesPerAccounts;
    const finalStates: Record<string, StateChanges> = {};

    for (const accountHex of Object.keys(accounts)) {
        const address = bech32FromHex(accountHex);
        const esdtOccured: Record<string, boolean> = {};

        const { stateAccess } = accounts[accountHex] || {};
        let finalAccountChangesRaw: AccountChangesRaw = AccountChangesRaw.NoChange;

        let finalNewAccount = false;

        let finalAccountState: AccountState | undefined = undefined;
        const finalEsdtStates = {
            Fungible: [] as EsdtState[],
            NonFungible: [] as EsdtState[],
            NonFungibleV2: [] as EsdtState[],
            SemiFungible: [] as EsdtState[],
            MetaFungible: [] as EsdtState[],
            DynamicNFT: [] as EsdtState[],
            DynamicSFT: [] as EsdtState[],
            DynamicMeta: [] as EsdtState[],
        };

        for (let i = stateAccess.length - 1; i >= 0; i--) {
            const sa = stateAccess[i];
            const currentAccountChangesRaw = sa.accountChanges;
            if (currentAccountChangesRaw) {
                finalAccountChangesRaw = finalAccountChangesRaw | currentAccountChangesRaw;
            }

            if (!finalNewAccount) {
                const currentNewAccount = (sa.accountChanges === null || sa.accountChanges === undefined) && (sa.operation & StateAccessOperation.SaveAccount) ? true : false;
                finalNewAccount = currentNewAccount || finalNewAccount;
            }

            const base64AccountData = sa.mainTrieVal;
            if (base64AccountData && !finalAccountState) {
                const bufAccountData = Buffer.from(base64AccountData, "base64");
                const decodedAccountData = getDecodedUserAccountData(bufAccountData);
                if (decodedAccountData) {
                    finalAccountState = decodedAccountData;
                }
            }

            const dataTrieChanges = sa.dataTrieChanges;
            if (dataTrieChanges) {
                for (let i = dataTrieChanges.length - 1; i >= 0; i--) {
                    const dataTrieChange = dataTrieChanges[i];
                    if (dataTrieChange.version === 0) {
                        console.warn(`  Entry #${i}: unsupported dataTrieChanges version 0`);
                    } else if (dataTrieChange.val) {

                        const bufEsdtData = Buffer.from(dataTrieChange.val, "base64");

                        const decodedEsdtData = getDecodedEsdtData(bufEsdtData);
                        if (decodedEsdtData) {
                            const esdtId = decodedEsdtData.identifier;
                            if (!esdtOccured[esdtId]) {
                                const typeName = ESDTType[decodedEsdtData.type] as keyof typeof finalEsdtStates; // numeric -> string
                                if (typeName) {
                                    finalEsdtStates[typeName].push(decodedEsdtData);
                                    esdtOccured[esdtId] = true;
                                }
                            }

                        }
                    }
                }

            }
        }
        finalStates[address] = {
            accountState: finalAccountState,
            esdtState: finalEsdtStates,
            accountChanges: decodeAccountChanges(finalAccountChangesRaw),
            isNewAccount: finalNewAccount,
        };
    }
    return finalStates;
}


export function getFinalStates(stateChanges: Record<string, any[]>) {
    const finalStates: Record<string, StateChanges> = {};


    for (const [address, entries] of Object.entries(stateChanges)) {
        let finalAccountState: AccountState | undefined = undefined;
        const finalEsdtStates = {
            Fungible: [] as EsdtState[],
            NonFungible: [] as EsdtState[],
            NonFungibleV2: [] as EsdtState[],
            SemiFungible: [] as EsdtState[],
            MetaFungible: [] as EsdtState[],
            DynamicNFT: [] as EsdtState[],
            DynamicSFT: [] as EsdtState[],
            DynamicMeta: [] as EsdtState[],
        };
        const finalAccountChanges: AccountChanges = new AccountChanges({
            nonceChanged: false,
            balanceChanged: false,
            codeHashChanged: false,
            rootHashChanged: false,
            developerRewardChanged: false,
            ownerAddressChanged: false,
            userNameChanged: false,
            codeMetadataChanged: false
        });

        let finalNewAccount = false;

        for (const entry of entries) {
            const currentAccountState: AccountState = entry.accountState;
            const currentEsdtStates = entry.esdtStates;
            const currentAccountChanges = entry.accountChanges;
            const currentNewAccount = entry.newAccount as boolean;


            finalNewAccount = finalNewAccount ? finalNewAccount : currentNewAccount;

            finalAccountState = currentAccountState;

            (Object.entries(finalAccountChanges) as [keyof typeof finalAccountChanges, boolean][]).forEach(
                ([key, value]) => {
                    finalAccountChanges[key] = value || currentAccountChanges[key];
                }
            );


            (Object.entries(currentEsdtStates) as [keyof typeof finalEsdtStates, any[]][]).forEach(
                ([tokenType, tokenChanges]) => {
                    for (const tokenChange of tokenChanges) {
                        let index = finalEsdtStates[tokenType].findIndex((item: any) => item.key === tokenChange.key);
                        index = index !== -1 ? index : finalEsdtStates[tokenType].length;
                        finalEsdtStates[tokenType][index] = tokenChange;
                    }

                }
            );
        }

        finalStates[address] = {
            accountState: finalAccountState,
            esdtState: finalEsdtStates,
            accountChanges: finalAccountChanges,
            isNewAccount: finalNewAccount,
        };
    }

    return finalStates;
}

export async function isDbValid(cacheService: CacheService): Promise<boolean> {
    // TODO: do not hardcode shard IDs
    const timestampsMs: (string | undefined)[] = await Promise.all([
        cacheService.get(CacheInfo.LatestProcessedBlockTimestamp(0).key),
        cacheService.get(CacheInfo.LatestProcessedBlockTimestamp(1).key),
        cacheService.get(CacheInfo.LatestProcessedBlockTimestamp(2).key),
        cacheService.get(CacheInfo.LatestProcessedBlockTimestamp(4294967295).key),
    ]) as (string | undefined)[];;

    const numericValues = timestampsMs
        .map((timestampMsRaw: string | null | undefined) =>
            timestampMsRaw !== null && timestampMsRaw !== undefined ? Number(timestampMsRaw) : undefined
        )
        .filter((timestampMs: number | undefined): timestampMs is number => timestampMs !== undefined && !isNaN(timestampMs));

    const minTimestamp = numericValues.length > 0 ? Math.min(...numericValues) : null;

    if (minTimestamp === null) {
        return false;
    }

    const diff = Date.now() - minTimestamp;
    console.log('Min timestamp from cache:', minTimestamp);
    console.log('Current timestamp:', Date.now());
    console.group('diff', diff);
    const blockTime = 6000;
    return diff < blockTime;
}
