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

  let operation: 'select' | 'insert' | 'update' | 'delete' | null = null;
  let operationData: any = null;

  const queryBuilder = {
    select: (fields = '*') => {
      if (!operation) operation = 'select';
      selectFields = fields;
      return queryBuilder;
    },
    insert: (data: any[]) => {
      operation = 'insert';
      operationData = data;
      return queryBuilder;
    },
    update: (data: any) => {
      operation = 'update';
      operationData = data;
      return queryBuilder;
    },
    delete: () => {
      operation = 'delete';
      return queryBuilder;
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
      return queryBuilder.then((res: any) => {
        if (res.error) return res;
        if (!res.data || (Array.isArray(res.data) && res.data.length === 0)) {
          return { data: null, error: { code: 'PGRST116', message: 'No rows found' } };
        }
        return { data: Array.isArray(res.data) ? res.data[0] : res.data, error: null };
      });
    },
    then: (resolve: (res: { data: any; error: any }) => void, reject?: (reason: any) => void) => {
      // Execute logic based on operation
      let resultData: any = null;
      let error: any = null;

      try {
        if (operation === 'insert') {
          // Enforce FK for summaries
          if (table === 'summaries') {
            const hasInvalidFK = operationData.some((item: any) => {
              const taskExists = mockData.tasks.find((t) => t.id === item.task_id);
              return !taskExists;
            });
            if (hasInvalidFK) {
              error = { code: '23503', message: 'Foreign key violation: task_id not found' };
              throw error;
            }
          }

          const items = operationData.map((item: any) => ({
            ...item,
            id: item.id || `mock-${Date.now()}-${Math.random()}`,
            created_at: item.created_at || new Date().toISOString(),
            updated_at: item.updated_at || new Date().toISOString(),
          }));
          mockData[table].push(...items);
          resultData = items;
        } else if (operation === 'update') {
          const updatedItems: any[] = [];
          mockData[table].forEach((item, index) => {
            const matches = Object.entries(filters).every(
              ([key, value]) => item[key] === value
            );
            if (matches) {
              Object.assign(item, operationData, { updated_at: new Date().toISOString() });
              updatedItems.push(item);
            }
          });
          resultData = updatedItems.length === 1 ? updatedItems[0] : updatedItems;
          // Supabase update returns null data by default unless .select() is called, 
          // but for this mock we'll return null to mimic default behavior or the updated items if needed.
          // For simplicity in tests, let's return null to mimic default 'do not return data'.
          // However, checking usage in tasks.ts: it awaits update but doesn't use return value usually.
        } else if (operation === 'delete') {
          const indicesToDelete: number[] = [];
          mockData[table].forEach((item, index) => {
            const matches = Object.entries(filters).every(
              ([key, value]) => item[key] === value
            );
            if (matches) indicesToDelete.push(index);
          });
          // Delete in reverse order to correct indices
          for (let i = indicesToDelete.length - 1; i >= 0; i--) {
            mockData[table].splice(indicesToDelete[i], 1);
          }
          resultData = null;
        } else {
          // SELECT
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

          resultData = results;
        }
      } catch (err) {
        error = err;
      }

      return Promise.resolve({ data: resultData, error }).then(resolve, reject);
    }
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
jest.mock('../../database/supabase', () => ({
  __esModule: true,
  default: mockSupabase,
  getSupabaseClient: mockSupabase,
}));
