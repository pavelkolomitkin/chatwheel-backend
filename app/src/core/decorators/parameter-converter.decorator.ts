import {createParamDecorator, ExecutionContext, Inject, InternalServerErrorException} from '@nestjs/common';

export enum ParameterConverterSourceType {
    BODY,
    QUERY,
    PARAM
}

export interface ParameterConverterData
{
    value: any,
    model: string,
    field: string
}

export const ParameterConverter = createParamDecorator((data: {
    model: string,
    field: string,
    sourceType: ParameterConverterSourceType
}, context: ExecutionContext): ParameterConverterData => {

    //debugger
    const request: any = context.switchToHttp().getRequest();
    const { model, field, sourceType } = data;

    let paramValue: any = null;

    switch (sourceType)
    {
        case ParameterConverterSourceType.BODY:
            paramValue = request.body[field];

            break;

        case ParameterConverterSourceType.PARAM:
            paramValue = request.params[field]

            break;

        case ParameterConverterSourceType.QUERY:
            paramValue = request.query[field];

            break;

        default:
            throw new InternalServerErrorException('Incorrect parameter converter source type!');
    }

    if ((paramValue === null) && (typeof paramValue === 'undefined'))
    {
        throw new InternalServerErrorException('Incorrect parameter converter parameter value!');
    }

    return {
        value: paramValue,
        model,
        field
    };
});
