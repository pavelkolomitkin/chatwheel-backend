import {Injectable} from '@nestjs/common';
import {JwtService} from '@nestjs/jwt';
import {User, UserDocument} from '../../core/schemas/user.schema';

@Injectable()
export class SecurityTokenService
{
    constructor(private readonly service: JwtService) { }

    getUserToken(user: UserDocument): string
    {
        return this.service.sign({ id: user.id.toString() });
    }
}