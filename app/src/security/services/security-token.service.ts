import {Injectable} from '@nestjs/common';
import {JwtService} from '@nestjs/jwt';
import {User} from '../../core/schemas/user.schema';

@Injectable()
export class SecurityTokenService
{
    constructor(private readonly service: JwtService) { }

    getUserToken(user: User): string
    {
        return this.service.sign({ id: user.id.toString() });
    }
}