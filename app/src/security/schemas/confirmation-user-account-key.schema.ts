import {Prop, Schema, SchemaFactory} from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';
import {ClientUser, ClientUserDocument} from '../../core/schemas/client-user.schema';

@Schema({
    timestamps: true,
})
export class ConfirmationUserAccountKey extends Document
{
    @Prop({
        type: MongooseSchema.Types.String,
        unique: true,
        required: true
    })
    key: string;

    @Prop({
        type: MongooseSchema.Types.ObjectId,
        ref: 'ClientUser'
    })
    user: ClientUserDocument
}

export const ConfirmationUserAccountKeySchema = SchemaFactory.createForClass(ConfirmationUserAccountKey);