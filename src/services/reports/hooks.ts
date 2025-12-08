
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import {
  fetchTrialBalance,
  fetchIncomeStatement,
  fetchBalanceSheet,
  fetchFinancialSummary,
  fetchDebtsAging,
} from './api';

export function useFinancialSummary(companyId: string | undefined, range: { from: string; to: string; asOf: string }) {
  return useQuery({
    queryKey: ['financialSummary', companyId, range],
    queryFn: () => {
      if (!companyId) throw new Error("Company ID is required");
      return fetchFinancialSummary({ companyId, ...range });
    },
    enabled: !!companyId,
    placeholderData: keepPreviousData,
  });
}

export function useTrialBalance(companyId: string | undefined, asOf: string) {
  return useQuery({
    queryKey: ['trialBalance', companyId, asOf],
    queryFn: () => {
      if (!companyId) throw new Error("Company ID is required");
      return fetchTrialBalance({ companyId, asOf });
    },
    enabled: !!companyId,
    placeholderData: keepPreviousData,
  });
}

export function useIncomeStatement(companyId: string | undefined, range: { from: string; to: string }) {
  return useQuery({
    queryKey: ['incomeStatement', companyId, range],
    queryFn: () => {
      if (!companyId) throw new Error("Company ID is required");
      return fetchIncomeStatement({ companyId, ...range });
    },
    enabled: !!companyId,
    placeholderData: keepPreviousData,
  });
}

export function useBalanceSheet(companyId: string | undefined, asOf: string) {
  return useQuery({
    queryKey: ['balanceSheet', companyId, asOf],
    queryFn: () => {
      if (!companyId) throw new Error("Company ID is required");
      return fetchBalanceSheet({ companyId, asOf });
    },
    enabled: !!companyId,
    placeholderData: keepPreviousData,
  });
}

export function useDebtsAging(companyId: string | undefined, asOf: string) {
  return useQuery({
    queryKey: ['debtsAging', companyId, asOf],
    queryFn: () => {
      if (!companyId) throw new Error("Company ID is required");
      return fetchDebtsAging({ companyId, asOf });
    },
    enabled: !!companyId,
    placeholderData: keepPreviousData,
  });
}
