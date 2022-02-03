
export interface EmailServiceInterface
{
    send(from: string, to: string, subject: string, body: string);
}