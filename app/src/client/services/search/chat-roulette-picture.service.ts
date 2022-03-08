import {BadRequestException, Injectable} from "@nestjs/common";
import {ChatRouletteUserActivityDocument} from "../../../core/schemas/chat-roulette-user-activity.schema";
import {CoreException} from "../../../core/exceptions/core.exception";
import * as fsx from 'fs-extra';
import {Debugger} from "inspector";
import {UploadManagerService} from "../../../core/services/upload-manager.service";

@Injectable()
export class ChatRoulettePictureService
{

    constructor(
        private uploadService: UploadManagerService
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

    async getUserActivityLatestPictureFilePath(activity: ChatRouletteUserActivityDocument)
    {
        // @ts-ignore
        const file: string = this.uploadService.getFilePath(activity.lastCapturedPicture.filename);
        if (!await fsx.pathExists(file))
        {
            throw new BadRequestException('User has no roulette picture!');
        }

        return file;
    }

}