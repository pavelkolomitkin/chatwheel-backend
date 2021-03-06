import {Controller, Get, HttpCode, HttpStatus, Put, UseGuards} from "@nestjs/common";
import {CurrentUser} from "../../core/decorators/user.decorator";
import {ClientUser, ClientUserDocument} from "../../core/schemas/client-user.schema";
import {ParameterConverter, ParameterConverterSourceType} from "../../core/decorators/parameter-converter.decorator";
import {ParameterConverterPipe} from "../../core/pipes/parameter-converter.pipe";
import {AuthGuard} from "@nestjs/passport";
import {UserProfileService} from "../services/user-profile.service";
import {ProfileService} from "../services/profile.service";
import {ValidateUserPipe} from "../../core/pipes/validate-user.pipe";
import {Roles} from "../../core/decorators/role.decorator";
import {ROLE_CLIENT_USER} from "../../core/schemas/user.schema";
import {RoleBasedGuard} from "../../core/guards/role-based.guard";

@Controller('user-profile')
@Roles(ROLE_CLIENT_USER)
@UseGuards(AuthGuard('jwt'), RoleBasedGuard)
export class UserProfileController
{
    constructor(
        private readonly service: UserProfileService,
        private readonly profileService: ProfileService
    ) {
    }

    @Get(':id')
    @HttpCode(HttpStatus.OK)
    async get(
        @CurrentUser() currentUser: ClientUserDocument,
        @ParameterConverter({
            model: ClientUser.name,
            field: 'id',
            paramName: 'id',
            sourceType: ParameterConverterSourceType.PARAM
        }, ParameterConverterPipe, ValidateUserPipe) user: ClientUserDocument
    )
    {
        await user.populate(ClientUser.COMMON_POPULATED_FIELDS.join(' '));

        return {
            // @ts-ignore
            user: user.serialize(['details']),
            amIBanned: await this.profileService.isAddresseeBanned(user, currentUser),
            isBanned: await this.profileService.isAddresseeBanned(currentUser, user),
        };
    }

    @Put('ban-user/:id')
    @HttpCode(HttpStatus.OK)
    async banUser(
        @CurrentUser() currentUser: ClientUserDocument,
        @ParameterConverter({
            model: ClientUser.name,
            field: 'id',
            paramName: 'id',
            sourceType: ParameterConverterSourceType.PARAM
        }, ParameterConverterPipe, ValidateUserPipe) addressee: ClientUserDocument
    )
    {
        await this.profileService.banAddressee(currentUser, addressee);

        return {
            // @ts-ignore
            user: addressee.serialize(),
            amIBanned: await this.profileService.isAddresseeBanned(addressee, currentUser),
            isBanned: await this.profileService.isAddresseeBanned(currentUser, addressee),
        };
    }

    @Put('unban-user/:id')
    @HttpCode(HttpStatus.OK)
    async unbanUser(
        @CurrentUser() currentUser: ClientUserDocument,
        @ParameterConverter({
            model: ClientUser.name,
            field: 'id',
            paramName: 'id',
            sourceType: ParameterConverterSourceType.PARAM
        }, ParameterConverterPipe, ValidateUserPipe) addressee: ClientUserDocument
    )
    {
        await this.profileService.unbanAddressee(currentUser, addressee);

        return {
            // @ts-ignore
            user: addressee.serialize(),
            amIBanned: await this.profileService.isAddresseeBanned(addressee, currentUser),
            isBanned: await this.profileService.isAddresseeBanned(currentUser, addressee),
        };
    }
}