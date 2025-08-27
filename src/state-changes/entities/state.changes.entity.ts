export class AccountChanges {
    nonceChanged!: boolean;
    balanceChanged!: boolean;
    codeHashChanged!: boolean;
    rootHashChanged!: boolean;
    developerRewardChanged!: boolean;
    ownerAddressChanged!: boolean;
    userNameChanged!: boolean;
    codeMetadataChanged!: boolean;
}

export class StateAccessPerAccount {
    type!: number;
    index!: number;
    txHash!: string;
    mainTrieKey!: string;
    mainTrieVal!: string;
    operation!: number;
    accountChanges?: AccountChanges;
}

export class StateChanges {
    hash!: string;
    stateAccessesPerAccounts?: Map<string, { stateAccess: StateAccessPerAccount[] }>;

    constructor(init?: Partial<StateChanges>) {
        Object.assign(this, init);
    }
}
