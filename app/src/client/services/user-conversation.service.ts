import {Injectable} from "@nestjs/common";
import {ClientUserDocument} from "../../core/schemas/client-user.schema";
import {InjectModel} from "@nestjs/mongoose";
import {
    ConversationMessageList,
    ConversationMessageListDocument
} from "../../core/schemas/conversation-message-list.schema";
import {Model, Types} from "mongoose";

@Injectable()
export class UserConversationService
{
    constructor(
        @InjectModel(ConversationMessageList.name) private model: Model<ConversationMessageListDocument>
    ) {
    }

    getConversations(user: ClientUserDocument, criteria: any)
    {
        const filter: Object = {};

        this.handleLastDate(filter, criteria);
        this.handleExcludeId(filter, criteria);

        return this
            .model
            .find(filter)
            .populate('conversation')
            .populate('conversation.members.$*member')
            .populate('lastMessage')
            .sort({ updatedAt: -1 })
            .limit(10)
        ;
    }

    handleLastDate(filter: any, criteria: any)
    {
        if (criteria.lastDate)
        {
            filter.updatedAt = {
                $lte: criteria.lastDate
            }
        }
    }

    handleExcludeId(filter: any, criteria: any)
    {
        if (criteria.excludeId)
        {
            filter._id = {
                $ne : new Types.ObjectId(criteria.excludeId)
            }
        }
    }
}