import { Public } from '@modules/auth/decorators/public.decorator';
import { Roles } from '@modules/auth/decorators/roles.decorator';
import { RoleName } from '@modules/auth/guards/role.enum';

/* eslint-disable @typescript-eslint/ban-ts-comment */
import { Body, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';

import { PaginationDto } from './base.dto';
import { BaseEntity } from './base.entity';
import { BaseService } from './base.service';
import { ApiCreate, ApiDelete, ApiGetAll, ApiGetDetail, ApiUpdate } from './base.swagger';

export function BaseController<Entity extends BaseEntity>($ref: any, name?: string) {
  abstract class Controller {
    abstract relations: string[];

    constructor(public readonly service: BaseService<Entity>) {}

    @Roles(RoleName.Administrators)
    @Post()
    @ApiCreate($ref, name)
    create(@Body() body): Promise<Entity> {
      return this.service.create(body);
    }

    // @Public()
    // @Get()
    // @ApiGetAll($ref, name)
    // getAll(@Query() query: PaginationDto): Promise<[Entity[], number]> {
    //   return this.service.getAllWithPagination(
    //     query,
    //     {},
    //     //@ts-ignore
    //     { id: 'DESC' },
    //     ...this.relations,
    //   );
    // }

    @Public()
    @Get()
    @ApiGetAll($ref, name)
    getAll(): Promise<Entity[]> {
      return this.service.getAll({}, ...this.relations);
    }

    @Get('/:id')
    @ApiGetDetail($ref, name)
    getDetail(@Param('id') id: string | number): Promise<Entity> {
      return this.service.getOneByIdOrFail(id, ...this.relations);
    }

    @Patch('/:id')
    @ApiUpdate($ref, name)
    update(@Param('id') id: string, @Body() body): Promise<Entity> {
      return this.service.updateById(id, body);
    }

    @Delete('/:id')
    @ApiDelete($ref, name)
    delete(@Param('id') id: string): Promise<Entity> {
      return this.service.softDeleteById(id);
    }
  }

  return Controller;
}
