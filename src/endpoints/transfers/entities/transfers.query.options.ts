export class TransfersQueryOptions {
    constructor(init?: Partial<TransfersQueryOptions>) {
        Object.assign(this, init);
    }

    withScResults?: boolean = false;
}
