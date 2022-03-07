import {BadRequestException, Injectable} from "@nestjs/common";
import {UploadManagerService} from "../../../core/services/upload-manager.service";
import {ChatRouletteUserActivityDocument} from "../../../core/schemas/chat-roulette-user-activity.schema";
import {CoreException} from "../../../core/exceptions/core.exception";
import {ClientUserDocument} from "../../../core/schemas/client-user.schema";
import {ChatRouletteUserActivityService} from "./chat-roulette-user-activity.service";
import * as fsx from 'fs-extra';

@Injectable()
export class ChatRoulettePictureService
{
    constructor(
        private readonly uploadService: UploadManagerService,
        private readonly userActivityService: ChatRouletteUserActivityService
    ) {
    }

    async removePicture(activity: ChatRouletteUserActivityDocument)
    {
        if (!activity.lastCapturedPicture)
        {
            throw new CoreException('User has no chat picture!');
        }

        // @ts-ignore
        await this.uploadService.removeFile(activity.lastCapturedPicture.filename);
    }

    async getUserActivityLatestPictureFilePath(user: ClientUserDocument)
    {
        const activity: ChatRouletteUserActivityDocument = await this.userActivityService.get(user);
        if (!activity)
        {
            throw new BadRequestException('The user is not active on the roulette!');
        }

        // @ts-ignore
        const file: string = this.uploadService.getFilePath(activity.lastCapturedPicture.filename);
        if (!await fsx.pathExists(file))
        {
            throw new BadRequestException('User has no roulette picture!');
        }

        return file;
    }

}