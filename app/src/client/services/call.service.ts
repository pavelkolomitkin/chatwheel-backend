import {BadRequestException, Injectable} from '@nestjs/common';
import {InjectModel} from '@nestjs/mongoose';
import {Call, CallDocument, CallStatus} from '../../core/schemas/call.schema';
import {Model, Types} from 'mongoose';
import {ClientUser, ClientUserDocument} from '../../core/schemas/client-user.schema';
import {InitiateCallDto} from '../dto/initiate-call.dto';
import {ProfileService} from './profile.service';
import {CallMemberService} from './call-member.service';
import {CallMember, CallMemberDocument, CallMemberStatus} from '../../core/schemas/call-member.schema';
import {AnswerCallDto} from '../dto/answer-call.dto';
import {CallMemberLinkService} from './call-member-link.service';
import {CallMemberLinkDocument, CallMemberLinkStatus} from '../../core/schemas/call-member-link.schema';
import {ConnectCallDto} from '../dto/connect-call.dto';
import {ConversationMessageService} from './conversation-message.service';

@Injectable()
export class CallService
{
    constructor(
        @InjectModel(Call.name) private readonly model: Model<CallDocument>,

        private readonly profileService: ProfileService,
        private readonly callMemberService: CallMemberService,
        private readonly callMemberLinkService: CallMemberLinkService,
        private readonly messageService: ConversationMessageService,
    ) {
    }

    getModel()
    {
        return this.model;
    }

    async getList(user: ClientUserDocument, criteria: any, isDirect: boolean = true,  limit: number = 10)
    {
        const matchCriteria: any[] = [
            { 'members.user': user._id, }
        ];

        this.handleLastDateSearchCriterion(matchCriteria, criteria);
        this.handleLastIdSearchCriterion(matchCriteria, criteria);


        const searchResult = await this.model.aggregate([
            {
                $match: {
                    isDirect: isDirect
                }
            },
            {
                $lookup: {
                    from: 'callmembers',
                    localField: '_id',
                    foreignField: 'call',
                    as: 'members'
                }
            },
            {
                $match: {
                    $and: matchCriteria
                }
            },
            {
                $sort: {
                    updatedAt: -1
                }
            },
            {
                $project: { _id: 1 }
            }
        ])
            .limit(limit)
        ;
        if (searchResult.length === 0)
        {
            return [];
        }

        const ids: any[] = searchResult.map(item => item._id);
        const result: CallDocument[] = await this.model.find({
            _id: {
                $in: ids
            }
        })
            .sort({ updatedAt: -1 })
            .populate({
                path: 'members',
                model: CallMember.name,
                populate: {
                    path: 'user',
                    model: ClientUser.name
                }
            });

        return result;
    }

    handleLastDateSearchCriterion(matchCriteria: any[], criteria: any)
    {
        if (criteria.lastDate)
        {
            matchCriteria.push({ 'updatedAt': { $lte: criteria.lastDate }});
        }
    }

    handleLastIdSearchCriterion(matchCriteria: any[], criteria: any)
    {
        if (criteria.latestId)
        {
            matchCriteria.push({ _id: { $ne: new Types.ObjectId(criteria.latestId) } });
        }
    }

    async initiate(initiator: ClientUserDocument, addressee: ClientUserDocument, data: InitiateCallDto): Promise<CallDocument>
    {
        await this.profileService.validateBanStatus(initiator, addressee);

        const result: CallDocument = new this.model({
            isDirect: data.isDirect,
            status: CallStatus.INITIATED
        });
        await result.save();

        const initiatorMember: CallMemberDocument = await this.callMemberService.create(
            result,
            initiator,
            true,
            CallMemberStatus.CONNECTED,
        );

        await this.callMemberService.joinToCall(initiatorMember, data.socketId);
        result.members.push(initiatorMember._id);

        const addresseeMember: CallMemberDocument = await this
            .callMemberService
            .create(result, addressee, false, CallMemberStatus.IN_PENDING);
        result.members.push(addresseeMember._id);

        await result.save();

        if (data.isDirect)
        {
            await this.messageService.sendCallToUser(result, initiator, addressee);
        }

        return result;
    }

    async answer(user: ClientUserDocument, call: CallDocument, data: AnswerCallDto)
    {
        // get the member entity of the user related to the call
        const member: CallMemberDocument = await this.callMemberService.getMember(user, call);
        // it there isn't one
            // throw the error
        if (!member)
        {
            throw new BadRequestException('The call is not found!');
        }

        // if the join time is not null
            // throw the error 'You have already joined the call'
        if (member.joinTime !== null)
        {
            throw new BadRequestException('You have already joined the call!');
        }

        // join the user to the call
        await this.callMemberService.joinToCall(member, data.socketId);

        // get all active members related to the call
        const activeMembers: CallMemberDocument[] = await this.callMemberService.getMembers(call, true);

        // for each member except the user themselves
            // create a call member link
        for (let member of activeMembers)
        {
            if (member.user.id !== user.id)
            {
                await this.callMemberLinkService.initiate(
                    call, user, member.user, data.peerId
                );
            }
        }
    }

    async reject(user: ClientUserDocument, call: CallDocument)
    {
        // get the member entity of the user related to the call
        const member: CallMemberDocument = await this.callMemberService.getMember(user, call);
        // it there isn't one
        // throw the error
        if (!member)
        {
            throw new BadRequestException('The call is not found!');
        }

        await this.callMemberService.rejectCall(member);

        // get all active members related to the call
        const activeMembers: CallMemberDocument[] = await this.callMemberService.getMembers(call, true);
        for (let member of activeMembers)
        {
            if (member.user.id !== user.id)
            {
                await this.callMemberLinkService.reject(
                    call, user, member.user
                );
            }
        }

        if (activeMembers.length < 2)
        {
            await this.endUpCall(call, CallStatus.UNANSWERED);
        }
    }

    async hangUp(user: ClientUserDocument, call: CallDocument)
    {
        // get the member entity of the user related to the call
        const member: CallMemberDocument = await this.callMemberService.getMember(user, call);
        // it there isn't one
        // throw the error
        if (!member)
        {
            throw new BadRequestException('The call is not found!');
        }

        await this.callMemberService.hangUp(member);

        const pendingMembers: CallMemberDocument[] = await this.callMemberService.getPendingMembers(call);
        for (let member of pendingMembers)
        {
            if (member.user.id !== user.id)
            {
                await this.callMemberLinkService.createHangUp(call, user, member.user);
            }
        }

        await this.callMemberLinkService.hangUp(call, user);

        const activeMembers: CallMemberDocument[] = await this.callMemberService.getMembers(call, true);
        if (activeMembers.length < 2)
        {
            await this.endUpCall(call);
        }
    }

    async connect(user: ClientUserDocument, link: CallMemberLinkDocument, data: ConnectCallDto)
    {
        // validate addressee's relation to the link
        await this.callMemberLinkService.validateAddressee(user, link);

        // put the user's peer id (data.peerId) to the link.addresseePeer
        link.addresseePeer = data.peerId;
        link.status = CallMemberLinkStatus.CONNECTED;
        await link.save();

        // get the link's initiator
        await link.populate('initiator');
        await link.populate('call');
        const initiator: ClientUserDocument = link.initiator;
        const call: CallDocument = link.call;

        // get the whole number of links being initiated by the initiator
        const wholeLinkNumber: number = await this
            .callMemberLinkService
            .getUserInitiateLinkNumber(initiator, call);

        // get the number of links being initiated by the initiator with statuses CONNECTED
        const connectedLinkNumber: number = await this
            .callMemberLinkService
            .getUserInitiateLinkNumber(initiator, call, [CallMemberLinkStatus.CONNECTED]);

        // if the numbers are equal
            // get the initiator's member
            // change the member's status to CONNECTED
        if (wholeLinkNumber === connectedLinkNumber)
        {
            const member: CallMemberDocument = await this.callMemberService.getMember(initiator, call);

            member.status = CallMemberLinkStatus.CONNECTED;
            await member.save();

            if (call.status === CallStatus.INITIATED)
            {
                call.status = CallStatus.IN_PROGRESS;
                await call.save();
            }
        }
    }

    async getActiveCallById(callId:string)
    {
        return this.model.findOne({
            _id: new Types.ObjectId(callId),
            status: {
                $in: [
                    CallStatus.INITIATED,
                    CallStatus.IN_PROGRESS
                ]
            }
        });
    }

    async endUpCall(call: CallDocument, status: CallStatus = CallStatus.ENDED)
    {
        // @ts-ignore
        if (call.isEnded())
        {
            return;
        }

        call.endTime = new Date();
        call.status = status;

        await call.save();

        // TODO this is the current implementation for only individual calls and conversations!!!
        if (call.isDirect)
        {
            const members: CallMemberDocument[] = await this.callMemberService.getMembers(call);
            if (members.length === 2)
            {
                await this.messageService.sendCallToUser(call, members[0].user, members[1].user);
            }
        }
    }
}