import {BaseSchema} from './base.schema';
import {Prop, Schema, SchemaFactory} from '@nestjs/mongoose';
import {Document, Schema as MongooseSchema} from 'mongoose';
import {Exclude, Expose, Type} from 'class-transformer';
import {createSerializer} from '../serializer/serializer';
import {Call, CallDocument} from './call.schema';
import {ClientUser, ClientUserDocument} from './client-user.schema';

export type CallMemberDocument = Document & CallMember;

export enum CallMemberStatus {
    IN_PENDING = 0,
    CONNECTING = 1,
    CONNECTED = 2,
    REJECTED = 3,
    HUNG_UP = 4
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
export class CallMember extends BaseSchema
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
    user: ClientUserDocument;

    @Expose()
    @Prop({
        type: MongooseSchema.Types.Date,
        required: false,
        default: null
    })
    joinTime: Date;

    @Expose()
    @Prop({
        type: MongooseSchema.Types.Date,
        required: false,
        default: null
    })
    leftTime: Date;

    @Expose()
    @Prop({
        type: MongooseSchema.Types.Boolean,
        required: true,
        default: false
    })
    isInitiator: boolean;

    @Expose()
    @Prop({
        type: MongooseSchema.Types.Number,
        required: true,
    })
    status: number;

    @Prop({
        type: MongooseSchema.Types.String,
        required: false,
        default: null
    })
    socketConnectionId: string;
}


const CallMemberSchema = SchemaFactory.createForClass(CallMember);

CallMemberSchema.methods.isBusy = function()
{
    return  [
        CallMemberStatus.IN_PENDING,
        CallMemberStatus.CONNECTING,
        CallMemberStatus.CONNECTED,
    ].includes(this.status);
}

CallMemberSchema.methods.serialize = createSerializer([CallMember]);

export { CallMemberSchema };