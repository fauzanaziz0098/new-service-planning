import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RoleService } from 'src/role/role.service';
import { UserService } from 'src/user/user.service';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private userService: UserService,
    private roleService: RoleService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const [req] = context.getArgs();

    const user = await this.userService.findOne(req?.user?.userId);
    const role = await this.roleService.findOne(user.role.id);
    // const userPermissions = role?.permissions || [];
    // let _userPermissions = userPermissions.map(({ name }) => name);

    const requiredPermissions =
      this.reflector.get('permissions', context.getHandler()) || [];
    // const hasAllRequiredPermissions = requiredPermissions.every((permission) =>
    //   _userPermissions.includes(permission),
    // );

    if (requiredPermissions.length === 0) {
      return true;
    }
    // if (requiredPermissions.length === 0 || hasAllRequiredPermissions) {
    //   return true;
    // }

    throw new ForbiddenException('Insufficient Permissions');
  }
}
