import { Column, Entity, Index, PrimaryColumn } from 'typeorm';

@Entity('user')
@Index(['address'], { unique: true })
export class UserDb {
    @PrimaryColumn()
    address: string = '';

    @Column()
    availability: number = 0;
}
