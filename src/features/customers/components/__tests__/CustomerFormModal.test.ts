
/**
 * @vitest-environment jsdom
 */
import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { CustomerFormModal } from '../CustomerFormModal';
import { Customer } from '../../types';
import { useZustandStore } from '../../../../store/useStore';

// Mock the entire zustand store
vi.mock('../../../../store/useStore', () => {
  const mockStore = vi.fn();
  return {
    useZustandStore: mockStore,
  };
});

const mockCustomer: Customer = {
  id: '1', company_id: 'company-1', name: 'Ahmed Ali', phone: '123', email: 'a@a.com', address: 'Riyadh', nationalId: '123', company: 'Comp', notes: 'Notes', status: 'active', riskLevel: 'low', totalDebt: 1, paidAmount: 1, remainingDebt: 1, currency: 'SAR', createdAt: 'date', totalTransactions: 1
};

describe('CustomerFormModal Component', () => {

  beforeEach(() => {
    (useZustandStore as any).mockImplementation((selector?: (state: any) => any) => {
        const state = { theme: 'dark' };
        if (selector) {
            return selector(state);
        }
        return state;
    });
  });

  it('should render the form with initial data for editing', () => {
    const onSaveMock = vi.fn();
    const onCloseMock = vi.fn();
    
    render(
      React.createElement(CustomerFormModal, {
        customer: mockCustomer,
        onClose: onCloseMock,
        onSave: onSaveMock,
        theme: "dark"
      })
    );
    
    // Check if fields are populated with mock data
    expect(screen.getByPlaceholderText('أدخل اسم العميل')).toHaveValue(mockCustomer.name);
    expect(screen.getByPlaceholderText('+966xxxxxxxxx')).toHaveValue(mockCustomer.phone);
    expect(screen.getByDisplayValue('نشط')).toBeInTheDocument();
  });

  it('should call onSave with the correct data when submitting a new customer form', async () => {
    const onSaveMock = vi.fn();
    const onCloseMock = vi.fn();

    render(
      React.createElement(CustomerFormModal, {
        customer: null,
        onClose: onCloseMock,
        onSave: onSaveMock,
        theme: "dark"
      })
    );

    // Simulate user input
    fireEvent.change(screen.getByPlaceholderText('أدخل اسم العميل'), { target: { value: 'New Customer' } });
    fireEvent.change(screen.getByPlaceholderText('+966xxxxxxxxx'), { target: { value: '987654321' } });
    
    // Simulate form submission by clicking the save button
    fireEvent.click(screen.getByText('إضافة العميل'));

    // Check if onSave was called with the updated data
    expect(onSaveMock).toHaveBeenCalledWith({
      name: 'New Customer',
      phone: '987654321',
      email: '',
      address: '',
      nationalId: '',
      company: '',
      notes: '',
      status: 'active',
      riskLevel: 'low',
      currency: 'SAR',
    });
  });

  it('should call onClose when the close button is clicked', () => {
    const onCloseMock = vi.fn();
    const onSaveMock = vi.fn();
    
    render(
      React.createElement(CustomerFormModal, {
        customer: null,
        onClose: onCloseMock,
        onSave: onSaveMock,
        theme: "dark"
      })
    );

    const closeButton = screen.getByRole('button', { name: /close/i });
    fireEvent.click(closeButton);

    expect(onCloseMock).toHaveBeenCalledTimes(1);
  });
});
