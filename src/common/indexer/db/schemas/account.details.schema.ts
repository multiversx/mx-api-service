import { Prop, SchemaFactory, Schema } from '@nestjs/mongoose';
import mongoose, { HydratedDocument } from 'mongoose';
import { AccountAssets } from 'src/common/assets/entities/account.assets';
import { ScamInfo } from 'src/common/entities/scam-info.dto';
import { NftCollectionAccount } from 'src/endpoints/collections/entities/nft.collection.account';
import { NftAccount } from 'src/endpoints/nfts/entities/nft.account';
import { TokenWithBalance } from 'src/endpoints/tokens/entities/token.with.balance';

export type AccountDetailsDocument = HydratedDocument<AccountDetails>;

@Schema({ collection: 'account-details', timestamps: true })
export class AccountDetails {
    @Prop({ type: mongoose.Schema.Types.ObjectId, auto: true })
    _id!: string;

    @Prop({ required: true, type: String })
    address: string = '';

    @Prop({ required: true, type: String })
    balance: string = '';

    @Prop({ required: true, type: Number })
    nonce: number = 0;

    @Prop({ required: true, type: Number })
    timestamp: number = 0;

    @Prop({ required: true, type: Number })
    shard: number = 0;

    @Prop({ required: false, type: String })
    ownerAddress?: string;

    @Prop({ type: Object, required: false })
    assets?: AccountAssets;

    @Prop({ required: false, type: Number })
    deployedAt?: number | null;

    @Prop({ required: false, type: String })
    deployTxHash?: string | null;

    @Prop({ type: Object, required: false })
    ownerAssets?: AccountAssets;

    @Prop({ required: false, type: Boolean })
    isVerified?: boolean;

    @Prop({ required: false, type: Number })
    txCount?: number;

    @Prop({ required: false, type: Number })
    scrCount?: number;

    @Prop({ required: false, type: Number })
    transfersLast24h?: number;

    @Prop({ required: false, type: String })
    code?: string;

    @Prop({ required: false, type: String })
    codeHash?: string;

    @Prop({ required: false, type: String })
    rootHash?: string;

    @Prop({ required: false, type: String })
    username?: string;

    @Prop({ required: true, type: String })
    developerReward: string = '0';

    @Prop({ required: false, type: Boolean })
    isUpgradeable?: boolean;

    @Prop({ required: false, type: Boolean })
    isReadable?: boolean;

    @Prop({ required: false, type: Boolean })
    isPayable?: boolean;

    @Prop({ required: false, type: Boolean })
    isPayableBySmartContract?: boolean;

    @Prop({ type: Object, required: false })
    scamInfo?: ScamInfo;

    @Prop({ type: Array, required: false })
    nftCollections?: NftCollectionAccount[];

    @Prop({ type: Array, default: [] })
    nfts?: NftAccount[] = [];

    @Prop({ type: Array, default: [] })
    tokens?: TokenWithBalance[] = [];

    @Prop({ required: false, type: Number })
    activeGuardianActivationEpoch?: number;

    @Prop({ required: false, type: String })
    activeGuardianAddress?: string;

    @Prop({ required: false, type: String })
    activeGuardianServiceUid?: string;

    @Prop({ required: false, type: Number })
    pendingGuardianActivationEpoch?: number;

    @Prop({ required: false, type: String })
    pendingGuardianAddress?: string;

    @Prop({ required: false, type: String })
    pendingGuardianServiceUid?: string;

    @Prop({ required: false, type: Boolean })
    isGuarded?: boolean;

    constructor(init?: Partial<AccountDetails>) {
        Object.assign(this, init);
    }
}

export const AccountDetailsSchema = SchemaFactory.createForClass(AccountDetails);

AccountDetailsSchema.index({ address: 1 }, { unique: true });
AccountDetailsSchema.index({ "tokens.identifier": 1 });
AccountDetailsSchema.index({ "nfts.identifier": 1 });