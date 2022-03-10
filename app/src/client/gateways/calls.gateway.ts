import {Injectable} from '@nestjs/common';
import {
    OnGatewayConnection,
    OnGatewayDisconnect,
    OnGatewayInit,
    WebSocketGateway,
    WebSocketServer
} from '@nestjs/websockets';
import {Server, Socket} from 'socket.io';
import {WsJwtGuard} from '../../security/guards/ws-jwt.guard';
import {CallMemberService} from '../services/call-member.service';
import {CallMemberLinkService} from '../services/call-member-link.service';
import {CallService} from '../services/call.service';
import {CallDocument} from '../../core/schemas/call.schema';
import {CallMemberDocument, CallMemberStatus} from '../../core/schemas/call-member.schema';
import {ProfileService} from '../services/profile.service';
import {CallMemberLinkDocument, CallMemberLinkStatus} from '../../core/schemas/call-member-link.schema';

@Injectable()
@WebSocketGateway({
    namespace: 'calls'
})
export class CallsGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
    static CALL_CLIENT_CONNECTED = 'call_client_connected';

    static CALL_INCOMING_CALL = 'call_incoming_call';
    static CALL_MEMBER_IS_CONNECTING = 'call_member_is_connecting';
    static CALL_MEMBER_CONNECTED = 'call_member_connected';
    static CALL_MEMBER_REJECTED  = 'call_member_reject';
    static CALL_MEMBER_HUNG_UP = 'call_member_hung_up';


    @WebSocketServer()
    server: Server;

    constructor(
        private readonly callService: CallService,
        private readonly callMemberService: CallMemberService,
        private readonly callMemberLinkService: CallMemberLinkService,
        private readonly profileService: ProfileService,

        private readonly guard: WsJwtGuard
    ) {
    }

    afterInit(server: any): any {
        this.guard.authorize(server);
    }

    async handleConnection(client: Socket, ...args: any[]) {

        this.handleClientConnected(client, args);

        this.handleIncomingCalls(client, args);

        this.handleMemberConnection(client, args);

        this.handleMemberConnected(client, args);

        this.handleMemberRejected(client, args);

        this.handleMemberHangUp(client, args);

    }

    async handleDisconnect(client: Socket) {

        [
            'incomingCallStream',
            'memberConnectionStream',
            'memberConnectedStream',
            'memberRejectedStream',
            'memberHungUpStream'
        ].forEach((streamName) => {

            if (!!client[streamName])
            {
                client[streamName].close();
                client[streamName] = null;
            }
        });

        await this.endUpWindowCall(client);
        await this.rejectAllIncomingCalls(client);

        // @ts-ignore
        client.conn.close();
        // @ts-ignore
        client.removeAllListeners();
        // @ts-ignore
        client.disconnect(true);
    }

    handleClientConnected(client, args)
    {
        client.emit(CallsGateway.CALL_CLIENT_CONNECTED, {
            id: client.id
        });
    }

    handleIncomingCalls(client: Socket, ...args: any[])
    {
        // @ts-ignore
        const { user } = client;

        // @ts-ignore
        client.incomingCallStream = this
            .callMemberService
            .getModel()
            .watch(
                [
                    {
                        $match: {
                            'fullDocument.user': user._id,
                            'fullDocument.isInitiator': false,
                            'fullDocument.joinTime': null,
                            'fullDocument.status': CallMemberStatus.IN_PENDING,
                            'operationType': 'insert'
                        }
                    }
                ]
                , { fullDocument: 'updateLookup' }
            );

        // @ts-ignore
        client.incomingCallStream.on('change', async (data) => {

            const { fullDocument } = data;

            // get the related call
            // validate the call status - it should be either initiated or in progress(for the future group calls)
            const call: CallDocument = await this.callService.getActiveCallById(fullDocument.call.toString());
            if (!call)
            {
                return;
            }

            // get all active members of the call
            const activeMembers: CallMemberDocument[] = await this.callMemberService.getMembers(call, true);
            if (activeMembers.length === 0)
            {
                return;
            }

            const payload: any = {
                // @ts-ignore
                ...call.serialize(),
                members: []
            };

            for (let member of activeMembers)
            {
                payload.members.push(
                    {
                        // @ts-ignore
                        ...member.serialize(),
                        // @ts-ignore
                        user: member.user.serialize()
                    }
                );
            }

            // emit the event 'call_initiated' and push the call and member data to the client
            client.emit(CallsGateway.CALL_INCOMING_CALL, payload);
        });
    }

    handleMemberConnection(client: Socket, ...args: any[])
    {
        // @ts-ignore
        const { user } = client;

        // @ts-ignore
        client.memberConnectionStream = this
            .callMemberLinkService
            .getModel()
            .watch(
                [
                    {
                        $match: {
                            'fullDocument.addressee': user._id,
                            'fullDocument.addresseePeer': { $eq: null },
                            'fullDocument.initiatorPeer': { $ne: null },
                            'fullDocument.status': CallMemberLinkStatus.CONNECTING,
                            'operationType': 'insert'
                        }
                    }
                ]
            ,
                { fullDocument: 'updateLookup' });

        // @ts-ignore
        client.memberConnectionStream.on('change', async (data) => {

            const { fullDocument: { _id } } = data;

            const payload = await this.getCallMemberLinkPayload(_id);

            client.emit(CallsGateway.CALL_MEMBER_IS_CONNECTING, payload);
        });
    }

    handleMemberConnected(client: Socket, ...args: any[])
    {
        // @ts-ignore
        const { user } = client;

        // @ts-ignore
        client.memberConnectedStream = this
            .callMemberLinkService
            .getModel()
            .watch(
                [
                    {
                        $match: {
                            'fullDocument.initiator': user._id,
                            'fullDocument.addresseePeer': { $ne: null },
                            'fullDocument.status': CallMemberLinkStatus.CONNECTED,
                            'operationType': 'update'
                        }
                    }
                ],
                { fullDocument: 'updateLookup' }
            );

        // @ts-ignore
        client.memberConnectedStream.on('change', async (data) => {

            const { fullDocument: { _id } } = data;

            const payload = await this.getCallMemberLinkPayload(_id);

            client.emit(CallsGateway.CALL_MEMBER_CONNECTED, payload);
        });
    }

    handleMemberRejected(client: Socket, ...args: any[])
    {
        // @ts-ignore
        const { user } = client;

        // @ts-ignore
        client.memberRejectedStream = this
            .callMemberLinkService
            .getModel()
            .watch(
                [
                    {
                        $match: {
                            'fullDocument.addressee': user._id,
                            'fullDocument.status': CallMemberLinkStatus.REJECTED,
                            'operationType': 'insert'
                        }
                    }
                ],
                { fullDocument: 'updateLookup' }
            )
        ;

        // @ts-ignore
        client.memberRejectedStream.on('change', async (data) => {

            const { fullDocument: { _id } } = data;

            const payload = await this.getCallMemberLinkPayload(_id);

            client.emit(CallsGateway.CALL_MEMBER_REJECTED, payload);
        });
    }

    handleMemberHangUp(client: Socket, ...args: any[])
    {
        // @ts-ignore
        const { user } = client;

        // @ts-ignore
        client.memberHungUpStream = this
            .callMemberLinkService
            .getModel()
            .watch(
                [
                    {
                        $match: {
                            $or : [
                                { 'fullDocument.initiator': user._id },
                                { 'fullDocument.addressee': user._id }
                            ],
                            'fullDocument.status': CallMemberLinkStatus.HUNG_UP,
                            'operationType' : {
                                $in: ['insert', 'update']
                            },
                        }
                    }
                ],
                { fullDocument: 'updateLookup' }
            );


        // @ts-ignore
        client.memberHungUpStream.on('change', async (data) => {

            const { fullDocument: { _id } } = data;

            const payload = await this.getCallMemberLinkPayload(_id);

            client.emit(CallsGateway.CALL_MEMBER_HUNG_UP, payload);
        });
    }

    async getCallMemberLinkPayload(linkId: any)
    {
        const link: CallMemberLinkDocument = await this
            .callMemberLinkService
            .getModel()
            .findOne({
                _id: linkId
            });

        await link.populate('initiator');
        await link.populate('addressee');

        const result: any = {
            // @ts-ignore
            ...link.serialize(),
            call: link.call.toString(),
            // @ts-ignore
            initiator: link.initiator.serialize(),
            // @ts-ignore
            addressee: link.addressee.serialize()
        };

        return result;
    }

    async endUpWindowCall(client: Socket)
    {
        const socketId: string = client.id;
        // @ts-ignore
        const { user } = client;

        // get call member for the socket id
        let member: CallMemberDocument = await this.callMemberService.getSocketCallMember(user, socketId);
        if (!member)
        {
            return;
        }

        await member.populate('call');
        const call: CallDocument = member.call;

        if ([CallMemberStatus.CONNECTED, CallMemberStatus.CONNECTING].includes(member.status))
        {
            // hang up
            await this.callService.hangUp(user, call);
        }
        else
        {
            // reject
            await this.callService.reject(user, call);
        }
    }

    async rejectAllIncomingCalls(client: Socket)
    {
        // @ts-ignore
        const { user } = client;

        const member: CallMemberDocument = await this.callMemberService.getBusyMember(user);
        if (!member)
        {
            return;
        }

        await member.populate('call');
        const call: CallDocument = member.call;

        await this.callService.reject(user, call);
    }
}