import {Injectable} from '@nestjs/common';
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
        await this.removeFile(user.avatar.filename);
    }

    async removeFile(relativePath: string)
    {
        const file = this.getFilePath(relativePath);
        if (!await fsx.pathExists(file))
        {
            throw new CoreException('File does not exist!');
        }

        await fsx.remove(file);
    }

    getFilePath(relativePath: string)
    {
        return this.config.get('UPLOAD_DIRECTORY') + '/' + relativePath;
    }
}
