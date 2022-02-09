import {Injectable} from '@nestjs/common';
//import {ConfigService} from '../../config/config.service';
//import {User} from '../models/user.model';
import {CoreException} from '../exceptions/core.exception';
import * as fsx from 'fs-extra';
import {ConfigService} from "@nestjs/config";
import {UserDocument} from "../schemas/user.schema";

@Injectable()
export class UploadManagerService
{
    constructor(private config: ConfigService) {}

    async removeAvatar(user: UserDocument)
    {
        if (!user.avatar)
        {
            throw new CoreException('User has no avatar!');
        }

        // @ts-ignore
        const file = this.config.get('UPLOAD_DIRECTORY') + '/' + user.avatar.filename;
        if (!await fsx.pathExists(file))
        {
            throw new CoreException('User has no avatar!');
        }

        await fsx.remove(file);
    }
}
