import {
    BadRequestException,
    Controller,
    HttpCode,
    HttpStatus, NotFoundException,
    Post,
    Put,
    UploadedFile,
    UseGuards,
    UseInterceptors
} from '@nestjs/common';
import {CurrentUser} from '../../../core/decorators/user.decorator';
import {ClientUserDocument} from '../../../core/schemas/client-user.schema';
import {AuthGuard} from '@nestjs/passport';
import {FileInterceptor} from '@nestjs/platform-express';
import {ChatRouletteService} from '../../services/search/chat-roulette.service';
import {ParameterConverter, ParameterConverterSourceType} from "../../../core/decorators/parameter-converter.decorator";
import {ParameterConverterPipe} from "../../../core/pipes/parameter-converter.pipe";
import {
    ChatRouletteOffer,
    ChatRouletteOfferDocument,
    ChatRouletteOfferType
} from "../../../core/schemas/chat-roulette-offer.schema";
import {Roles} from "../../../core/decorators/role.decorator";
import {ROLE_CLIENT_USER} from "../../../core/schemas/user.schema";
import {RoleBasedGuard} from "../../../core/guards/role-based.guard";
import {ChatRouletteUserActivityService} from "../../services/search/chat-roulette-user-activity.service";

@Controller('chat-roulette')
@Roles(ROLE_CLIENT_USER)
@UseGuards(AuthGuard('jwt'), RoleBasedGuard)
export class ChatRouletteController
{
    constructor(
        private readonly service: ChatRouletteService,
        private readonly activityService: ChatRouletteUserActivityService
    ) {
    }

    @Post('turn-on')
    @HttpCode(HttpStatus.OK)
    @UseInterceptors(FileInterceptor('image'))
    async turnOn(
        @CurrentUser() user: ClientUserDocument,
        @UploadedFile() file
    )
    {
        try {
            await this.service.turnOn(user, file);
        }
        catch (error)
        {
            throw new BadRequestException();
        }
    }

    @Put('turn-off')
    @HttpCode(HttpStatus.OK)
    async turnOff(
        @CurrentUser() user: ClientUserDocument
    )
    {
        try {
            await this.service.turnOff(user);
        }
        catch (error)
        {
            throw new BadRequestException();
        }
    }

    @Post('search')
    @HttpCode(HttpStatus.OK)
    async search(
        @CurrentUser() user: ClientUserDocument
    )
    {
        await this.activityService.setUserBusyStatus(user, false);

        let resultType: string = ChatRouletteOfferType.SEARCH_PARTNER_FOUND;

        let result = await this.service.findAddressedOffer(user);
        if (!result)
        {
            result = await this.service.findPartner(user);
            resultType = ChatRouletteOfferType.SEARCH_PARTNER_OFFERED;
        }

        if (!result)
        {
            throw new NotFoundException('No partner found!');
        }

        const addressee: ClientUserDocument =
            (resultType === ChatRouletteOfferType.SEARCH_PARTNER_FOUND)
                ? result.user
                : result.addressee;

        return {
            id: result.id,
            // @ts-ignore
            addressee: addressee.serialize(['details']),
            type: resultType
        };
    }

    @Put('accept-offer/:offerId')
    async acceptOffer(
        @CurrentUser() user: ClientUserDocument,
        @ParameterConverter({
            model: ChatRouletteOffer.name,
            field: 'id',
            paramName: 'offerId',
            sourceType: ParameterConverterSourceType.PARAM
        }, ParameterConverterPipe) offer: ChatRouletteOfferDocument
    )
    {
        const acceptedOffer: ChatRouletteOfferDocument = await this.service.acceptOffer(offer, user);

        await acceptedOffer.populate('user');

        return {
            id: offer.id,
            // @ts-ignore
            addressee: acceptedOffer.user.serialize(['details']),
            type: ChatRouletteOfferType.SEARCH_PARTNER_ACCEPTED
        };
    }
}