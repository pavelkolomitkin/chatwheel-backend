import {BadRequestException, Controller, Get, NotFoundException, Res, UseGuards} from '@nestjs/common';
import {AuthGuard} from '@nestjs/passport';
import {ParameterConverter, ParameterConverterSourceType} from '../../../core/decorators/parameter-converter.decorator';
import {ParameterConverterPipe} from '../../../core/pipes/parameter-converter.pipe';
import {Response} from 'express';
import {ClientUser, ClientUserDocument} from '../../../core/schemas/client-user.schema';
import {ChatRoulettePictureService} from '../../services/search/chat-roulette-picture.service';
import {ChatRouletteUserActivityService} from "../../services/search/chat-roulette-user-activity.service";
import {ChatRouletteUserActivityDocument} from "../../../core/schemas/chat-roulette-user-activity.schema";

@Controller('search/chat-roulette-picture')
export class ChatRoulettePictureController
{
    constructor(
        private readonly activityService: ChatRouletteUserActivityService,
        private readonly service: ChatRoulettePictureService
    ) {
    }

    @Get(':userId')
    async get(
        @ParameterConverter({
            model: ClientUser.name,
            field: 'id',
            paramName: 'userId',
            sourceType: ParameterConverterSourceType.PARAM
        }, ParameterConverterPipe) user: ClientUserDocument,
        @Res() response: Response
    )
    {
        try {

            const activity: ChatRouletteUserActivityDocument = await this.activityService.get(user);
            if (!activity)
            {
                throw new BadRequestException('No user activity found!');
            }

            const filePath = await this.service.getUserActivityLatestPictureFilePath(activity);

            response.setHeader('X-Accel-Redirect', filePath);
            response.setHeader('Content-Type', 'image/jpeg');
            response.end('');
        }
        catch (error) {
            throw new NotFoundException();
        }
    }
}