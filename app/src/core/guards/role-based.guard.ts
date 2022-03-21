import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import {Observable} from "rxjs";


@Injectable()
export class RoleBasedGuard implements CanActivate
{
    constructor(private reflector: Reflector) {}

    canActivate(context: ExecutionContext): boolean | Promise<boolean> | Observable<boolean> {

        const roles = this.reflector.get<string[]>('roles', context.getClass());
        if (!roles) {
            return true;
        }

        const request = context.switchToHttp().getRequest();
        const user = request.user;
        if (!user)
        {
            return false;
        }

        const userRoles = user.roles;
        for (let role of roles)
        {
            if (!userRoles.includes(role))
            {
                return false;
            }
        }

        return true;
    }
}