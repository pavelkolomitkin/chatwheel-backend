import {BadRequestException, Injectable} from "@nestjs/common";
import {InjectModel} from "@nestjs/mongoose";
import {
    ConversationMessageList,
    ConversationMessageListDocument
} from "../../core/schemas/conversation-message-list.schema";
import {Model} from "mongoose";
import {ClientUserDocument} from "../../core/schemas/client-user.schema";
import {ConversationDocument} from "../../core/schemas/conversation.schema";
import {MessageDocument} from "../../core/schemas/message.schema";
import {ConversationMessage, ConversationMessageDocument} from "../../core/schemas/conversation-message.schema";

@Injectable()
export class ConversationMessageListService
{
    constructor(
        @InjectModel(ConversationMessageList.name) private readonly model: Model<ConversationMessageListDocument>,
        @InjectModel(ConversationMessage.name) private readonly messageModel: Model<ConversationMessageDocument>
    ) {
    }

    async create(owner: ClientUserDocument, conversation: ConversationDocument, lastMessage: MessageDocument = null): Promise<ConversationMessageListDocument>
    {
        const result: ConversationMessageListDocument = new this.model({
            owner: owner,
            conversation: conversation,
            lastMessage: lastMessage
        });

        await result.save();

        return result;
    }

    async get(user: ClientUserDocument, conversation: ConversationDocument): Promise<ConversationMessageListDocument>
    {
        return this.model.findOne({
            owner: user,
            conversation: conversation
        });
    }

    getConversationMessageLists(conversation: ConversationDocument)
    {
        return this.model.find({
            conversation: conversation
        }).populate('owner');
    }

    async removeAllLastMessages(message: MessageDocument)
    {
        await this.model.updateMany({ lastMessage: message }, { $set: { lastMessage: null } });
    }

    async validateOwnership(
        messageList: ConversationMessageListDocument,
        user: ClientUserDocument,
        errorMessage: string = 'Conversation is not found!')
    {
        if (!this.isUserOwner(messageList, user))
        {
            throw new BadRequestException(errorMessage);
        }
    }

    isUserOwner(messageList: ConversationMessageListDocument, user: ClientUserDocument)
    {
        return (messageList.owner.id === user.id);
    }

    async remove(messageList: ConversationMessageListDocument,
           user: ClientUserDocument)
    {
        await this.validateOwnership(messageList, user);

        // remove all conversation messages related to the messageList
        await this.messageModel.deleteMany({
            messageList: messageList
        });

        // remove the messageList itself

        await messageList.delete();
    }
}