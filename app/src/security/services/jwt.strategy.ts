import {PassportStrategy} from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import {Injectable, UnauthorizedException} from '@nestjs/common';
import {ConfigService} from '@nestjs/config';
import {UserDocument} from "../../core/schemas/user.schema";
import {UserService} from "./user.service";
import {UserAccessorService} from "./user-accessor/user-accessor.service";

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy)
{
    constructor(
        private readonly config: ConfigService,
        private readonly userService: UserService,
        private readonly userAccessor: UserAccessorService

    ) {
        super({
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            secretOrKey: config.get('APP_SECRET'),
        });
    }

    async validate({ id })
    {
        let user: UserDocument = null
        try {
            user = await this.userAccessor.getActualUserById(id);
        }
        catch (error)
        {
            throw new UnauthorizedException();
        }

        if (!user)
        {
            throw new UnauthorizedException();
        }

        await this.userService.updateLastActivity(user);

        return user;
    }
}