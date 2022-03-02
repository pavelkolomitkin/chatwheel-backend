import {BadRequestException, Injectable} from "@nestjs/common";
import {InjectModel} from "@nestjs/mongoose";
import {Call, CallDocument, CallStatus} from "../../core/schemas/call.schema";
import {Model, Types} from "mongoose";
import {ClientUserDocument} from "../../core/schemas/client-user.schema";
import {InitiateCallDto} from "../dto/initiate-call.dto";
import {ProfileService} from "./profile.service";
import {CallMemberService} from "./call-member.service";
import {CallMemberDocument, CallMemberStatus} from "../../core/schemas/call-member.schema";
import {AnswerCallDto} from "../dto/answer-call.dto";
import {CallMemberLinkService} from "./call-member-link.service";
import {CallMemberLinkDocument, CallMemberLinkStatus} from "../../core/schemas/call-member-link.schema";
import {ConnectCallDto} from "../dto/connect-call.dto";

@Injectable()
export class CallService
{
    constructor(
        @InjectModel(Call.name) private readonly model: Model<CallDocument>,

        private readonly profileService: ProfileService,
        private readonly callMemberService: CallMemberService,
        private readonly callMemberLinkService: CallMemberLinkService
    ) {
    }

    getModel()
    {
        return this.model;
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
        await this.callMemberService.create(result, addressee, false, CallMemberStatus.IN_PENDING);

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
        const members: CallMemberDocument[] = await this.callMemberService.getMembers(call, true);

        // for each member except the user themselves
            // create a call member link
        for (let member of members)
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
        const members: CallMemberDocument[] = await this.callMemberService.getMembers(call, true);
        for (let member of members)
        {
            if (member.user.id !== user.id)
            {
                await this.callMemberLinkService.reject(
                    call, user, member.user
                );
            }
        }

        if (members.length < 2)
        {
            await this.endUpCall(call);
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

        await this.callMemberLinkService.hangUp(call, user);

        const members: CallMemberDocument[] = await this.callMemberService.getMembers(call, true);
        if (members.length < 2)
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

    async validateUserAvailability(user: ClientUserDocument)
    {
        const errorMessage: string = 'The user is not available for a call!';

        // ONLINE USER AVAILABILITY

        // get a member related to the user who has status either 'IN_PENDING', or 'CONNECTING', or 'CONNECTED'
        const member: CallMemberDocument = await this.callMemberService.getBusyMember(user);
        // if the member has status either CONNECTING or CONNECTED
            // thrown an error "The is busy"
        if (member)
        {
            throw new BadRequestException(errorMessage);
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
        call.endTime = new Date();
        call.status = status;

        await call.save();
    }
}