import {Injectable} from "@nestjs/common";
import {InjectModel} from "@nestjs/mongoose";
import {
    ConversationMessageList,
    ConversationMessageListDocument
} from "../../core/schemas/conversation-message-list.schema";
import {Model} from "mongoose";
import {ClientUserDocument} from "../../core/schemas/client-user.schema";
import {ConversationDocument} from "../../core/schemas/conversation.schema";
import {MessageDocument} from "../../core/schemas/message.schema";

@Injectable()
export class ConversationMessageListService
{
    constructor(
        @InjectModel(ConversationMessageList.name) private readonly model: Model<ConversationMessageListDocument>
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

    getConversationLists(conversation: ConversationDocument)
    {
        return this.model.find({
            conversation: conversation
        }).populate('owner');
    }

    async removeAllLastMessages(message: MessageDocument)
    {
        await this.model.updateMany({ lastMessage: message }, { $set: { lastMessage: null } });
    }
}