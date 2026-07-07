import { ApiForbiddenResponseOptions, ApiUnauthorizedResponseOptions } from '@common/open-api';
import { RoleName } from '@modules/auth/guards/role.enum';

import { applyDecorators, SetMetadata, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiForbiddenResponse, ApiUnauthorizedResponse } from '@nestjs/swagger';

import { RolesGuard } from '../guards/roles-auth.guard';

export const ROLES_KEY = 'ROLES_KEY';
export const Roles = (...roles: RoleName[]) => {
  return applyDecorators(
    SetMetadata(ROLES_KEY, roles),
    UseGuards(RolesGuard),
    ApiBearerAuth(),
    ApiUnauthorizedResponse(ApiUnauthorizedResponseOptions()),
    ApiForbiddenResponse(ApiForbiddenResponseOptions()),
  );
};
