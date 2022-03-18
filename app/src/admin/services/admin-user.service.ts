import {BadRequestException, Injectable} from "@nestjs/common";
import {InjectModel} from "@nestjs/mongoose";
import {Model} from "mongoose";
import {AdminUser, AdminUserDocument} from "../../core/schemas/admin-user.schema";
import {getPageLimitOffset} from "../../core/utils";
import {CreateAdminUserDto} from "../dto/create-admin-user.dto";
import {LoginPasswordService} from "../../security/services/login-password.service";
import {ResetAdminPasswordDto} from "../dto/reset-admin-password.dto";
import {EditAdminUserDto} from "../dto/edit-admin-user.dto";
import {BlockUserDto} from "../dto/block-user.dto";

@Injectable()
export class AdminUserService
{
    constructor(
        @InjectModel(AdminUser.name) private readonly model: Model<AdminUserDocument>,
        private readonly loginPasswordService: LoginPasswordService
    ) {
    }

    getModel()
    {
        return this.model;
    }

    getNumber()
    {
        return this.model.find({}).count();
    }

    async getList(page: number = 1)
    {
        const { limit, offset } = getPageLimitOffset(page);

        const result: AdminUserDocument[] = await this.model
            .find({})
            .sort({createdAt: -1})
            .skip(offset)
            .limit(limit)
        ;


        return result;
    }

    validateSuperAdmin(admin: AdminUserDocument)
    {
        if (!admin.isSuperAdmin)
        {
            throw new BadRequestException('You have to be a super admin for the operation!');
        }
    }

    validateEqual(admin1: AdminUserDocument, admin2: AdminUserDocument, defaultMessage: string = '')
    {
        if (admin1.id !== admin2.id)
        {
            throw new BadRequestException(defaultMessage);
        }
    }

    validateNotEqual(admin1: AdminUserDocument, admin2: AdminUserDocument, defaultMessage: string = '')
    {
        if (admin1.id === admin2.id)
        {
            throw new BadRequestException(defaultMessage);
        }
    }

    async create(creator: AdminUserDocument, data: CreateAdminUserDto)
    {
        this.validateSuperAdmin(creator);

        const { email, fullName, password } = data;

        const passwordHash: string = await this.loginPasswordService.getHashedPassword(password);

        const result: AdminUserDocument = new this.model({
            email,
            fullName,
            password: passwordHash,
            isSuperAdmin: false
        });

        await result.save();

        return result;
    }

    async edit(superAdmin: AdminUserDocument, editingAdmin: AdminUserDocument, data: EditAdminUserDto)
    {
        this.validateSuperAdmin(superAdmin);

        const { fullName, email } = data;

        editingAdmin.fullName = fullName;
        editingAdmin.email = email;

        await editingAdmin.save();

        return editingAdmin;
    }

    async resetPassword(editor: AdminUserDocument, editingAdmin: AdminUserDocument, data: ResetAdminPasswordDto)
    {
        if (editor.id !== editingAdmin.id)
        {
            this.validateSuperAdmin(editor);
        }

        const { password } = data;

        editingAdmin.password = await this.loginPasswordService.getHashedPassword(password);
        await editingAdmin.save();

        return editingAdmin;
    }

    async block(superAdmin: AdminUserDocument, blockingAdmin: AdminUserDocument, data: BlockUserDto)
    {
        this.validateSuperAdmin(superAdmin);
        this.validateNotEqual(superAdmin, blockingAdmin, `You cannot block yourself!`);

        if (blockingAdmin.isBlocked)
        {
            throw new BadRequestException(`The admin is already blocked!`);
        }

        const { reason } = data;

        blockingAdmin.isBlocked = true;
        blockingAdmin.blockingReason = reason;

        await blockingAdmin.save();

        return blockingAdmin;
    }

    async unBlock(superAdmin: AdminUserDocument, unBlockingAdmin: AdminUserDocument)
    {
        this.validateSuperAdmin(superAdmin);
        this.validateNotEqual(superAdmin, unBlockingAdmin, `You cannot unblock yourself!`);

        if (!unBlockingAdmin.isBlocked)
        {
            throw new BadRequestException(`The admin is not blocked!`);
        }

        unBlockingAdmin.isBlocked = false;
        await unBlockingAdmin.save();

        return unBlockingAdmin;
    }

    async delete(superAdmin: AdminUserDocument, deletingAdmin: AdminUserDocument)
    {
        this.validateSuperAdmin(superAdmin);
        this.validateNotEqual(superAdmin, deletingAdmin, `You cannot delete your account!`);

        deletingAdmin.deleted = true;
        deletingAdmin.deletedAt = new Date();

        await deletingAdmin.save();

        return deletingAdmin;
    }
}