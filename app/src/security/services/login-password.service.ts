import * as sha256 from 'crypto-js/sha256';
import * as bcrypt from 'bcrypt';
import {BaseService} from "./base.service";
import {Injectable} from "@nestjs/common";
import {LoginPasswordCredentialsDto} from "../dto/login-password-credentials.dto";
import {InjectModel} from "@nestjs/mongoose";
import { Model } from 'mongoose';
import {ClientUser, ClientUserDocument} from "../../core/schemas/client-user.schema";
import {LoginPasswordRegisterDto} from "../dto/login-password-register.dto";
import {ConfirmationUserAccountKey} from "../schemas/confirmation-user-account-key.schema";
import {ConfirmationAccountKeyService} from "./confirmation-account-key.service";
import {MailService} from "./mail.service";
import {UserConfirmRegisterDto} from "../dto/user-confirm-register.dto";
import {User} from "../../core/schemas/user.schema";
import {JwtService} from "@nestjs/jwt";

@Injectable()
export class LoginPasswordService extends BaseService
{
    // @ts-ignore
    constructor(
        @InjectModel(ClientUser.name) private readonly userModel: Model<ClientUserDocument>,
        @InjectModel(ConfirmationUserAccountKey.name) private readonly confirmationKeyModel: Model<ConfirmationUserAccountKey>,
        private readonly confirmationKeyService: ConfirmationAccountKeyService,
        private readonly mailService: MailService)
    {
        super();
    }

    async login(credentials: LoginPasswordCredentialsDto)
    {
        //const result = new this.userModel();
        //const { email, password } = credentials;

    }

    async register(data: LoginPasswordRegisterDto): Promise<ClientUserDocument>
    {
        const { email, password, fullName } = data;

        const passwordHashed = await bcrypt.hash(password, LoginPasswordService.PASSWORD_HASH_SALT);

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
}