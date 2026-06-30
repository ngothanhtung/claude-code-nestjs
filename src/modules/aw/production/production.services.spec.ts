import { DataSource } from 'typeorm';
import { ProductionService } from './production.services';

type FakeRow = Record<string, unknown>;

describe('ProductionService', () => {
  let dataSource: Pick<DataSource, 'query'>;
  let service: ProductionService;

  beforeEach(() => {
    dataSource = {
      query: jest.fn(),
    };
    jest
      .mocked(dataSource.query)
      .mockResolvedValue([{ ProductID: 1, Name: 'A' }]);
    service = new ProductionService(dataSource);
  });

  it('runs the exact SELECT * FROM [Production].[Product] ORDER BY [Name] query', async () => {
    await service.findProducts();

    expect(dataSource.query).toHaveBeenCalledTimes(1);
    expect(dataSource.query).toHaveBeenCalledWith(
      'SELECT * FROM [Production].[Product] ORDER BY [Name]',
    );
  });

  it('returns whatever the data source query resolves with', async () => {
    const rows: FakeRow[] = [
      { ProductID: 1, Name: 'A' },
      { ProductID: 2, Name: 'B' },
    ];
    jest.mocked(dataSource.query).mockResolvedValue(rows);

    await expect(service.findProducts()).resolves.toEqual(rows);
  });
});
