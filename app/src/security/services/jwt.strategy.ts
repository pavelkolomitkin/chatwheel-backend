import {PassportStrategy} from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import {Injectable, UnauthorizedException} from '@nestjs/common';
import {ConfigService} from '@nestjs/config';
import {ClientUser, ClientUserDocument} from '../../core/schemas/client-user.schema';
import {LoginPasswordService} from './login-password.service';
import {InjectModel} from '@nestjs/mongoose';
import {Model} from 'mongoose';
import {ROLE_CLIENT_USER, User, UserDocument} from "../../core/schemas/user.schema";

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy)
{
    constructor(
        private readonly config: ConfigService,
        private readonly userService: LoginPasswordService,
        @InjectModel(User.name) private readonly userModel: Model<User>
    ) {
        super({
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            secretOrKey: config.get('APP_SECRET'),
        });
    }

    async validate({ id })
    {
        const user: UserDocument = await this
            .userModel
            .findOne({
                id,
                isActivated: true,
                isBlocked: false
            });
        if (!user)
        {
            throw new UnauthorizedException();
        }

        if (user.roles.includes(ROLE_CLIENT_USER))
        {
            if (user.roles.includes(ROLE_CLIENT_USER))
            {
                await user
                    .populate('residenceCountry searchCountry interests')

                ;
            }
        }

        await this.userService.updateLastActivity(user);

        return user;
    }
}