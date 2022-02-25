import {Injectable} from '@nestjs/common';
import {JwtService} from '@nestjs/jwt';
import {UserService} from "./user.service";
import {CoreException} from "../../core/exceptions/core.exception";

@Injectable()
export class JwtAuthService
{
    constructor(
        private jwtService: JwtService,
        private userService: UserService

    ) {}

    async getUser(token: string)
    {
        const payload = await this.jwtService.verify(token);
        if (!payload)
        {
            return null;
        }

        const { id } = payload;
        const user = await this.userService.getActivatedUserById(id);
        if (!user)
        {
            throw new CoreException('The user is not found!');
        }

        return user;
    }
}
