import {IsNotEmpty} from "class-validator";

export class MonthPeriodDto
{
    @IsNotEmpty()
    startMonth: Date;

    @IsNotEmpty()
    endMonth: Date;
}