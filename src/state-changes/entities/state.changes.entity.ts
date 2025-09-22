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
    dataTrieChanges?: DataTrieChange[];
    accountChanges?: number;

    constructor(init?: Partial<StateAccessPerAccountRaw>) {
        Object.assign(this, init);
    }
}

export class DataTrieChange {
    type!: number;
    key!: string;
    val!: any;
    version!: number;
    operation!: DataTrieChangeOperation;
}

export class BlockWithStateChangesRaw {
    hash!: string;
    shardID!: number;
    nonce!: number;
    timestampMs!: number;
    stateAccessesPerAccounts!: Record<string, { stateAccess: StateAccessPerAccountRaw[] }>;

    constructor(init?: Partial<BlockWithStateChangesRaw>) {
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

export enum AccountChangesRaw {
    NoChange = 0,
    NonceChanged = 1 << 0,            // 1
    BalanceChanged = 1 << 1,          // 2
    CodeHashChanged = 1 << 2,         // 4
    RootHashChanged = 1 << 3,         // 8
    DeveloperRewardChanged = 1 << 4,  // 16
    OwnerAddressChanged = 1 << 5,     // 32
    UserNameChanged = 1 << 6,         // 64
    CodeMetadataChanged = 1 << 7      // 128
}

export enum StateAccessOperation {
    NotSet = 0,
    GetCode = 1 << 0,
    SaveAccount = 1 << 1,
    GetAccount = 1 << 2,
    WriteCode = 1 << 3,
    RemoveDataTrie = 1 << 4,
    GetDataTrieValue = 1 << 5,
}

export enum DataTrieChangeOperation {
    NotDelete = 0,
    Delete = 1,
}