import {
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

@Controller('chat-roulette')
@UseGuards(AuthGuard('jwt'))
export class ChatRouletteController
{
    constructor(
        private readonly service: ChatRouletteService,
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
        await this.service.turnOn(user, file);
    }

    @Put('turn-off')
    @HttpCode(HttpStatus.OK)
    async turnOff(
        @CurrentUser() user: ClientUserDocument
    )
    {
        await this.service.turnOff(user);
    }

    @Post('search')
    @HttpCode(HttpStatus.OK)
    async search(
        @CurrentUser() user: ClientUserDocument
    )
    {
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
            addressee: addressee.serialize(),
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
            addressee: acceptedOffer.user.serialize(),
            type: ChatRouletteOfferType.SEARCH_PARTNER_ACCEPTED
        };
    }
}