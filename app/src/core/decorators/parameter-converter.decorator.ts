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
    paramName: string,
    field: string,
    sourceType: ParameterConverterSourceType
}, context: ExecutionContext): ParameterConverterData => {

    //debugger
    const request: any = context.switchToHttp().getRequest();
    const { model, field, paramName, sourceType } = data;

    let paramValue: any = null;

    switch (sourceType)
    {
        case ParameterConverterSourceType.BODY:
            paramValue = request.body[paramName];

            break;

        case ParameterConverterSourceType.PARAM:
            paramValue = request.params[paramName]

            break;

        case ParameterConverterSourceType.QUERY:
            paramValue = request.query[paramName];

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
