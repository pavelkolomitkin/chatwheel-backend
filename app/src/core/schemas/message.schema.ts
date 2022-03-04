import {BaseSchema} from "./base.schema";
import {Prop, Schema, SchemaFactory} from "@nestjs/mongoose";
import {Document, Schema as MongooseSchema} from "mongoose";
import {ClientUser, ClientUserDocument} from "./client-user.schema";
import {UserDocument} from "./user.schema";
import {ConversationDocument} from "./conversation.schema";
import {Exclude, Expose, Type} from "class-transformer";
import {createSerializer} from "../serializer/serializer";
import * as mongooseDelete from 'mongoose-delete';
import {aggregate} from '../middlewares/soft-delete-entity.middleware';
import {CallDocument, CallStatus} from "./call.schema";

export type MessageDocument = Document & Message;

export enum MessageTypes {
    TEXT,
    CALL_START,
    CALL_END,
    CALL_UNANSWERED
}

@Exclude()
@Schema({
    id: true,
    timestamps: true,
    toObject: {
        virtuals: true
    },
    toJSON: {
        virtuals: true
    }
})
export class Message extends BaseSchema
{
    @Prop({
        type: MongooseSchema.Types.ObjectId,
        ref: 'Conversation',
        required: true
    })
    conversation: ConversationDocument;

    @Expose()
    @Prop({
        type: MongooseSchema.Types.String,
        required: false,
        default: null,
        maxlength: 1000,
    })
    text: string;

    @Type(() => ClientUser)
    @Expose()
    @Prop({
        type: MongooseSchema.Types.ObjectId,
        ref: 'User',
        required: false,
    })
    author: UserDocument;

    @Expose()
    @Prop({
        type: MongooseSchema.Types.Number,
        enum: MessageTypes,
        default: MessageTypes.TEXT
    })
    type: number;

    @Expose()
    @Prop({
        type: MongooseSchema.Types.ObjectId,
        ref: 'Call',
        required: false,
        default: null
    })
    call: CallDocument;

    static getTypeByCall(call: CallDocument)
    {
        let result: number = null;

        switch (call.status)
        {
            case CallStatus.ENDED:

                result = MessageTypes.CALL_END
                break;

            case CallStatus.UNANSWERED:

                result = MessageTypes.CALL_UNANSWERED;
                break

            default:
                result = MessageTypes.CALL_START;
        }

        return result;
    }
}

const MessageSchema = SchemaFactory.createForClass(Message);

MessageSchema.methods.serialize = function (groups: any = [])
{
    const result = {
        text: this.text,
        author: !!this.author ? this.author.serialize(groups) : null,
        type: this.type,
        createdAt: this.createdAt,
        updatedAt: this.updatedAt,
        call: !!this.call ? this.call.serialize(groups) : null
    };

    return result;
}

MessageSchema.plugin(mongooseDelete, { deletedAt : true, overrideMethods: 'all' });
MessageSchema.pre('aggregate', aggregate);

export { MessageSchema };