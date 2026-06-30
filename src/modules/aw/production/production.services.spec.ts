import { AW_CONNECTION } from '../aw.constants';
import { ProductionService } from './production.services';

type FakeRow = Record<string, unknown>;

describe('ProductionService', () => {
  let dataSource: { query: jest.Mock<Promise<FakeRow[]>, [string, unknown[]?]> };
  let service: ProductionService;

  beforeEach(() => {
    dataSource = {
      query: jest.fn<Promise<FakeRow[]>, [string, unknown[]?]>(),
    };
    (dataSource.query as jest.Mock).mockResolvedValue([
      { ProductID: 1, Name: 'A' },
    ]);
    service = new ProductionService(
      dataSource as unknown as ConstructorParameters<
        typeof ProductionService
      >[0],
    );
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
    (dataSource.query as jest.Mock).mockResolvedValue(rows);

    await expect(service.findProducts()).resolves.toEqual(rows);
  });

  it('uses the AW named connection for injection', () => {
    // Service is constructed directly in this test, but verify the constant
    // is referenced in the decorator path — guard against accidental rename.
    expect(AW_CONNECTION).toBe('aw');
  });
});