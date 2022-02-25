import {Body, Controller, Delete, Get, HttpCode, HttpStatus, Put, UseGuards} from "@nestjs/common";
import {UserFullnameDto} from "../dto/user-fullname.dto";
import {CurrentUser} from "../../core/decorators/user.decorator";
import {ClientUserDocument} from "../../core/schemas/client-user.schema";
import {ProfileService} from "../services/profile.service";
import {UserAboutDto} from "../dto/user-about.dto";
import {UserInterestDto} from "../dto/user-interest.dto";
import {ParameterConverterPipe} from "../../core/pipes/parameter-converter.pipe";
import {UserInterest, UserInterestDocument} from "../../core/schemas/user-interest.schema";
import {Country, CountryDocument} from "../../core/schemas/country.schema";
import {GeoLocationDto} from "../dto/geo-location.dto";
import {AuthGuard} from "@nestjs/passport";
import {ParameterConverter, ParameterConverterSourceType} from "../../core/decorators/parameter-converter.decorator";
import {ConversationMessageService} from "../services/conversation-message.service";

@Controller('profile')
@UseGuards(AuthGuard('jwt'))
export class ProfileController
{
    constructor(
        private readonly service: ProfileService,
        private readonly conversationMessageService: ConversationMessageService
    ) {
    }

    @Put('fullname')
    @HttpCode(HttpStatus.OK)
    async updateFullName(@Body() data: UserFullnameDto, @CurrentUser() user: ClientUserDocument)
    {
        const updatedUser: ClientUserDocument = await this.service.updateFullName(data, user);

        return {
            // @ts-ignore
            user: updatedUser.serialize(['mine'])
        }
    }

    @Put('about')
    @HttpCode(HttpStatus.OK)
    async updateAbout(@Body() data: UserAboutDto, @CurrentUser() user: ClientUserDocument)
    {
        const updatedUser: ClientUserDocument = await this.service.updateAbout(data, user);

        return {
            // @ts-ignore
            user: updatedUser.serialize(['mine'])
        }
    }

    @Put('add-interest')
    @HttpCode(HttpStatus.OK)
    async addInterest(@Body() data: UserInterestDto, @CurrentUser() user: ClientUserDocument)
    {
        const interest: UserInterestDocument = await this.service.addInterest(data, user);

        return {
            // @ts-ignore
            interest: interest.serialize()
        };
    }

    @Put('remove-interest')
    @HttpCode(HttpStatus.OK)
    async removeInterest(
        @ParameterConverter({
            model: UserInterest.name,
            field: 'name',
            paramName: 'name',
            sourceType: ParameterConverterSourceType.BODY
        }, ParameterConverterPipe) interest: UserInterestDocument,
        @CurrentUser() user: ClientUserDocument
    )
    {
        await this.service.removeInterest(interest, user);

        return {
            // @ts-ignore
            interest: interest.serialize()
        };
    }

    @Put('update-residence-country')
    @HttpCode(HttpStatus.OK)
    async updateResidenceCountry(
        // @Body('id', ParameterConverterPipe) country: CountryDocument,
        @ParameterConverter({
            model: Country.name,
            field: 'id',
            paramName: 'id',
            sourceType: ParameterConverterSourceType.BODY
        }, ParameterConverterPipe) country: CountryDocument,
        @CurrentUser() user: ClientUserDocument
    )
    {
        //debugger
        await this.service.updateResidenceCountry(country, user);

        return {
            // @ts-ignore
            user: user.serialize(['mine'])
        }
    }

    @Put('update-search-country')
    @HttpCode(HttpStatus.OK)
    async updateSearchCountry(
        @ParameterConverter({
            model: Country.name,
            field: 'id',
            paramName: 'id',
            sourceType: ParameterConverterSourceType.BODY
        }, ParameterConverterPipe) country: CountryDocument,
        @CurrentUser() user: ClientUserDocument
    )
    {
        await this.service.updateSearchCountry(country, user);

        return {
            // @ts-ignore
            user: user.serialize(['mine'])
        }
    }

    @Put('update-location')
    @HttpCode(HttpStatus.OK)
    async updateGeoLocation(@Body() location: GeoLocationDto, @CurrentUser() user: ClientUserDocument)
    {
        const updatedUser: ClientUserDocument = await this.service.updateLocation(user, location);

        return {
            // @ts-ignore
            user: updatedUser.serialize(['mine'])
        }
    }

    @Put('remove-location')
    @HttpCode(HttpStatus.OK)
    async removeLocation(@CurrentUser() user: ClientUserDocument)
    {
        await this.service.updateLocation(user);

        return {
            // @ts-ignore
            user: user.serialize(['mine'])
        }
    }

    @Delete('remove-account')
    @HttpCode(HttpStatus.OK)
    async removeAccount(@CurrentUser() user: ClientUserDocument)
    {
        const deletedUser: ClientUserDocument = await this.service.removeAccount(user);

        return {
            // @ts-ignore
            user: deletedUser.serialize(['mine'])
        };
    }

    @Get('new-message-number')
    @HttpCode(HttpStatus.OK)
    async getNewMessageNumber(
        @CurrentUser() user: ClientUserDocument
    )
    {
        const newMessagesNumber = await this.conversationMessageService.getNewMessageNumber(user);

        return {
            newMessagesNumber
        };
    }

}