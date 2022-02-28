import {BaseSchema} from './base.schema';
import {Prop, Schema, SchemaFactory} from '@nestjs/mongoose';
import {Document, Schema as MongooseSchema} from 'mongoose';
import {Exclude, Expose, Type} from 'class-transformer';
import {createSerializer} from '../serializer/serializer';
import {Call, CallDocument} from "./call.schema";
import {ClientUser, ClientUserDocument} from "./client-user.schema";

export type CallMemberLinkDocument = Document & CallMemberLink;

export enum CallMemberLinkStatus {
    CONNECTING = 0,
    CONNECTED = 1,
    REJECTED = 2,
    HUNG_UP = 3
}

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
export class CallMemberLink extends BaseSchema
{
    @Prop({
        type: MongooseSchema.Types.ObjectId,
        ref: 'Call',
        required: true
    })
    call: CallDocument;

    @Type(() => ClientUser)
    @Expose()
    @Prop({
        type: MongooseSchema.Types.ObjectId,
        ref: 'ClientUser',
        required: true
    })
    initiator: ClientUserDocument;

    @Type(() => ClientUser)
    @Expose()
    @Prop({
        type: MongooseSchema.Types.ObjectId,
        ref: 'ClientUser',
        required: true
    })
    addressee: ClientUserDocument;

    @Expose()
    @Prop({
        type: MongooseSchema.Types.String,
        required: false,
        default: null
    })
    initiatorPeer: string;

    @Expose()
    @Prop({
        type: MongooseSchema.Types.String,
        required: false,
        default: null
    })
    addresseePeer: string;


    @Prop({
        type: MongooseSchema.Types.Number,
        required: true
    })
    status: number;
}

const CallMemberLinkSchema = SchemaFactory.createForClass(CallMemberLink);

CallMemberLinkSchema.methods.serialize = createSerializer([CallMemberLink]);

export { CallMemberLinkSchema };