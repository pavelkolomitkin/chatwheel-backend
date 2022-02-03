import {
    ArgumentsHost,
    BadRequestException,
    Catch,
    ExceptionFilter,
    HttpStatus,
    Injectable,
    InternalServerErrorException
} from '@nestjs/common';
import {Request, Response} from 'express';
import {ConfigService} from "@nestjs/config";

@Injectable()
@Catch(InternalServerErrorException)
export class GlobalExceptionFilter implements ExceptionFilter
{
    constructor(private readonly config: ConfigService) {}

    catch(exception: any, host: ArgumentsHost): any {

        if (this.config.get('NODE_ENV') === 'production')
        {
            const context = host.switchToHttp();

            const request: Request = context.getRequest<Request>();
            const response: Response = context.getResponse<Response>();

            response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
                message: 'The service is not available. Please, try it later'
            });
        }
    }
}