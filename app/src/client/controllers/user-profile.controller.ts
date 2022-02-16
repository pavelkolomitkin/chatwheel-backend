import {Controller, Get, HttpCode, HttpStatus, UseGuards} from "@nestjs/common";
import {CurrentUser} from "../../core/decorators/user.decorator";
import {ClientUser, ClientUserDocument} from "../../core/schemas/client-user.schema";
import {ParameterConverter, ParameterConverterSourceType} from "../../core/decorators/parameter-converter.decorator";
import {ParameterConverterPipe} from "../../core/pipes/parameter-converter.pipe";
import {AuthGuard} from "@nestjs/passport";

@Controller('user-profile')
@UseGuards(AuthGuard('jwt'))
export class UserProfileController
{
    @Get(':id')
    @HttpCode(HttpStatus.OK)
    async get(
        @CurrentUser() currentUser: ClientUserDocument,
        @ParameterConverter({
            model: ClientUser.name,
            field: 'id',
            paramName: 'id',
            sourceType: ParameterConverterSourceType.PARAM
        }, ParameterConverterPipe) user: ClientUserDocument
    )
    {
        await user.populate('interests');

        return {
            // @ts-ignore
            user: user.serialize()
        };
    }
}