import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity('validator_rating_infos')
export class ValidatorRatingInfoDb {
  @PrimaryColumn()
  id: string = '';

  @Column({ nullable: true })
  rating: number = 0;
}
