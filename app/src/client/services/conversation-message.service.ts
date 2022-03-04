import {BadRequestException, Injectable} from "@nestjs/common";
import {InjectModel} from "@nestjs/mongoose";
import {ConversationMessage, ConversationMessageDocument} from "../../core/schemas/conversation-message.schema";
import {Model, Types} from "mongoose";
import {
    ConversationMessageList,
    ConversationMessageListDocument
} from "../../core/schemas/conversation-message-list.schema";
import {ClientUser, ClientUserDocument} from "../../core/schemas/client-user.schema";
import {ProfileService} from "./profile.service";
import {ConversationDocument} from "../../core/schemas/conversation.schema";
import {ConversationService} from "./conversation.service";
import {Message, MessageDocument, MessageTypes} from "../../core/schemas/message.schema";
import {ConversationMessageListService} from "./conversation-message-list.service";
import {SentMessageUserDto} from "../dto/sent-message-user.dto";
import {SentMessageConversationDto} from "../dto/sent-message-conversation.dto";
import {EditMessageDto} from "../dto/edit-message.dto";
import {ConversationMessageLogType} from "../../core/schemas/conversation-message-log.schema";
import {ConversationMessageLogService} from "./conversation-message-log.service";
import {Call, CallDocument, CallStatus} from "../../core/schemas/call.schema";

@Injectable()
export class ConversationMessageService
{
    constructor(
        @InjectModel(ConversationMessage.name) private readonly model: Model<ConversationMessageDocument>,
        private readonly messageLogService: ConversationMessageLogService,

        @InjectModel(Message.name) private readonly messageModel: Model<MessageDocument>,
        @InjectModel(ClientUser.name) private readonly userModel: Model<ClientUserDocument>,
        private readonly messageListService: ConversationMessageListService,

        private readonly profileService: ProfileService,
        private readonly conversationService: ConversationService
    ) {    }

    getConversationMessageModel()
    {
        return this.model;
    }

    getMessageModel()
    {
        return this.messageModel;
    }

    async getList(user: ClientUserDocument, list: ConversationMessageListDocument, criteria: any, limit: number = 30)
    {
        await this.messageListService.validateOwnership(list, user);

        let pipeline = [
            { $match: { messageList: list._id } },
            { $lookup: { from: 'messages', localField: 'message', foreignField: '_id', as: 'message'} },
        ];

        const criteriaFilter: any = this.getCriteriaMatchFilter(criteria);
        if (criteriaFilter)
        {
            pipeline.push(criteriaFilter);
        }

        // @ts-ignore
        pipeline = pipeline.concat([
            { $unwind: '$message' },
            { $sort: { 'message.createdAt': -1 } },
            { $project: { _id: 1 } }
        ]);

        // @ts-ignore
        const items = await this.model.aggregate(pipeline).limit(limit);

        const messageIds = items.map(item => item._id);
        const messages = await this.model.find({
            _id: {
                $in : messageIds
            }
        })
            .populate({
                path: 'message',
                populate: ['author', 'call']
            })
            .sort({ createdAt: -1 });

        const result = [];
        for (let message of messages)
        {
            const item = {
                id: message.id,
                isRead: message.isRead,
                // @ts-ignore
                message: message.message.serialize()
            };

            result.push(item);
        }

        return result;
    }

    getCriteriaMatchFilter(criteria: any)
    {
        const criteriaFilter = [];
        this.handleLatestMessageMatchCriterion(criteriaFilter, criteria);
        this.handleMessageLastDateMatchCriterion(criteriaFilter, criteria);

        if (criteriaFilter.length > 0)
        {
            return { $match: {
                    //@ts-ignore
                    $and: criteriaFilter
                }
            };
        }

        return null;
    }

    handleMessageLastDateMatchCriterion(matchCriteria: any[], criteria: any)
    {
        if (criteria.lastDate)
        {
             matchCriteria.push({ 'message.createdAt': { $lte: criteria.lastDate }});
        }
    }

    handleLatestMessageMatchCriterion(matchCriteria: any[], criteria: any)
    {
        if (criteria.latestId)
        {
            matchCriteria.push({ _id: { $ne: new Types.ObjectId(criteria.latestId) } });
        }
    }

    async sendTextToUser(data: SentMessageUserDto, user: ClientUserDocument, addressee: ClientUserDocument): Promise<ConversationMessageDocument>
    {
        const isUserBanned: boolean = await this.profileService.isAddresseeBanned(addressee, user);
        if (isUserBanned)
        {
            throw new BadRequestException("You've been banned by the user!");
        }

        // create a new message
        const newMessage: MessageDocument = new this.messageModel({
            author: user,
            text: data.text
        });

        return await this.sendToUser(newMessage, user, addressee);
    }



    async sendCallToUser(call: CallDocument, user: ClientUserDocument, addressee: ClientUserDocument): Promise<ConversationMessageDocument>
    {
        // create a new message
        const newMessage: MessageDocument = new this.messageModel({
            call: call,
            type: Message.getTypeByCall(call)
        });

        return await this.sendToUser(newMessage, user, addressee);
    }

    async sendToUser(message: MessageDocument, user: ClientUserDocument, addressee: ClientUserDocument): Promise<ConversationMessageDocument>
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

        message.conversation = conversation;
        await message.save();

        // create conversation messages
        const userConversationMessage: ConversationMessageDocument = await this.create(userMessageList, message, true);
        const addresseeConversationMessage: ConversationMessageDocument = await this.create(addresseeMessageList, message, false);

        // create a conversation message for user
        userMessageList.lastMessage = userConversationMessage;
        // create a conversation message for addressee
        addresseeMessageList.lastMessage = addresseeConversationMessage;

        await userMessageList.save();
        await addresseeMessageList.save();

        await this.messageLogService.log(message, ConversationMessageLogType.ADD);
        await this.messageLogService.logMessageNumberChanged([addressee]);

        return userConversationMessage;
    }

    async sendTextToConversation(data: SentMessageConversationDto, user: ClientUserDocument, messageList: ConversationMessageListDocument)
        : Promise<ConversationMessageDocument>
    {
        const newMessage: MessageDocument = new this.messageModel({
            author: user,
            text: data.text
        });

        return await this.sendToConversation(newMessage, user, messageList);
    }

    async sendCallToConversation(call: CallDocument, user: ClientUserDocument, messageList: ConversationMessageListDocument)
        : Promise<ConversationMessageDocument>
    {
        const newMessage: MessageDocument = new this.messageModel({
            author: user,
            call: call,
            type: Message.getTypeByCall(call)
        });

        return await this.sendToConversation(newMessage, user, messageList);
    }

    async sendToConversation(message: MessageDocument, user: ClientUserDocument, messageList: ConversationMessageListDocument)
        : Promise<ConversationMessageDocument>
    {
        // validated the conversation message list in order to check whether the user is an owner of the list
        await this.messageListService.validateOwnership(messageList, user);
        // validated the conversation message list on having the related conversation itself
        await messageList.populate('conversation');

        const conversation: ConversationDocument = messageList.conversation;
        if (!conversation)
        {
            throw new BadRequestException('The conversation is not found!');
        }

        // validated the user on membership of the conversation
        await this.conversationService.validateMembership(conversation, user);

        // if it's an individual conversation
            // check the user not being blocked by the addressee
        await this.validateBanStatus(conversation, user);

        // create a new message with the fields: conversation, author = user, and text = data.text
        message.conversation = conversation;
        await message.save();


        // fetch all the members of the conversation
        const members: ClientUserDocument[] = await this.conversationService.getMembers(conversation);
        // for optimization purposes, fetch all the conversation message lists related to the conversation
        const messageLists: ConversationMessageListDocument[] = await this
            .messageListService
            .getConversationMessageLists(conversation);


        let result: ConversationMessageDocument = null;
        for (let member of members)
        {
            let currentMessageList = messageLists.find(item => item.owner.id === member.id);
            if (!currentMessageList)
            {
                currentMessageList = await this.messageListService.create(member, conversation);
            }

            const isUsersMessage: boolean = user.id === member.id;

            const conversationMessage: ConversationMessageDocument = await this.create(
                currentMessageList,
                message,
                isUsersMessage
            );

            currentMessageList.lastMessage = conversationMessage;
            await currentMessageList.save();

            if (isUsersMessage)
            {
                result = conversationMessage;
            }
        }

        await this.messageLogService.log(message, ConversationMessageLogType.ADD);
        await this.messageLogService.logMessageNumberChanged(members.filter(item => item.id !== user.id));

        return result;
    }

    async validateOwnership(message: ConversationMessageDocument, user: ClientUserDocument)
    {
        await message.populate({
            path: 'messageList',
            model: ConversationMessageList.name,
            populate: {
                path: 'owner',
                model: ClientUser.name
            }
        });

        if (message.messageList.owner.id !== user.id)
        {
            throw new BadRequestException('The message is not found!');
        }
    }

    async validateMessageOwnership(message: MessageDocument, user: ClientUserDocument)
    {
        await message.populate({
            path: 'author',
            model: ClientUser.name
        });

        if (message.author.id !== user.id)
        {
            throw new BadRequestException('The message is not found!');
        }
    }

    async validateBanStatus(
        conversation: ConversationDocument,
        user: ClientUserDocument,
        errorMessage: string = "You've been banned by the user!"
    )
    {
        if (!conversation.isIndividual)
        {
            return;
        }

        const addressee: ClientUserDocument = await this.conversationService.getAddressee(conversation, user);
        if (!addressee)
        {
            return;
        }

        const isBanned: boolean = await this.profileService.isAddresseeBanned(addressee, user);
        if (isBanned)
        {
            throw new BadRequestException(errorMessage);
        }
    }

    async create(list: ConversationMessageListDocument, message: MessageDocument, isRead: boolean): Promise<ConversationMessageDocument>
    {
        const result: ConversationMessageDocument = new this.model({
            messageList: list,
            message: message,
            isRead: isRead
        });

        await result.save();

        return result;
    }

    validateEditMessageType(message: MessageDocument)
    {
        if (message.type !== MessageTypes.TEXT)
        {
            throw new BadRequestException(`You can't edit or delete this message!`);
        }
    }

    async editMessage(data: EditMessageDto, conversationMessage: ConversationMessageDocument, user: ClientUserDocument)
    {
        await conversationMessage.populate('message');

        await this.validateMessageOwnership(conversationMessage.message, user);

        const message: MessageDocument = conversationMessage.message;
        this.validateEditMessageType(message);

        message.text = data.text;
        await message.save();

        await conversationMessage.save();

        await this.messageLogService.log(message, ConversationMessageLogType.EDIT);

        return conversationMessage;
    }

    async removeMessage(conversationMessage: ConversationMessageDocument, user: ClientUserDocument, removeFromOthers: boolean = false)
    {
        await conversationMessage.populate('message');

        const message: MessageDocument = conversationMessage.message;
        this.validateEditMessageType(message);

        if (removeFromOthers)
        {
            await this.validateMessageOwnership(message, user);

            await this.model.deleteMany({
                message: message._id,
            });

            await message.delete();

            await this.messageLogService.log(message, ConversationMessageLogType.REMOVE);
            // @ts-ignore
            const notifyingUpdateMessageNumberUsers = message.conversation.members
                // @ts-ignore
                .map(item => item.member)
                .filter(item => item.id !== user.id);

            await this.messageLogService.logMessageNumberChanged(notifyingUpdateMessageNumberUsers);
        }
        else
        {
            await conversationMessage.delete();
        }

        return conversationMessage;
    }

    async readLast(list: ConversationMessageListDocument, user: ClientUserDocument)
    {
        await this.messageListService.validateOwnership(list, user);

        // update all the conversation messages related to the list "messageList" which is not read yet isRead = true
        await this.model.updateMany({
            messageList: list._id,
            isRead: false
        }, {
            isRead: true
        });

        await this.messageLogService.logMessageNumberChanged([user]);
    }

    async getNewMessageNumber(user: ClientUserDocument): Promise<Number>
    {
        const result = await this.model.aggregate([
            { $lookup: { from: 'conversationmessagelists', localField: 'messageList', foreignField: '_id', as: 'messageList' } },
            { $match: {
                    $and: [
                        { 'messageList.owner': user._id },
                        { isRead: false }
                    ]
                }
            },
            { $group: { _id: null, messageNumber: { $sum: 1 } } }
        ]);

        if (result.length > 0)
        {
            return typeof result[0]['messageNumber'] !== 'undefined' ? result[0]['messageNumber'] : 0;
        }

        return 0;
    }
}