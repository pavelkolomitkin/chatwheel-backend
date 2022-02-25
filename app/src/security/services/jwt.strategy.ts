import {PassportStrategy} from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import {Injectable, UnauthorizedException} from '@nestjs/common';
import {ConfigService} from '@nestjs/config';
import {ROLE_CLIENT_USER, User, UserDocument} from "../../core/schemas/user.schema";
import {UserService} from "./user.service";

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy)
{
    constructor(
        private readonly config: ConfigService,
        private readonly userService: UserService
    ) {
        super({
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            secretOrKey: config.get('APP_SECRET'),
        });
    }

    async validate({ id })
    {
        const user: UserDocument = await this.userService.getActivatedUserById(id);

        if (!user)
        {
            throw new UnauthorizedException();
        }

        if (user.roles.includes(ROLE_CLIENT_USER))
        {
            if (user.roles.includes(ROLE_CLIENT_USER))
            {
                await user
                    .populate('residenceCountry searchCountry interests geoLocation')

                ;
            }
        }

        await this.userService.updateLastActivity(user);

        return user;
    }
}