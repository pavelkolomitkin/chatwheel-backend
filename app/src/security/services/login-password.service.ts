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

@Injectable()
export class LoginPasswordService extends BaseService
{
    // @ts-ignore
    constructor(
        @InjectModel(ClientUser.name) private readonly userModel: Model<ClientUserDocument>,
        @InjectModel(ConfirmationUserAccountKey.name) private readonly confirmationKeyModel: Model<ConfirmationUserAccountKey>,
        private readonly confirmationKeyService: ConfirmationAccountKeyService,
        private readonly mailService: MailService,
        private readonly tokenService: SecurityTokenService)
    {
        super();
    }

    async login(credentials: LoginPasswordCredentialsDto): Promise<string>
    {
        const { email, password } = credentials;

        const user: ClientUserDocument = await this.userModel.findOne({
            email
        });

        if (!user)
        {
            throw new BadRequestException('Bad credentials!');
        }

        const isPasswordEqual: boolean = await bcrypt.compare(password, user.password);
        if (!isPasswordEqual)
        {
            throw new BadRequestException('Bad credentials!');
        }

        if (user.isBlocked)
        {
            const blockingReasonMessage: string = `You've been blocked! ` + user.blockingReason;
            throw new BadRequestException(blockingReasonMessage);
        }

        if (!user.isActivated)
        {
            throw new BadRequestException('Please activate your account first with the link sent on your email!');
        }

        return this.tokenService.getUserToken(user);
    }

    async register(data: LoginPasswordRegisterDto): Promise<ClientUserDocument>
    {
        const { email, password, fullName } = data;

        const passwordHashed = await this.getHashedPassword(password);

        const result = new this.userModel({
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

        user.isActivated = true;
        await user.save();
        await key.remove();

        return user;
    }

    async getHashedPassword(plainPassword: string): Promise<string>
    {
        return await bcrypt.hash(plainPassword, LoginPasswordService.PASSWORD_HASH_SALT);
    }
}