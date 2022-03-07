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
import {ChatRouletteOfferService} from "../services/search/chat-roulette-offer.service";
import {ChatRouletteUserActivityService} from "../services/search/chat-roulette-user-activity.service";
import {ChatRouletteUserActivityDocument} from "../../core/schemas/chat-roulette-user-activity.schema";
import {ChatRouletteOfferType} from "../../core/schemas/chat-roulette-offer.schema";

@Injectable()
@WebSocketGateway({
    namespace: 'chat-roulette-search'
})
export class ChatRouletteGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{

    static CHAT_ROULETTE_CLIENT_CONNECTED = 'chat_roulette_client_connected'
    static CHAT_ROULETTE_USER_ACCEPTED_OFFER = 'chat_roulette_user_accepted_offer';

    @WebSocketServer()
    server: Server;

    constructor(
        private readonly offerService: ChatRouletteOfferService,
        private readonly activityService: ChatRouletteUserActivityService,
        private readonly guard: WsJwtGuard
    ) {
    }

    afterInit(server: any): any
    {
        this.guard.authorize(server);
    }

    handleConnection(client: Socket, ...args: any[]): any
    {
        this.handleClientConnected(client, args);

        this.handleAcceptedOffer(client, args);
    }

    handleClientConnected(client: Socket, ...args: any[])
    {
        client.emit(ChatRouletteGateway.CHAT_ROULETTE_CLIENT_CONNECTED, {
            id: client.id
        });
    }

    handleAcceptedOffer(client: Socket, ...args: any[])
    {
        // @ts-ignore
        const { user } = client;

        // @ts-ignore
        client.acceptedOffersStream = this.offerService.getModel()
            .watch([
                {
                    $match: {
                        'fullDocument.user': user._id,
                        'fullDocument.accepted': true,
                        'operationType': 'update'
                    }
                }
            ],
                { fullDocument: 'updateLookup' });

        // @ts-ignore
        client.acceptedOffersStream.on('change', async (data) => {

            const { fullDocument } = data;

            const addresseeActivity: ChatRouletteUserActivityDocument = await this
                .activityService
                .getModel()
                .findOne({
                    _id: fullDocument.addressee
                })
                .populate('user');

            client.emit(ChatRouletteGateway.CHAT_ROULETTE_USER_ACCEPTED_OFFER, {
                id: fullDocument._id.toString(),
                // @ts-ignore
                addressee: addresseeActivity.user.serialize(),
                type: ChatRouletteOfferType.SEARCH_PARTNER_ACCEPTED
            });
        });
    }

    handleDisconnect(client: Socket): any {

        // @ts-ignore
        client.acceptedOffersStream.close();

        // @ts-ignore
        client.acceptedOffersStream = null;

        // @ts-ignore
        client.conn.close();
        // @ts-ignore
        client.removeAllListeners();
        // @ts-ignore
        client.disconnect(true);
    }
}