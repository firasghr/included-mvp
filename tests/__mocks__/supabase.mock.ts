/**
 * Supabase Mock
 * Provides in-memory mock for Supabase operations during testing
 */

type MockData = {
  clients: any[];
  tasks: any[];
  summaries: any[];
  notification_events: any[];
};

const mockData: MockData = {
  clients: [],
  tasks: [],
  summaries: [],
  notification_events: [],
};

const createMockQueryBuilder = (table: keyof MockData) => {
  let filters: Record<string, any> = {};
  let orderConfig: { column: string; ascending: boolean } | null = null;
  let limitValue: number | null = null;
  let selectFields = '*';

  const queryBuilder = {
    select: (fields = '*') => {
      selectFields = fields;
      return queryBuilder;
    },
    insert: (data: any[]) => {
      const items = data.map((item) => ({
        ...item,
        id: item.id || `mock-${Date.now()}-${Math.random()}`,
        created_at: item.created_at || new Date().toISOString(),
        updated_at: item.updated_at || new Date().toISOString(),
      }));
      mockData[table].push(...items);
      return {
        select: () => ({
          single: () => ({
            data: items[0],
            error: null,
          }),
        }),
      };
    },
    update: (data: any) => {
      const matchingIndices: number[] = [];
      mockData[table].forEach((item, index) => {
        const matches = Object.entries(filters).every(
          ([key, value]) => item[key] === value
        );
        if (matches) {
          matchingIndices.push(index);
          Object.assign(item, data, { updated_at: new Date().toISOString() });
        }
      });
      return {
        eq: (column: string, value: any) => {
          filters[column] = value;
          return {
            data: matchingIndices.length > 0 ? mockData[table].filter((_, i) => matchingIndices.includes(i)) : [],
            error: null,
          };
        },
        data: matchingIndices.length > 0 ? mockData[table].filter((_, i) => matchingIndices.includes(i)) : [],
        error: null,
      };
    },
    delete: () => {
      const matchingIndices: number[] = [];
      mockData[table].forEach((_, index) => {
        const matches = Object.entries(filters).every(
          ([key, value]) => mockData[table][index][key] === value
        );
        if (matches) matchingIndices.push(index);
      });
      matchingIndices.reverse().forEach(i => mockData[table].splice(i, 1));
      return {
        eq: (column: string, value: any) => {
          filters[column] = value;
          return { data: null, error: null };
        },
      };
    },
    eq: (column: string, value: any) => {
      filters[column] = value;
      return queryBuilder;
    },
    order: (column: string, { ascending = true } = {}) => {
      orderConfig = { column, ascending };
      return queryBuilder;
    },
    limit: (value: number) => {
      limitValue = value;
      return queryBuilder;
    },
    single: () => {
      let results = mockData[table].filter((item) =>
        Object.entries(filters).every(([key, value]) => item[key] === value)
      );

      if (results.length === 0) {
        return {
          data: null,
          error: { code: 'PGRST116', message: 'No rows found' },
        };
      }

      return {
        data: results[0],
        error: null,
      };
    },
    then: (resolve: any) => {
      let results = mockData[table].filter((item) =>
        Object.entries(filters).every(([key, value]) => item[key] === value)
      );

      if (orderConfig) {
        results.sort((a, b) => {
          const aVal = a[orderConfig!.column];
          const bVal = b[orderConfig!.column];
          const comparison = aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
          return orderConfig!.ascending ? comparison : -comparison;
        });
      }

      if (limitValue !== null) {
        results = results.slice(0, limitValue);
      }

      return resolve({
        data: results,
        error: null,
      });
    },
  };

  return queryBuilder;
};

export const mockSupabase = () => {
  return {
    from: (table: keyof MockData) => createMockQueryBuilder(table),
  };
};

// Export function to clear mock data between tests
export const clearMockData = () => {
  mockData.clients = [];
  mockData.tasks = [];
  mockData.summaries = [];
  mockData.notification_events = [];
};

// Export function to get mock data for assertions
export const getMockData = () => mockData;

// Mock the supabase module
jest.mock('../database/supabase', () => ({
  __esModule: true,
  default: mockSupabase,
  getSupabaseClient: mockSupabase,
}));
