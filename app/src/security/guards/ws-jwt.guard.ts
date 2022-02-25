import {Injectable} from '@nestjs/common';
import { Socket, Server } from 'socket.io';
import {JwtAuthService} from "../services/jwt-auth.service";


@Injectable()
export class WsJwtGuard
{
    constructor(
        private authService: JwtAuthService
        ) {
    }

    authorize(server: Server)
    {
        server.use(async (socket:Socket, next) => {

            // @ts-ignore
            const token = socket.request._query['token'];
            if (!token)
            {
                next(new Error('Authorization Error'));
                return;
            }

            let user = null;

            try {
                user = await this.authService.getUser(token);
            }
            catch (error) {
                next(new Error('Authorization Error'));
                return;
            }

            // @ts-ignore
            socket.user = user;
            next();

        })
    }
}
