import {EmailServiceInterface} from './email-service.interface';
import {ConfigService} from '@nestjs/config';
const sgMail = require('@sendgrid/mail');


export class ProdEmailService implements EmailServiceInterface
{
    constructor(
        private readonly config: ConfigService
    ) {
        const key: string = this.config.get('EMAIL_SENDER_API_KEY');
        sgMail.setApiKey(key);
    }

    async send(from: string, to: string, subject: string, body: string) {

        const data = {
            to: to, // Change to your recipient
            from: from, // Change to your verified sender
            subject: subject,
            // text: 'and easy to do anywhere, even with Node.js',
            html: body,
        };

        try {
            // implement the 3rd-email-service interaction
            await sgMail.send(data);
        }
        catch (e)
        {
            //debugger
            console.log(e);
        }
    }
}