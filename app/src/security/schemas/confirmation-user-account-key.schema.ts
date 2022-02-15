import {Prop, Schema, SchemaFactory} from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';
import {ClientUser, ClientUserDocument} from '../../core/schemas/client-user.schema';
import * as autoPopulate from 'mongoose-autopopulate';

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
        ref: 'ClientUser',
        autopopulate: true
    })
    user: ClientUserDocument
}

const ConfirmationUserAccountKeySchema = SchemaFactory.createForClass(ConfirmationUserAccountKey);

// @ts-ignore
ConfirmationUserAccountKeySchema.plugin(autoPopulate);

export {ConfirmationUserAccountKeySchema};