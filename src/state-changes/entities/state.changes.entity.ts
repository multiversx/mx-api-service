export class AccountChanges {
    nonceChanged!: boolean;
    balanceChanged!: boolean;
    codeHashChanged!: boolean;
    rootHashChanged!: boolean;
    developerRewardChanged!: boolean;
    ownerAddressChanged!: boolean;
    userNameChanged!: boolean;
    codeMetadataChanged!: boolean;

    constructor(init?: Partial<AccountChanges>) {
        Object.assign(this, init);
    }
}

export class StateAccessPerAccountRaw {
    type!: number;
    index!: number;
    txHash!: string;
    mainTrieKey!: string;
    mainTrieVal!: string;
    operation!: number;
    accountChanges?: AccountChanges;

    constructor(init?: Partial<StateAccessPerAccountRaw>) {
        Object.assign(this, init);
    }
}

export class StateChangesRaw {
    hash!: string;
    shardID!: number;
    nonce!: number;
    timestampMs!: number;
    stateAccessesPerAccounts?: Map<string, { stateAccess: StateChangesRaw[] }>;

    constructor(init?: Partial<StateChangesRaw>) {
        Object.assign(this, init);
    }
}

export class AccountState {
    nonce!: string;
    balance!: string;
    developerReward!: string;
    address!: string;
    codeHash!: string;
    rootHash!: string;
    ownerAddress!: string;
    userName!: string;
    codeMetadata!: string;

    constructor(init?: Partial<AccountState>) {
        Object.assign(this, init);
    }
}

export class EsdtState {
    address!: string;
    identifier!: string;
    nonce!: string;
    type!: ESDTType;
    value!: string;
    propertiesHex!: string;
    reservedHex!: string;
    tokenMetaData!: any;

    constructor(init?: Partial<EsdtState>) {
        Object.assign(this, init);
    }
}

export enum ESDTType {
    // 0
    Fungible,
    // 1
    NonFungible,
    // 2
    NonFungibleV2,
    // 3
    SemiFungible,
    // 4
    MetaFungible,
    // 5
    DynamicNFT,
    // 6
    DynamicSFT,
    // 7
    DynamicMeta,
}

export class StateChanges {
    accountState!: AccountState | undefined;
    esdtState!: {
        'Fungible': EsdtState[],
        'NonFungible': EsdtState[],
        'NonFungibleV2': EsdtState[],
        'SemiFungible': EsdtState[],
        'MetaFungible': EsdtState[],
        'DynamicNFT': EsdtState[],
        'DynamicSFT': EsdtState[],
        'DynamicMeta': EsdtState[],
    };
    accountChanges!: AccountChanges;
    isNewAccount!: boolean;

    constructor(init?: Partial<StateChanges>) {
        Object.assign(this, init);
    }
}
