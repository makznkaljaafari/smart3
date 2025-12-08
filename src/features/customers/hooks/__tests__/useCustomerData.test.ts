
/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useCustomerData } from '../useCustomerData';
import { useZustandStore } from '../../../../store/useStore';
import { Customer } from '../../types';

// Mock the entire zustand store
vi.mock('../../../../store/useStore', () => {
  const originalModule = vi.importActual('../../../../store/useStore');
  const mockStore = vi.fn();
  return {
    ...originalModule,
    useZustandStore: mockStore,
  };
});

const mockSetState = vi.fn();
const mockGetState = vi.fn();

const mockCustomers: Customer[] = [
  { id: '1', company_id: 'company-1', name: 'Ahmed Ali', phone: '123', status: 'active', riskLevel: 'low', remainingDebt: 100, totalDebt: 500, paidAmount: 400, currency: 'SAR', createdAt: '', totalTransactions: 1 },
  { id: '2', company_id: 'company-1', name: 'Fatima Omar', phone: '456', status: 'inactive', riskLevel: 'medium', remainingDebt: 200, totalDebt: 200, paidAmount: 0, currency: 'SAR', createdAt: '', totalTransactions: 1 },
  { id: '3', company_id: 'company-1', name: 'Khalid Saleh', phone: '789', status: 'active', riskLevel: 'high', remainingDebt: 1000, totalDebt: 1000, paidAmount: 0, currency: 'SAR', createdAt: '', totalTransactions: 1 },
];

const mockInitialState = {
  customers: mockCustomers,
  lang: 'ar',
  settings: { page: { customers: { pageSize: 2 } } },
  authUser: { id: 'user-1', name: 'Test User', email: 'test@test.com' },
  setAllData: vi.fn(),
  customersLoading: false,
  customersError: null,
  addToast: vi.fn(),
  fetchCustomers: vi.fn(),
};

describe('useCustomerData Hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (useZustandStore as any).mockImplementation((selector?: (state: any) => any) => {
        const state = {
            ...mockInitialState,
            getState: mockGetState,
            setState: mockSetState,
        };
        // This simulates the selector function
        if(selector) return selector(state);
        return state;
    });
    
    // Also mock the static methods on the store if they are used
    (useZustandStore as any).getState = () => mockInitialState;
    (useZustandStore as any).setState = mockSetState;
  });

  it('should return initial stats correctly', () => {
    const { result } = renderHook(() => useCustomerData());
    expect(result.current.stats.total).toBe(3);
    expect(result.current.stats.active).toBe(2);
    expect(result.current.stats.highRisk).toBe(1);
  });

  it('should filter customers by search term', () => {
    const { result } = renderHook(() => useCustomerData());
    
    act(() => {
      result.current.setSearchTerm('Ahmed');
    });

    expect(result.current.filteredCustomers.length).toBe(1);
    expect(result.current.filteredCustomers[0].name).toBe('Ahmed Ali');
  });

  it('should filter customers by status', () => {
    const { result } = renderHook(() => useCustomerData());

    act(() => {
      result.current.setStatusFilter('inactive');
    });

    expect(result.current.filteredCustomers.length).toBe(1);
    expect(result.current.filteredCustomers[0].name).toBe('Fatima Omar');
  });

  it('should handle pagination correctly', () => {
    const { result } = renderHook(() => useCustomerData());

    expect(result.current.paginatedCustomers.length).toBe(2); // Page size is 2
    expect(result.current.totalPages).toBe(2);
    expect(result.current.currentPage).toBe(1);

    act(() => {
      result.current.setCurrentPage(2);
    });

    expect(result.current.currentPage).toBe(2);
    expect(result.current.paginatedCustomers.length).toBe(1);
    expect(result.current.paginatedCustomers[0].name).toBe('Khalid Saleh');
  });

});
