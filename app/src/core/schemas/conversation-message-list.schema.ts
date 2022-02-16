import {BaseSchema} from "./base.schema";
import {Prop, Schema, SchemaFactory} from "@nestjs/mongoose";
import {Document, Schema as MongooseSchema} from "mongoose";
import {Conversation, ConversationDocument} from "./conversation.schema";
import {UserDocument} from "./user.schema";
import {createSerializer} from "../serializer/serializer";
import {Message, MessageDocument} from "./message.schema";
import {Exclude, Expose, Type} from "class-transformer";
import {ConversationMessage, ConversationMessageDocument} from "./conversation-message.schema";

export type ConversationMessageListDocument = Document & ConversationMessageList;

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
export class ConversationMessageList extends BaseSchema
{
    @Prop({
        type: MongooseSchema.Types.ObjectId,
        ref: 'User',
        required: true,
        autopopulate: true
    })
    owner: UserDocument;

    @Type(() => Conversation)
    @Expose()
    @Prop({
        type: MongooseSchema.Types.ObjectId,
        ref: 'Conversation',
        required: true
    })
    conversation: ConversationDocument;

    @Type(() => Message)
    @Expose()
    @Prop({
        type: MongooseSchema.Types.ObjectId,
        ref: 'Message',
        required: false,
        default: null
    })
    lastMessage: MessageDocument;
}

const ConversationMessageListSchema = SchemaFactory.createForClass(ConversationMessageList);

ConversationMessageListSchema.methods.serialize = createSerializer([ConversationMessageList]);
ConversationMessageListSchema.plugin(require('mongoose-autopopulate'));

export { ConversationMessageListSchema };