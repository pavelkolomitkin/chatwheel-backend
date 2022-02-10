import {
    Controller,
    Get,
    NotFoundException,
    Param,
    Post,
    Put,
    Res,
    UploadedFile,
    UseGuards,
    UseInterceptors
} from "@nestjs/common";
import {ImageThumbService} from "../services/image-thumb.service";
import {FileInterceptor} from "@nestjs/platform-express";
import {CurrentUser} from "../decorators/user.decorator";
import {User, UserDocument} from "../schemas/user.schema";
import {UploadManagerService} from "../services/upload-manager.service";
import {ParameterConverterPipe} from "../pipes/parameter-converter.pipe";
import {Response} from 'express';
import {AuthGuard} from "@nestjs/passport";
import {ParameterConverter, ParameterConverterSourceType} from "../decorators/parameter-converter.decorator";

@Controller('user/avatar')
export class AvatarController
{
    constructor(
        private uploadService: UploadManagerService,
        private thumbService: ImageThumbService
    ) {
    }

    @Post('upload')
    @UseGuards(AuthGuard('jwt'))
    @UseInterceptors(FileInterceptor('image'))
    async upload(@UploadedFile() file, @CurrentUser() user: UserDocument)
    {
        if (user.avatar)
        {
            try {
                await this.uploadService.removeAvatar(user);
                await this.thumbService.removeUserAvatar(user);
            }
            catch (e) { }
        }

        // @ts-ignore
        user.setAvatar(file);
        await user.save();

        // @ts-ignore
        return user.serialize(['mine']);
    }

    @Put('remove')
    @UseGuards(AuthGuard('jwt'))
    async remove(@CurrentUser() user: UserDocument)
    {
        try {
            await this.uploadService.removeAvatar(user);
        }
        catch (e) {}

        // @ts-ignore
        user.setAvatar(null);
        await user.save();
        try {
            await this.thumbService.removeUserAvatar(user);
        }
        catch (e) {}

        // @ts-ignore
        return user.serialize(['mine']);
    }

    @Get(':userId/:pictureId/:size')
    async get(
        @ParameterConverter({
            model: User.name,
            field: 'userId',
            sourceType: ParameterConverterSourceType.PARAM
        }, ParameterConverterPipe) user: UserDocument,
        @Param('size') size: string,
        @Res() response: Response
    )
    {
        try {
            const filePath = await this.thumbService.getUserAvatar(user, size);

            response.setHeader('X-Accel-Redirect', filePath);
            response.end('');
        }
        catch (error) {
            throw new NotFoundException();
        }
    }
}