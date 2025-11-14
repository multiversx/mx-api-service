import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import mongoose, { HydratedDocument } from 'mongoose';

export type EsdtDetailsDocument = HydratedDocument<EsdtDetails>;


@Schema({ collection: 'esdt-details', timestamps: true })
export class EsdtDetails {
  @Prop({ type: mongoose.Schema.Types.ObjectId, auto: true })
  _id!: string;

  @Prop({ required: true, type: String })
  address: string = '';

  @Prop({ required: true, type: String })
  identifier: string = '';

  @Prop({ required: true, type: String })
  balance: string = '';


  constructor(init?: Partial<EsdtDetails>) {
    Object.assign(this, init);
  }
}

export const EsdtDetailsSchema = SchemaFactory.createForClass(EsdtDetails);

EsdtDetailsSchema.index({ address: 1 });
EsdtDetailsSchema.index({ identifier: 1 });
EsdtDetailsSchema.index({ address: 1, identifier: 1 }, { unique: true });
