import {Controller, Get, NotFoundException, Res, UseGuards} from '@nestjs/common';
import {AuthGuard} from '@nestjs/passport';
import {ParameterConverter, ParameterConverterSourceType} from '../../../core/decorators/parameter-converter.decorator';
import {ParameterConverterPipe} from '../../../core/pipes/parameter-converter.pipe';
import {Response} from 'express';
import {ClientUser, ClientUserDocument} from '../../../core/schemas/client-user.schema';
import {ChatRoulettePictureService} from '../../services/search/chat-roulette-picture.service';

@Controller('search/chat-roulette-picture')
@UseGuards(AuthGuard('jwt'))
export class ChatRoulettePictureController
{
    constructor(
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
            const filePath = await this.service.getUserActivityLatestPictureFilePath(user);

            response.setHeader('X-Accel-Redirect', filePath);
            response.end('');
        }
        catch (error) {
            throw new NotFoundException();
        }
    }
}