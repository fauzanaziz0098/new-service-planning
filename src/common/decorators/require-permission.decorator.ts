import { SetMetadata } from '@nestjs/common';

import { Permission } from '../enums';

export const D_C_REQUIRED_PERMISSION = 'requiredPermission';

export const RequiredPermission = (permission: Permission) => {
    return SetMetadata(D_C_REQUIRED_PERMISSION, permission);
};
