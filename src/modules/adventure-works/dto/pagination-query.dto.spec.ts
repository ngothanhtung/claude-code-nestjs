import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { PaginationQueryDto } from './pagination-query.dto';

describe('PaginationQueryDto', () => {
  it('uses defaults when query parameters are omitted', async () => {
    const dto = plainToInstance(PaginationQueryDto, {});

    expect(await validate(dto)).toHaveLength(0);
    expect(dto).toEqual({ page: 1, limit: 20 });
  });

  it('transforms numeric strings', async () => {
    const dto = plainToInstance(PaginationQueryDto, {
      page: '2',
      limit: '10',
    });

    expect(await validate(dto)).toHaveLength(0);
    expect(dto).toEqual({ page: 2, limit: 10 });
  });

  it.each([
    { page: 0, limit: 20 },
    { page: 1, limit: 0 },
    { page: 1, limit: 101 },
  ])('rejects invalid pagination: %o', async (input) => {
    const dto = plainToInstance(PaginationQueryDto, input);
    expect(await validate(dto)).not.toHaveLength(0);
  });
});
