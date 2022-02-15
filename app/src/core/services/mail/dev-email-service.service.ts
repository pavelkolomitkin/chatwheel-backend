import {EmailServiceInterface} from "./email-service.interface";

export class DevEmailService implements EmailServiceInterface
{
    send(from: string, to: string, subject: string, body: string) {

        console.log('Sending an Email...');
        console.log('From: ' + from);
        console.log('To: ' + to);
        console.log('Subject: ' + subject);
        console.log('Body: ' + body);

    }
}