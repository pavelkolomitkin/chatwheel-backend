import { Console, Command } from 'nestjs-console';
import {InjectModel} from "@nestjs/mongoose";
import {UserDocument} from "../../schemas/user.schema";
import {Model} from "mongoose";
import {AdminUser, AdminUserDocument} from "../../schemas/admin-user.schema";
import {UserService} from "../../../security/services/user.service";
import {CoreException} from "../../exceptions/core.exception";
import {LoginPasswordService} from "../../../security/services/login-password.service";
import * as commander from 'commander';
let prompt = require('prompt');


@Console()
export class AdminUserCli
{
    constructor(
        @InjectModel(AdminUser.name) private readonly adminUserModel: Model<AdminUserDocument>,
        private readonly userService: UserService,
        private readonly loginService: LoginPasswordService,
    ) {
    }

    @Command({
        command: 'create-super-admin <fullName> <email>',
        description: 'Create a new super admin account'
    })
    async create(fullName: string, email: string, command: commander.Command): Promise<void>
    {
        console.log(`Create a new super admin account with ${fullName} and ${email}...`);

        await this.validateFullName(fullName);
        await this.validateEmail(email);

        const { password, repeatPassword } = await this.getPassword();
        await this.validatePassword(password, repeatPassword);

        const passwordHash: string = await this.loginService.getHashedPassword(password);

        const admin: AdminUserDocument = new this.adminUserModel({
            email: email,
            fullName: fullName,
            password: passwordHash,
            isSuperAdmin: true
        });

        // @ts-ignore
        await admin.save();

        console.log(`The admin has been created...`);
    }

    async getPassword(): Promise<{ password: string, repeatPassword: string }>
    {

        const schema = {
            properties: {
                password: {
                    hidden: true,
                    description: 'Password(at least 6 symbols)',
                    required: true
                },
                repeatPassword: {
                    hidden: true,
                    description: 'Repeat the password',
                    required: true
                }
            }
        };

        return new Promise((resolve, reject) => {

            prompt.get(schema, (error, result) => {

                if (error)
                {
                    throw new CoreException(error);
                }

                resolve(result);

            });

        });
    }

    async validatePassword(password: string, passwordRepeat: string)
    {
        if (!password && (password.trim() === ''))
        {
            throw new CoreException(`The password must not be empty!`);
        }

        if (password !== passwordRepeat)
        {
            throw new CoreException(`The passwords do not match!`);
        }

        if (password.length < 6)
        {
            throw new CoreException(`The password is shorter than 6 symbols!`);
        }
    }

    async validateFullName(fullName: string)
    {
        if (!fullName && (fullName.trim() === ''))
        {
            throw new CoreException(`The full name must not be empty!`);
        }
    }

    async validateEmail(email: string)
    {
        if (!email || (email.trim() === ''))
        {
            throw new CoreException(`The email must not be empty!`);
        }

        const user: UserDocument = await this.userService.getUserByEmail(email);
        if (user)
        {
            throw new CoreException(`The user with the email ${email} already exists!`);
        }
    }
}