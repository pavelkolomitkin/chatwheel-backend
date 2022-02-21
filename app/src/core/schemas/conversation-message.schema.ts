import {BaseSchema} from "./base.schema";
import {Prop, Schema, SchemaFactory} from "@nestjs/mongoose";
import {Document, Schema as MongooseSchema} from "mongoose";
import {ConversationMessageListDocument} from "./conversation-message-list.schema";
import {Message, MessageDocument} from "./message.schema";
import {Exclude, Expose, Type} from "class-transformer";

export type ConversationMessageDocument = Document & ConversationMessage;

@Exclude()
@Schema({
    id: true,
    timestamps: true,
    toObject: {
        virtuals: true,
    },
    toJSON: {
        virtuals: true
    }
})
export class ConversationMessage extends BaseSchema
{
    @Exclude()
    @Prop({
        type: MongooseSchema.Types.ObjectId,
        ref: 'ConversationMessageList',
        required: true,
    })
    messageList: ConversationMessageListDocument;

    @Type(() => Message)
    @Expose()
    @Prop({
        type: MongooseSchema.Types.ObjectId,
        ref: 'Message',
        required: true
    })
    message: MessageDocument;

    @Expose()
    @Prop({
        type: MongooseSchema.Types.Boolean,
        default: false
    })
    isRead: boolean;
}


const ConversationMessageSchema = SchemaFactory.createForClass(ConversationMessage);

export { ConversationMessageSchema };