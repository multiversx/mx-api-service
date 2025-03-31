import { Column, Entity, Index, ObjectIdColumn } from 'typeorm';

@Entity('accounts_details')
@Index(['address'])
export class AccountDetailedDb {
  @ObjectIdColumn()
  _id?: string;

  @Column()
  address: string = '';

  @Column()
  balance: string = '';

  @Column()
  nonce: number = 0;

  @Column()
  timestamp: number = 0;

  @Column()
  shard: number = 0;

  @Column()
  ownerAddress: string = '';

  @Column('json', { nullable: true })
  assets?: any;

  @Column()
  deployedAt?: number | null;

  @Column()
  deployTxHash?: string | null;

  @Column('json', { nullable: true })
  ownerAssets?: any;

  @Column()
  isVerified?: boolean;

  @Column()
  txCount?: number;

  @Column()
  scrCount?: number;

  @Column()
  transfersLast24h?: number;

  @Column()
  code: string = '';

  @Column()
  codeHash: string = '';

  @Column()
  rootHash: string = '';

  @Column()
  username?: string;

  @Column()
  developerReward: string = '';

  @Column()
  isUpgradeable?: boolean;

  @Column()
  isReadable?: boolean;

  @Column()
  isPayable?: boolean;

  @Column()
  isPayableBySmartContract?: boolean;

  @Column('json', { nullable: true })
  scamInfo?: any;

  @Column('json', { nullable: true })
  nftCollections?: any[];

  @Column('json', { nullable: true })
  nfts?: any[];

  @Column()
  activeGuardianActivationEpoch?: number;

  @Column()
  activeGuardianAddress?: string;

  @Column()
  activeGuardianServiceUid?: string;

  @Column()
  pendingGuardianActivationEpoch?: number;

  @Column()
  pendingGuardianAddress?: string;

  @Column()
  pendingGuardianServiceUid?: string;

  @Column()
  isGuarded?: boolean;
}
