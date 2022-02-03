import {EmailServiceInterface} from "./email-service.interface";

export class ProdEmailService implements EmailServiceInterface
{
    send(from: string, to: string, subject: string, body: string) {
        // implement the 3rd-email-service interaction
    }
}