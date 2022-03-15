import {Injectable, UnauthorizedException} from '@nestjs/common';
import {JwtService} from '@nestjs/jwt';
import {UserDocument} from "../../core/schemas/user.schema";
import {UserAccessorService} from "./user-accessor/user-accessor.service";

@Injectable()
export class JwtAuthService
{
    constructor(
        private readonly jwtService: JwtService,
        private readonly userAccessor: UserAccessorService

    ) {}

    async getUser(token: string)
    {
        const payload = await this.jwtService.verify(token);
        if (!payload)
        {
            return null;
        }

        const { id } = payload;
        let user: UserDocument = null;
        try {
            user = await this.userAccessor.getActualUserById(id);
        }
        catch (error)
        {
            throw new UnauthorizedException();
        }

        return user;
    }
}
