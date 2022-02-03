import {ConfirmationUserAccountKey} from "../schemas/confirmation-user-account-key.schema";
import {Inject, Injectable} from "@nestjs/common";
import {EmailServiceInterface} from "../../core/services/mail/email-service.interface";
import {ConfigService} from "@nestjs/config";

@Injectable()
export class MailService
{
    static WELCOME_NEW_USER_SUBJECT = 'Welcome to ChatWheel!';

    constructor(
        @Inject('EmailService') private readonly mailer: EmailServiceInterface,
        private readonly config: ConfigService
    ) {
    }

    async sendAccountConfirmationKey(key: ConfirmationUserAccountKey)
    {
        const from: string = this.config.get('EMAIL_NO_REPLY');
        const to: string = key.user.email;
        const subject: string = MailService.WELCOME_NEW_USER_SUBJECT;
        const link: string = this.getConfirmationLink(key);

        const body: string = `Hello, ${key.user.fullName}! 
        Welcome to ChatWheel! Please confirm your account <a target="_blank" href="${link}">here</a>
        `
        await this.mailer.send(from, to, subject, body);
    }

    getConfirmationLink(key: ConfirmationUserAccountKey): string
    {
        return this.getBaseUrl() + '/security/register-confirm/' + key.key;
    }

    getBaseUrl()
    {
        return 'https://' +  this.config.get('EMAIL_LINK_HOST');
    }
}