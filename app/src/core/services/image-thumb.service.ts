import * as fs from 'fs';
import * as fsx from 'fs-extra';
import {promisify} from 'util';
const fileExistsAsync = promisify(fs.stat);
import * as sharp from 'sharp';
import {Injectable} from '@nestjs/common';
import {CoreException} from '../exceptions/core.exception';
import {ConfigService} from "@nestjs/config";
import {UserDocument} from "../schemas/user.schema";

@Injectable()
export class ImageThumbService
{
    static ORIGINAL_SIZE = 'original';

    constructor(private readonly config: ConfigService) {}

    async getUserAvatar(user: UserDocument, size: string): Promise<string>
    {
        if (!user.avatar)
        {
            throw new CoreException('User has not avatar!');
        }

        // @ts-ignore
        const originalFile = this.config.get('UPLOAD_DIRECTORY') + '/' + user.avatar.filename;

        try {
            await fileExistsAsync(originalFile);
        }
        catch (error) {
            throw new CoreException('System Error');
        }

        if (size === ImageThumbService.ORIGINAL_SIZE)
        {
            return originalFile;
        }

        const thumbConfig = this.config.get('thumbs');
        const avatarSizes = thumbConfig['avatar'][size];
        if (!avatarSizes)
        {
            throw new CoreException('Invalid size!');
        }

        // @ts-ignore
        const directoryPath = this.config.get('IMAGE_THUMB_DIRECTORY') + '/avatar/' + user.id.toString() + '/' + user.avatar.filename;
        try {
            await fileExistsAsync(directoryPath);
        }
        catch (directoryException) {

            try {
                await fs.promises.mkdir(directoryPath, { recursive: true });
            }
            catch (directoryCreateError) {
                throw new CoreException('Can not get file!');
            }

        }

        const filePath = directoryPath + '/' + size;
        try {
            await fileExistsAsync(filePath);
        }
        catch (error) {

            // there should be a file exist called /app/thumbs/avatar/:userId/:originalFileName/:size
            // if the target thumb file doesn't exist
            // make thumb for certain size
            try {
                await sharp(originalFile)
                    .resize(avatarSizes.width, avatarSizes.height)
                    .toFile(filePath);
            }
            catch (thumbError) {
                throw new CoreException('Can not get file!');
            }

        }

        return filePath;
    }

    async removeUserAvatar(user: UserDocument)
    {
        const directoryPath = this.config.get('IMAGE_THUMB_DIRECTORY') + '/avatar/' + user.id.toString();
        try {
            await fileExistsAsync(directoryPath);
            await fsx.remove(directoryPath);
        }
        catch (error) {
            throw new CoreException('Can not remove this avatar!');
        }
    }
}
