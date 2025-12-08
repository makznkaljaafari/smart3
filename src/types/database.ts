
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      accounts: {
        Row: {
          id: string
          company_id: string
          account_number: string
          name: string
          type: 'asset' | 'liability' | 'equity' | 'revenue' | 'expense'
          parent_id: string | null
          is_placeholder: boolean
          currency: string
          created_at: string
        }
        Insert: {
          id?: string
          company_id: string
          account_number: string
          name: string
          type: 'asset' | 'liability' | 'equity' | 'revenue' | 'expense'
          parent_id?: string | null
          is_placeholder?: boolean
          currency?: string
          created_at?: string
        }
        Update: {
          id?: string
          company_id?: string
          account_number?: string
          name?: string
          type?: 'asset' | 'liability' | 'equity' | 'revenue' | 'expense'
          parent_id?: string | null
          is_placeholder?: boolean
          currency?: string
          created_at?: string
        }
      }
      company_account_settings: {
        Row: {
          company_id: string
          cash_account_id: string | null
          bank_account_id: string | null
          accounts_receivable_id: string | null
          accounts_payable_id: string | null
          default_revenue_account_id: string | null
          default_expense_account_id: string | null
          inventory_account_id: string | null
          cogs_account_id: string | null
          tax_payable_account_id: string | null
          default_salaries_expense_id: string | null
          default_salaries_payable_id: string | null
          default_general_expense_account_id: string | null
          default_cash_sales_account_id: string | null
          default_inventory_adjustment_account_id: string | null
          updated_at: string
        }
      }
      customers: {
        Row: {
          id: string
          company_id: string
          name: string
          phone: string
          email: string | null
          address: string | null
          national_id: string | null
          company_name: string | null
          notes: string | null
          status: 'active' | 'inactive' | 'blocked'
          risk_level: 'low' | 'medium' | 'high'
          currency: string
          created_at: string
          updated_at: string
          total_transactions: number
        }
      }
      suppliers: {
        Row: {
          id: string
          company_id: string
          name: string
          contact_person: string | null
          phone: string
          email: string | null
          address: string | null
          notes: string | null
          currency: string
          created_at: string
          total_purchases_value: number
          outstanding_balance: number
        }
      }
      projects: {
        Row: {
          id: string
          company_id: string
          name: string
          description: string | null
          status: string
          start_date: string | null
          end_date: string | null
          budget: number
          client_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          company_id: string
          name: string
          description?: string | null
          status?: string
          start_date?: string | null
          end_date?: string | null
          budget?: number
          client_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          company_id?: string
          name?: string
          description?: string | null
          status?: string
          start_date?: string | null
          end_date?: string | null
          budget?: number
          client_id?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      sales_invoices: {
        Row: {
          id: string
          company_id: string
          customer_id: string
          invoice_number: string
          invoice_date: string
          due_date: string | null
          subtotal: number
          discount_total: number
          tax_total: number
          total: number
          status: 'draft' | 'sent' | 'partially_paid' | 'paid' | 'cancelled' | 'void'
          notes: string | null
          currency: string
          paid_amount: number
          remaining_amount: number
          created_at: string
        }
      }
      purchase_invoices: {
        Row: {
          id: string
          company_id: string
          supplier_id: string | null
          invoice_number: string
          invoice_date: string
          due_date: string | null
          subtotal: number
          discount_total: number
          tax_total: number
          total: number
          status: 'draft' | 'ordered' | 'partially_received' | 'received' | 'paid'
          notes: string | null
          currency: string
          amount_paid: number
          remaining_amount: number
          created_at: string
        }
      }
      products: {
        Row: {
          id: string
          company_id: string
          sku: string
          name: string
          description: string | null
          barcode: string | null
          category: string | null
          unit: string | null
          cost_price: number
          sale_price: number
          currency: string
          min_stock_level: number
          reorder_point: number
          is_active: boolean
          image_url: string | null
          tags: string[] | null
          created_at: string
        }
      }
      journal_entries: {
        Row: {
          id: string
          company_id: string
          entry_date: string
          description: string
          total_debit: number
          total_credit: number
          reference_type: string | null
          reference_id: string | null
          created_by: string | null
          created_at: string
        }
      }
      journal_lines: {
        Row: {
          id: string
          journal_entry_id: string
          company_id: string
          account_id: string
          debit: number
          credit: number
          note: string | null
        }
      }
    }
    Views: {
      vw_account_balances: {
        Row: {
          account_id: string
          account_number: string
          account_name: string
          account_type: 'asset' | 'liability' | 'equity' | 'revenue' | 'expense'
          company_id: string
          currency: string
          total_debit: number
          total_credit: number
          balance: number
          is_placeholder: boolean
          parent_id: string | null
        }
      }
      vw_income_statement_by_account: {
        Row: {
          account_id: string
          account_number: string
          account_name: string
          account_type: 'revenue' | 'expense'
          company_id: string
          currency: string
          total_debit: number
          total_credit: number
          net_amount: number
        }
      }
      vw_balance_sheet_by_account: {
        Row: {
          account_id: string
          account_number: string
          account_name: string
          account_type: 'asset' | 'liability' | 'equity'
          company_id: string
          currency: string
          total_debit: number
          total_credit: number
          balance: number
        }
      }
      vw_debts_aging_by_customer: {
        Row: {
          company_id: string
          customer_id: string
          customer_name: string
          currency: string
          total_outstanding: number
          not_due: number
          bucket_0_30: number
          bucket_31_60: number
          bucket_61_90: number
          bucket_90_plus: number
          last_payment_date: string | null
        }
      }
      vw_product_stock_per_warehouse: {
        Row: {
          product_id: string
          product_name: string
          warehouse_id: string
          warehouse_name: string
          company_id: string
          quantity: number
          reserved_quantity: number
          available_quantity: number
        }
      }
    }
    Functions: {
      create_sales_invoice_with_journal_multi: {
        Args: {
          p_company_id: string
          p_customer_id: string
          p_invoice_number: string
          p_invoice_date: string
          p_due_date: string
          p_currency: string
          p_items_jsonb: Json
          p_is_cash: boolean
          p_notes: string
          p_created_by: string
        }
        Returns: string
      }
      create_purchase_invoice_with_journal_multi: {
        Args: {
          p_company_id: string
          p_supplier_id: string | null
          p_invoice_number: string
          p_invoice_date: string
          p_due_date: string
          p_currency: string
          p_items_jsonb: Json
          p_is_cash: boolean
          p_notes: string
          p_created_by: string
        }
        Returns: string
      }
      add_debt_payment_multi_currency: {
        Args: {
          p_company_id: string
          p_debt_id: string
          p_payment_amount: number
          p_payment_currency: string
          p_payment_date: string
          p_method: string
          p_deposit_account_id: string | null
          p_notes: string | null
          p_created_by: string | null
        }
        Returns: Json
      }
      get_company_account_map: {
        Args: {
          p_company_id: string
        }
        Returns: Json
      }
    }
  }
}

// Helper types for Join results
export interface SalesInvoiceWithRelations {
    id: string;
    company_id: string;
    customer_id: string;
    invoice_number: string;
    invoice_date: string;
    due_date: string;
    subtotal: number;
    discount_total: number;
    tax_total: number;
    total: number;
    status: string;
    notes: string;
    currency: string;
    paid_amount: number;
    remaining_amount: number;
    // Joins
    customers: { name: string } | null;
    sales_invoice_items: {
        product_id: string;
        quantity: number;
        unit_price: number;
        line_total: number;
        discount_amount: number;
        products: { name: string } | null;
    }[];
}

export interface PurchaseInvoiceWithRelations {
    id: string;
    company_id: string;
    supplier_id: string | null;
    invoice_number: string;
    invoice_date: string;
    due_date: string;
    subtotal: number;
    discount_total: number;
    tax_total: number;
    total: number;
    status: string;
    notes: string;
    currency: string;
    amount_paid: number;
    remaining_amount: number;
    // Joins
    suppliers: { name: string } | null;
    purchase_invoice_items: {
        product_id: string;
        quantity: number;
        unit_cost: number;
        line_total: number;
        products: { name: string } | null;
    }[];
}
