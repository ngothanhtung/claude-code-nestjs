import { IsOptional, IsUUID } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdatePostGroupsDto {
  @ApiPropertyOptional({ type: [String], example: ['d290f1ee-6c54-4b01-90e6-d701748f0851'], description: 'Array of group UUIDs to assign (replaces existing)' })
  @IsOptional()
  @IsUUID('4', { each: true })
  group_ids?: string[];
}
