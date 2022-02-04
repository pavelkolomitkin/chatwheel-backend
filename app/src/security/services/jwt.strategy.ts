import {PassportStrategy} from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import {Injectable, UnauthorizedException} from '@nestjs/common';
import {ConfigService} from '@nestjs/config';
import {ClientUser, ClientUserDocument} from '../../core/schemas/client-user.schema';
import {LoginPasswordService} from './login-password.service';
import {InjectModel} from '@nestjs/mongoose';
import {Model} from 'mongoose';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy)
{
    constructor(
        private readonly config: ConfigService,
        private readonly userService: LoginPasswordService,
        @InjectModel(ClientUser.name) private readonly userModel: Model<ClientUserDocument>
    ) {
        super({
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            secretOrKey: config.get('APP_SECRET'),
        });
    }

    async validate({ id })
    {
        const user: ClientUserDocument = await this.userModel.findOne({ id, isActivated: true });
        if (!user)
        {
            throw new UnauthorizedException();
        }

        await this.userService.updateLastActivity(user);

        return user;
    }
}