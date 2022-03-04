import {BaseSchema} from "./base.schema";
import {Prop, Schema, SchemaFactory} from "@nestjs/mongoose";
import {Document, Schema as MongooseSchema} from "mongoose";
import {Conversation, ConversationDocument} from "./conversation.schema";
import {UserDocument} from "./user.schema";
import {Exclude} from "class-transformer";
import {ConversationMessage, ConversationMessageDocument} from "./conversation-message.schema";
import {ClientUser} from "./client-user.schema";
import {Call} from "./call.schema";

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

    @Prop({
        type: MongooseSchema.Types.ObjectId,
        ref: 'Conversation',
        required: true
    })
    conversation: ConversationDocument;

    @Prop({
        type: MongooseSchema.Types.ObjectId,
        ref: 'ConversationMessage',
        required: false,
        default: null
    })
    lastMessage: ConversationMessageDocument;
}

const ConversationMessageListSchema = SchemaFactory.createForClass(ConversationMessageList);

ConversationMessageListSchema.methods.serialize = function(groups: any = [])
{
    let lastMessage = null;
    if (!!this.lastMessage)
    {
        lastMessage = {
            id: this.lastMessage.id,
            isRead: this.lastMessage.isRead,
            message: this.lastMessage.message.serialize(groups)
        };

        const author: ClientUser = this.lastMessage.message.author;
        // @ts-ignore
        lastMessage.message.author = author ? author.serialize(groups) : null;

        const call: Call = this.lastMessage.message.call;
        // @ts-ignore
        lastMessage.message.call = call ? call.serialize(groups) : null;
    }

    return {
        id: this.id,
        createdAt: this.createdAt,
        updatedAt: this.updatedAt,
        lastMessage: lastMessage
    };
}
ConversationMessageListSchema.plugin(require('mongoose-autopopulate'));

export { ConversationMessageListSchema };