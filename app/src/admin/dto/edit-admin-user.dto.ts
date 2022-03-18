import {Transform} from "class-transformer";
import {IsEmail, IsNotEmpty, MaxLength, Validate} from "class-validator";
import {EditedEmailValidator} from "../validators/edited-email.validator";
import {EntityExistsValidator} from "../../core/validators/entity-exists.validator";
import {AdminUser} from "../../core/schemas/admin-user.schema";

export class EditAdminUserDto
{
    @IsNotEmpty()
    @Validate(EntityExistsValidator, [AdminUser.name, 'id'], { message: 'The user is not found!' })
    id: string;

    @Transform(({value}) => value.trim())
    @IsEmail()
    @Validate(EditedEmailValidator)
    email: string;

    @Transform(({value}) => value.trim())
    @IsNotEmpty()
    @MaxLength(255)
    fullName: string;
}