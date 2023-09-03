import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import axios from 'axios';
import * as jwt from 'jsonwebtoken';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(
    private reflector: Reflector, // private userService: UserService, // private roleService: RoleService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const [req] = context.getArgs();
    const decoded = jwt.verify(
      String(req.headers.authorization).replace('Bearer ', ''),
      process.env.JWT_SECRET,
    );

    const { data } = (
      await axios.get(`${process.env.SERVICE_AUTH}/users/${decoded.sub}`, {
        headers: {
          Authorization: req.headers.authorization,
        },
      })
    ).data;
    const userPermissions = data.role?.permissions || [];
    let _userPermissions = userPermissions.map(({ name }) => name);

    const requiredPermissions =
      this.reflector.get('permissions', context.getHandler()) || [];
    const hasAllRequiredPermissions = requiredPermissions.every((permission) =>
      _userPermissions.includes(permission),
    );

    if (requiredPermissions.length === 0 || hasAllRequiredPermissions) {
      return true;
    }

    throw new ForbiddenException('Insufficient Permissions');
  }
}
