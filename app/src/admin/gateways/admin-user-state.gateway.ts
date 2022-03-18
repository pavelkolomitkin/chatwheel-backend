import {Injectable} from "@nestjs/common";
import {
    OnGatewayConnection,
    OnGatewayDisconnect,
    OnGatewayInit,
    WebSocketGateway,
    WebSocketServer
} from "@nestjs/websockets";
import {Server, Socket} from "socket.io";
import {WsJwtGuard} from "../../security/guards/ws-jwt.guard";
import {AdminUserService} from "../services/admin-user.service";


@Injectable()
@WebSocketGateway({
    namespace: 'admin-user-state'
})
export class AdminUserStateGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{

    static I_HAVE_BEEN_BLOCKED_EVENT = 'i_have_been_blocked';
    static I_HAVE_BEEN_DELETED_EVENT = 'i_have_been_deleted';

    @WebSocketServer()
    server: Server;

    constructor(
        private readonly service: AdminUserService,
        private readonly guard: WsJwtGuard
    ) {
    }


    afterInit(server: any): any {
        this.guard.authorize(server);
    }

    handleConnection(client: Socket, ...args: any[]): any {

        this.handleBlocked(client);
        this.handleDeleted(client);

    }

    handleDisconnect(client: Socket): any {

        this.releaseBlocked(client);
        this.releaseDeleted(client);

        // @ts-ignore
        client.conn.close();
        // @ts-ignore
        client.removeAllListeners();
        // @ts-ignore
        client.disconnect(true);
    }

    handleBlocked(client: Socket)
    {
        // @ts-ignore
        const { user } = client;

        // @ts-ignore
        client.blockedUserStream = this.service.getModel()
            .watch([
                {
                    $match: {
                        'fullDocument._id': user._id,
                        'fullDocument.isBlocked': true
                    }
                }
            ],
                { fullDocument: 'updateLookup' }
            );


        // @ts-ignore
        client.blockedUserStream.on('change', async (data) => {

            const { fullDocument: { blockingReason } } = data;

            client.emit(AdminUserStateGateway.I_HAVE_BEEN_BLOCKED_EVENT, { reason: blockingReason });
        });
    }

    releaseBlocked(client: Socket)
    {
        // @ts-ignore
        client.blockedUserStream.close();

        // @ts-ignore
        client.blockedUserStream = null;
    }

    handleDeleted(client: Socket)
    {
        // @ts-ignore
        const { user } = client;

        // @ts-ignore
        client.deletedUserStream = this.service.getModel().watch([
            {
                $match: {
                    'fullDocument._id': user._id,
                    'fullDocument.deleted': true
                },
            }
        ], { fullDocument: 'updateLookup' });


        // @ts-ignore
        client.deletedUserStream.on('change', async (data) => {
            client.emit(AdminUserStateGateway.I_HAVE_BEEN_DELETED_EVENT);
        });
    }

    releaseDeleted(client: Socket)
    {
        // @ts-ignore
        client.deletedUserStream.close();

        // @ts-ignore
        client.deletedUserStream = null;
    }
}