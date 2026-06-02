export function createMockQueryBuilder(data: unknown[] = [], total = 0) {
  const mock: Record<string, jest.Mock> = {
    select: jest.fn().mockReturnThis(),
    addSelect: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    orWhere: jest.fn().mockReturnThis(),
    leftJoin: jest.fn().mockReturnThis(),
    leftJoinAndSelect: jest.fn().mockReturnThis(),
    innerJoin: jest.fn().mockReturnThis(),
    innerJoinAndSelect: jest.fn().mockReturnThis(),
    groupBy: jest.fn().mockReturnThis(),
    addGroupBy: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    addOrderBy: jest.fn().mockReturnThis(),
    skip: jest.fn().mockReturnThis(),
    take: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    offset: jest.fn().mockReturnThis(),
    getOne: jest.fn().mockResolvedValue(data[0] ?? null),
    getMany: jest.fn().mockResolvedValue(data),
    getManyAndCount: jest.fn().mockResolvedValue([data, total]),
    getRawOne: jest.fn().mockResolvedValue(data[0] ?? null),
    getRawMany: jest.fn().mockResolvedValue(data),
    getCount: jest.fn().mockResolvedValue(total),
    execute: jest.fn().mockResolvedValue({ raw: data, affected: data.length }),
    setParameter: jest.fn().mockReturnThis(),
    having: jest.fn().mockReturnThis(),
    from: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    set: jest.fn().mockReturnThis(),
    delete: jest.fn().mockReturnThis(),
    fromEntity: jest.fn().mockReturnThis(),
  };

  return mock;
}

export function createMockRepository<T = unknown>(
  overrides: Partial<Record<string, jest.Mock>> = {},
) {
  return {
    find: jest.fn().mockResolvedValue([]),
    findOne: jest.fn().mockResolvedValue(null),
    findOneBy: jest.fn().mockResolvedValue(null),
    findOneOrFail: jest.fn().mockResolvedValue(null),
    findAndCount: jest.fn().mockResolvedValue([[], 0]),
    create: jest.fn().mockImplementation((dto: unknown) => dto as T),
    save: jest
      .fn()
      .mockImplementation((entity: unknown) => Promise.resolve(entity as T)),
    remove: jest
      .fn()
      .mockImplementation((entity: unknown) => Promise.resolve(entity as T)),
    softRemove: jest
      .fn()
      .mockImplementation((entity: unknown) => Promise.resolve(entity as T)),
    delete: jest.fn().mockResolvedValue({ affected: 0, raw: {} }),
    update: jest.fn().mockResolvedValue({ affected: 0, raw: {} }),
    count: jest.fn().mockResolvedValue(0),
    createQueryBuilder: jest.fn().mockReturnValue(createMockQueryBuilder()),
    query: jest.fn().mockResolvedValue([]),
    manager: {
      connection: {
        createQueryRunner: jest.fn(),
      },
    },
    ...overrides,
  };
}
