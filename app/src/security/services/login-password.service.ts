import * as bcrypt from 'bcrypt';
import {BaseService} from './base.service';
import {BadRequestException, Injectable} from '@nestjs/common';
import {LoginPasswordCredentialsDto} from '../dto/login-password-credentials.dto';
import {InjectModel} from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {ClientUser, ClientUserDocument} from '../../core/schemas/client-user.schema';
import {LoginPasswordRegisterDto} from '../dto/login-password-register.dto';
import {ConfirmationUserAccountKey} from '../schemas/confirmation-user-account-key.schema';
import {ConfirmationAccountKeyService} from './confirmation-account-key.service';
import {MailService} from './mail.service';
import {UserConfirmRegisterDto} from '../dto/user-confirm-register.dto';
import {SecurityTokenService} from './security-token.service';
import {RestorePasswordRequestDto} from '../dto/restore-password-request.dto';
import {RestorePasswordKeyService} from './restore-password-key.service';
import {RestoreUserPasswordKey} from '../schemas/restore-user-password-key.schema';
import {RestorePasswordKeyExpirationException} from '../exceptions/restore-password-key-expiration.exception';
import {RestorePasswordDto} from '../dto/restore-password.dto';
import {ROLE_CLIENT_USER, User, UserDocument} from "../../core/schemas/user.schema";

@Injectable()
export class LoginPasswordService extends BaseService
{
    // @ts-ignore
    constructor(
        @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
        @InjectModel(ClientUser.name) private readonly clientUserModel: Model<ClientUserDocument>,
        @InjectModel(ConfirmationUserAccountKey.name) private readonly confirmationKeyModel: Model<ConfirmationUserAccountKey>,
        private readonly confirmationKeyService: ConfirmationAccountKeyService,
        private readonly restorePasswordKeyService: RestorePasswordKeyService,
        private readonly mailService: MailService,
        private readonly tokenService: SecurityTokenService)
    {
        super();
    }

    handleBlockedUser(user: UserDocument)
    {
        if (user.isBlocked)
        {
            const blockingReasonMessage: string = `You've been blocked! ` + user.blockingReason;
            throw new BadRequestException(blockingReasonMessage);
        }
    }

    handleInActiveUser(user: ClientUserDocument)
    {
        if (!user.isActivated)
        {
            throw new BadRequestException('Please activate your account first with the link sent on your email!');
        }
    }

    handleDeletedUser(user: ClientUserDocument)
    {
        // @ts-ignore
        if (user.deleted)
        {
            throw new BadRequestException('The account was deleted!');
        }
    }

    async getNotDeletedUserByEmail(email: string)
    {
        return this.userModel.findOne({
            email,
            deleted: {
                $ne: true
            }
        });
    }

    async getNotDeletedClientUserByEmail(email: string)
    {
        return this.clientUserModel.findOne({
            email,
            deleted: {
                $ne: true
            }
        });
    }

    async login(credentials: LoginPasswordCredentialsDto): Promise<string>
    {
        const { email, password } = credentials;

        const user: UserDocument = await this.getNotDeletedUserByEmail(email);

        if (!user)
        {
            throw new BadRequestException('Bad credentials!');
        }

        const isPasswordEqual: boolean = await bcrypt.compare(password, user.password);
        if (!isPasswordEqual)
        {
            throw new BadRequestException('Bad credentials!');
        }

        this.handleBlockedUser(user);

        if (user.roles.indexOf(ROLE_CLIENT_USER) !== -1)
        {
            this.handleInActiveUser(<ClientUserDocument>user);
        }

        return this.tokenService.getUserToken(user);
    }

    async restorePasswordRequest(data: RestorePasswordRequestDto): Promise<void>
    {
        const { email } = data;

        const user: ClientUserDocument = await this.getNotDeletedClientUserByEmail(email);
        if (!user)
        {
            throw new BadRequestException('The account is not found!');
        }

        this.handleBlockedUser(user);
        this.handleInActiveUser(user);

        try {
            // generate a restore-password key
            const key: RestoreUserPasswordKey = await this.restorePasswordKeyService.create(user);

            // send the key via email
            await this.mailService.sendRestorePasswordKey(key);
        }
        catch (error)
        {
            if (error instanceof RestorePasswordKeyExpirationException)
            {
                // get the time left
                throw new BadRequestException({secondsLeft: error.secondsLeft})
            }
        }
    }

    async register(data: LoginPasswordRegisterDto): Promise<ClientUserDocument>
    {
        const { email, password, fullName } = data;

        const passwordHashed = await this.getHashedPassword(password);

        const result = new this.clientUserModel({
            email: email,
            password: passwordHashed,
            fullName: fullName
        });

        await result.save();

        // create a confirmation key
        const confirmationKey = await this.confirmationKeyService.create(result);

        // send an email with a confirmation link
        await this.mailService.sendAccountConfirmationKey(confirmationKey);

        return result;
    }

    async confirmRegisteredAccount(data: UserConfirmRegisterDto): Promise<ClientUserDocument>
    {
        const key: ConfirmationUserAccountKey = await this
            .confirmationKeyModel
            .findOne({ key: data.key })
            .populate('user');

        const user: ClientUserDocument = key.user;

        this.handleDeletedUser(user);


        user.isActivated = true;
        await user.save();
        await key.remove();

        return user;
    }

    async restorePassword(data: RestorePasswordDto): Promise<ClientUserDocument>
    {
        const { key, password } = data;

        const keyEntity: RestoreUserPasswordKey = await this.restorePasswordKeyService.getValidKey(key);
        const user: ClientUserDocument = keyEntity.user;

        this.handleDeletedUser(user);

        user.password = await this.getHashedPassword(password);
        await user.save();

        await keyEntity.remove();

        return user;
    }

    async getHashedPassword(plainPassword: string): Promise<string>
    {
        return await bcrypt.hash(plainPassword, LoginPasswordService.PASSWORD_HASH_SALT);
    }
}