import {ArgumentsHost, BadRequestException, Catch, ExceptionFilter} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch(BadRequestException)
export class BadRequestFilter implements ExceptionFilter
{
    catch(exception: BadRequestException, host: ArgumentsHost): any {


        const context = host.switchToHttp();

        const request: Request = context.getRequest<Request>();
        const response: Response = context.getResponse<Response>();

        const status = exception.getStatus();

        let errors = {};
        // @ts-ignore
        const messages = exception.getResponse().message;
        // @ts-ignore
        if (Array.isArray(messages))
        {
            // @ts-ignore
            for (let i = 0; i < messages.length; i++)
            {
                // @ts-ignore
                const message = messages[i];
                if (!errors[message.property])
                {
                    errors[message.property] = [];
                }

                for (const constraintName of Object.keys(message.constraints))
                {
                    errors[message.property].push(message.constraints[constraintName]);
                }
            }
        }
        else
        {
            errors = [exception.message];
        }


        response.status(status).json({
            errors
        });

    }
}
