
import { applyDecorators, SetMetadata, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiForbiddenResponse, ApiUnauthorizedResponse } from '@nestjs/swagger';

import { RolesGuard } from '../guards/roles-auth.guard';
import { RoleName } from '../guards/role.enum';

export const ROLES_KEY = 'ROLES_KEY';
export const Roles = (...roles: RoleName[]) => {
  return applyDecorators(
    SetMetadata(ROLES_KEY, roles),
    UseGuards(RolesGuard),
    ApiBearerAuth(),    
  );
};
