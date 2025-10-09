import { Address } from "@multiversx/sdk-core/out";
import { UserAccountData } from "./user_account.pb";
import { ESDigitalToken } from "./esdt";
import { TokenParser } from "./token.parser";
import {
    AccountChanges,
    AccountChangesRaw,
    AccountState,
    BlockWithStateChangesRaw,
    DataTrieChange,
    DataTrieChangeOperation,
    EsdtState,
    ESDTType,
    StateAccessOperation,
    StateAccessPerAccountRaw,
    StateChanges
} from "../entities";

export class StateChangesDecoder {
    static bech32FromHex(hex: any) {
        const clean = hex.startsWith("0x") ? hex.slice(2) : hex;
        return Address.newFromHex(clean).toBech32();
    }

    static bech32FromBytes(u8: any) {
        return (u8 && u8.length ? Address.newFromHex(this.bytesToHex(u8)).toBech32() : "");
    }

    static bytesToHex(u8: any) {
        return (u8 && u8.length ? Buffer.from(u8).toString("hex") : "");
    }

    static bytesToBase64(u8: any) {
        return (u8 && u8.length ? Buffer.from(u8).toString("base64") : "");
    }

    // const bytesToString = (u8: any) => (u8 && u8.length ? Buffer.from(u8).toString("utf8") : "");
    static longToString(v: any) {
        return v == null ? "" : (typeof v === "object" && typeof v.toString === "function" ? v.toString() : String(v));
    }

    static bigEndianBytesToBigInt(u8: any) {
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
    static decodeMxSignMagBigInt(u8: any) {
        if (!u8 || u8.length === 0) return BigInt(0);

        // canonical zero used by the serializer
        if (u8.length === 2 && u8[0] === 0x00 && u8[1] === 0x00) return BigInt(0);

        const sign = u8[0];
        if (sign === 0x00 || sign === 0x01) {
            const mag = u8.slice(1);
            const m = this.bigEndianBytesToBigInt(mag);
            return sign === 0x01 ? -m : m;
        }

        // fallback for legacy "magnitude only" encodings
        return this.bigEndianBytesToBigInt(u8);
    }

    static getDecodedUserAccountData(buf: any) {
        try {
            const msg = UserAccountData.decode(buf);

            const balance = this.decodeMxSignMagBigInt(msg.Balance);
            const devReward = this.decodeMxSignMagBigInt(msg.DeveloperReward);
            const address = this.bech32FromBytes(msg.Address);
            const ownerAddress = this.bech32FromBytes(msg.OwnerAddress);

            const data: AccountState = {
                nonce: parseInt(this.longToString(msg.Nonce)),
                balance: balance.toString(),
                developerReward: devReward.toString(),
                address,
                ownerAddress,
                codeHash: this.bytesToBase64(msg.CodeHash),
                rootHash: this.bytesToBase64(msg.RootHash),
                userName: this.bytesToHex(msg.UserName),
                codeMetadata: this.bytesToHex(msg.CodeMetadata),
            };

            const filteredData = Object.fromEntries(
                Object.entries(data).filter(([_, v]) => v !== undefined && v !== null && v !== '')
            ) as AccountState;

            return filteredData;
        } catch (e: any) {
            console.warn(`Could not decode as UserAccountData: ${e.message}`);
            return null;
        }
    }

    static decodeAccountChanges(flags: number | undefined): AccountChanges {
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

    static getDecodedEsdtData(address: string, dataTrieChange: DataTrieChange) {
        const bufTrieLeafValue = Buffer.from(dataTrieChange.val, "base64");
        const esdtPrefix = 'ELRONDesdt';
        try {
            const keyRawBuf = Buffer.from(dataTrieChange.key, "base64");
            const keyRaw = keyRawBuf.toString();
            if (keyRaw.startsWith(esdtPrefix)) {
                const keyBuf = keyRawBuf.slice(esdtPrefix.length);
                const msgEsdtData: ESDigitalToken = ESDigitalToken.decode(bufTrieLeafValue as Uint8Array);

                const valueBigInt: bigint = this.decodeMxSignMagBigInt(msgEsdtData.Value);
                const [identifier, nonceHex] = TokenParser.extractTokenIDAndNonceHexFromTokenStorageKey(keyBuf);

                return {
                    identifier: nonceHex !== '00' ? `${identifier}-${nonceHex}` : identifier,
                    nonce: parseInt(nonceHex, 16).toString(),
                    type: msgEsdtData.Type,
                    value: valueBigInt.toString(),
                    propertiesHex: this.bytesToHex(msgEsdtData.Properties),
                    reservedHex: this.bytesToHex(msgEsdtData.Reserved),
                    tokenMetaData: msgEsdtData.TokenMetaData ?? null,
                };
            } else {
                //TODO: handle if needed

                return null;
            }
        } catch (e: any) {
            console.warn(`Could not decode as EsdtData: ${e.message}`);
            console.log(address, ':')
            console.dir(dataTrieChange)
            return null;
        }
    }

    static decodeStateChangesRaw(blockWithStateChanges: BlockWithStateChangesRaw) {
        const allAccounts: Record<string, any[]> = {};
        const accounts = blockWithStateChanges.stateAccessesPerAccounts || {};

        for (const accountHex of Object.keys(accounts)) {
            const address = this.bech32FromHex(accountHex);

            const { stateAccess = [] } = accounts[accountHex] || {};
            const allDecoded: Record<string, any[]> = {};
            stateAccess.forEach((sa: StateAccessPerAccountRaw, i: number) => {

                const base64AccountData = sa.mainTrieVal;
                let decodedAccountData: any = null
                if (base64AccountData) {
                    const bufAccountData = Buffer.from(base64AccountData, "base64");
                    decodedAccountData = this.getDecodedUserAccountData(bufAccountData);
                }

                const dataTrieChanges = sa.dataTrieChanges;


                let allDecodedEsdtData: any[] = [];
                if (dataTrieChanges) {
                    for (const dataTrieChange of dataTrieChanges) {
                        if (dataTrieChange.version === 0) {
                            console.warn(`Entry #${i}: unsupported dataTrieChanges version 0`);
                        } else {

                            const decodedEsdtData = this.getDecodedEsdtData(address, dataTrieChange);

                            if (decodedEsdtData) {
                                if (dataTrieChange.operation === DataTrieChangeOperation.Delete) {
                                    decodedEsdtData.value = '0';
                                }
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

                    const accountChanges = this.decodeAccountChanges(sa.accountChanges);

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

    static decodeStateChangesFinal(blockWithStateChanges: BlockWithStateChangesRaw) {
        const accounts = blockWithStateChanges.stateAccessesPerAccounts;
        const finalStates: Record<string, StateChanges> = {};

        for (const accountHex of Object.keys(accounts)) {
            const address = this.bech32FromHex(accountHex);
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
                    finalAccountChangesRaw |= currentAccountChangesRaw;
                }

                if (!finalNewAccount) {
                    const currentNewAccount = (sa.accountChanges === null || sa.accountChanges === undefined) && (sa.operation & StateAccessOperation.SaveAccount) ? true : false;
                    finalNewAccount = currentNewAccount || finalNewAccount;
                }

                const base64AccountData = sa.mainTrieVal;
                if (base64AccountData && !finalAccountState) {
                    const bufAccountData = Buffer.from(base64AccountData, "base64");
                    const decodedAccountData = this.getDecodedUserAccountData(bufAccountData);
                    if (decodedAccountData) {
                        finalAccountState = decodedAccountData;
                    }
                }

                const dataTrieChanges = sa.dataTrieChanges;
                if (dataTrieChanges) {
                    for (let i = dataTrieChanges.length - 1; i >= 0; i--) {
                        const dataTrieChange = dataTrieChanges[i];
                        if (dataTrieChange.version === 0) {
                            console.warn(`Unsupported dataTrieChanges version 0`);
                        } else if (dataTrieChange.val) {
                            const decodedEsdtData = this.getDecodedEsdtData(address, dataTrieChange);
                            if (decodedEsdtData) {
                                const esdtId = decodedEsdtData.identifier;
                                if (!esdtOccured[esdtId]) {
                                    const typeName = ESDTType[decodedEsdtData.type] as keyof typeof finalEsdtStates; // numeric -> string
                                    if (typeName) {
                                        if (dataTrieChange.operation === DataTrieChangeOperation.Delete) {
                                            decodedEsdtData.value = '0';
                                        }
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
                accountChanges: this.decodeAccountChanges(finalAccountChangesRaw),
                isNewAccount: finalNewAccount,
            };
        }
        return finalStates;
    }


    static getFinalStates(stateChanges: Record<string, any[]>) {
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
}
