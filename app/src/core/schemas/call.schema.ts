import {BaseSchema} from './base.schema';
import {Prop, Schema, SchemaFactory} from '@nestjs/mongoose';
import {Document, Schema as MongooseSchema} from 'mongoose';
import {Exclude, Expose} from 'class-transformer';
import {createSerializer} from '../serializer/serializer';
import {ConversationDocument} from "./conversation.schema";

export enum CallStatus {
    INITIATED = 0,
    IN_PROGRESS = 1,
    ENDED = 2,
    UNANSWERED = 3
}

export type CallDocument = Document & Call;

@Exclude()
@Schema({
    timestamps: true,
    toObject: {
        virtuals: true
    },
    toJSON: {
        virtuals: true
    },
    id: true
})
export class Call extends BaseSchema
{
    @Expose()
    @Prop({
        type: MongooseSchema.Types.Date,
        required: false,
        default: null
    })
    endTime: Date;

    @Expose()
    @Prop({
        type: MongooseSchema.Types.Boolean,
        required: true,
    })
    isDirect: boolean;

    @Expose()
    @Prop({
        type: MongooseSchema.Types.Number,
        enum: CallStatus,
        required: true
    })
    status: number;

    @Prop({
        type: MongooseSchema.Types.ObjectId,
        ref: 'Conversation',
        required: false,
        default: null
    })
    conversation: ConversationDocument;
}

const CallSchema = SchemaFactory.createForClass(Call);

CallSchema.methods.isEnded = function()
{

    return [CallStatus.ENDED, CallStatus.UNANSWERED].includes(this.status);
}

CallSchema.methods.serialize = createSerializer([Call]);

export { CallSchema };