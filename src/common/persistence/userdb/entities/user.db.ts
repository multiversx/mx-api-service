import { Column, Entity, Index, PrimaryColumn, ObjectIdColumn } from 'typeorm';

@Entity('user')
@Index(['address'], { unique: true })
export class UserDb {
    // dummy
    @ObjectIdColumn()
    identifier?: string;

    @PrimaryColumn()
    address: string = '';

    @Column()
    availability: number = 0;
}
