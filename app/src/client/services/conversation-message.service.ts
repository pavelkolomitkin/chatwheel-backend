import {BadRequestException, Injectable} from "@nestjs/common";
import {InjectModel} from "@nestjs/mongoose";
import {ConversationMessage, ConversationMessageDocument} from "../../core/schemas/conversation-message.schema";
import {Model, Types} from "mongoose";
import {
    ConversationMessageList,
    ConversationMessageListDocument
} from "../../core/schemas/conversation-message-list.schema";
import {ClientUserDocument} from "../../core/schemas/client-user.schema";
import {ProfileService} from "./profile.service";
import {ConversationDocument} from "../../core/schemas/conversation.schema";
import {ConversationService} from "./conversation.service";
import {Message, MessageDocument} from "../../core/schemas/message.schema";
import {ConversationMessageListService} from "./conversation-message-list.service";
import {SentMessageUserDto} from "../dto/sent-message-user.dto";
import {SentMessageConversationDto} from "../dto/sent-message-conversation.dto";
import {EditMessageDto} from "../dto/edit-message.dto";
import {RemoveMessageDto} from "../dto/remove-message.dto";

@Injectable()
export class ConversationMessageService
{
    constructor(
        @InjectModel(ConversationMessage.name) private readonly model: Model<ConversationMessageDocument>,
        @InjectModel(Message.name) private readonly messageModel: Model<MessageDocument>,
        private readonly messageListService: ConversationMessageListService,

        private readonly profileService: ProfileService,
        private readonly conversationService: ConversationService
    ) {    }


    getList(list: ConversationMessageListDocument, criteria: any)
    {
        const pipeline = [
            { $match: { conversationList: list.id } },
            { $lookup: { from: 'messages', localField: 'message', foreignField: '_id', as: 'message'} },
            { $sort: { createdAt: -1 } },
        ]

        this.handleExcludedMessage(pipeline, criteria);
        this.handleMessageLastDate(pipeline, criteria)

        // @ts-ignore
        return this.model.aggregate(pipeline)
            .limit(10)
            ;
    }

    handleMessageLastDate(pipeline: Array<any>, criteria: any)
    {
        if (criteria.lastDate)
        {
            pipeline.push({ $match: { 'message.createdAt': { $lte: criteria.lastDate } }  });
        }
    }

    handleExcludedMessage(pipeline: Array<any>, criteria: any)
    {
        if (criteria.excludedId)
        {
            pipeline.push({ $match: { message: { $ne: new Types.ObjectId(criteria.excludedId) } } });
        }
    }

    async sendToUser(data: SentMessageUserDto, user: ClientUserDocument, addressee: ClientUserDocument): Promise<ConversationMessageDocument>
    {
        let conversation: ConversationDocument = await this.conversationService.getIndividual(user, addressee);
        if (!conversation)
        {
            conversation = await this.conversationService.createIndividual(user, addressee);
        }

        let userMessageList: ConversationMessageListDocument = await this.messageListService.get(user, conversation);
        if (!userMessageList)
        {
            userMessageList = await this.messageListService.create(user, conversation);
        }

        let addresseeMessageList: ConversationMessageListDocument = await this.messageListService.get(addressee, conversation);
        if (!addresseeMessageList)
        {
            addresseeMessageList = await this.messageListService.create(addressee, conversation);
        }

        // create a new message
        const message: MessageDocument = new this.messageModel({
            conversation: conversation,
            author: user,
            text: data.text
        })
        await message.save();

        // create conversation messages
        const userConversationMessage: ConversationMessageDocument = await this.create(userMessageList, message, true);
        await this.create(addresseeMessageList, message, false);

        // create a conversation message for user
        userMessageList.lastMessage = message;
        // create a conversation message for addressee
        addresseeMessageList.lastMessage = message;

        await userMessageList.save();
        await addresseeMessageList.save()
        // return the new message(should be linked to the conversation)

        return userConversationMessage;
    }

    async sendToConversation(data: SentMessageConversationDto, user: ClientUserDocument, conversation: ConversationDocument): Promise<ConversationMessageDocument>
    {
        let list: ConversationMessageList = await this.messageListService.get(user, conversation);
        if (!list)
        {
            await this.messageListService.create(user, conversation, null);
        }


        const message: MessageDocument = new this.messageModel({
            conversation: conversation,
            author: user,
            text: data.text
        });
        await message.save();


        let result: ConversationMessageDocument = null;
        const lists: ConversationMessageList[] = await this.messageListService.getConversationLists(conversation);
        for (let list of lists)
        {
            const isUserMessage = list.owner.id === user.id;

            const conversationMessage: ConversationMessageDocument = await this.create(
                list,
                message,
                isUserMessage
            );

            list.lastMessage = message;
            // @ts-ignore
            await list.save();

            if (isUserMessage)
            {
                result = conversationMessage;
            }
        }

        return result;
    }

    async create(list: ConversationMessageList, message: MessageDocument, isRead: boolean): Promise<ConversationMessageDocument>
    {
        const result: ConversationMessageDocument = new this.model({
            conversationList: list,
            message: message,
            isRead: isRead
        });

        await result.save();

        return result;
    }

    async editMessage(data: EditMessageDto, conversationMessage: ConversationMessageDocument)
    {
        await conversationMessage.populate('message');

        const message: MessageDocument = conversationMessage.message;
        message.text = data.text;

        await message.save();
        conversationMessage.message = message;

        return conversationMessage;
    }

    async removeMessage(data: RemoveMessageDto, conversationMessage: ConversationMessageDocument, user: ClientUserDocument)
    {
        const { removeFromOthers } = data;

        await conversationMessage.populate('message');
        const message: MessageDocument = conversationMessage.message;

        // remove the own conversation message
        await conversationMessage.populate('messageList');
        const userMessageList: ConversationMessageListDocument = conversationMessage.messageList;

        await userMessageList.populate('lastMessage');
        if (!!userMessageList.lastMessage && (userMessageList.lastMessage.id === message.id))
        {
            userMessageList.lastMessage = null;
            await userMessageList.save();
        }

        await conversationMessage.remove();

        // trying to remove the message from others
        if (removeFromOthers)
        {
            await message.populate('author');
            if (message.author.id !== user.id)
            {
                throw new BadRequestException('You cannot remove the message for other people!');
            }

            await this.model.remove({
                message: message
            });

            await this.messageListService.removeAllLastMessages(message);
        }
    }
}