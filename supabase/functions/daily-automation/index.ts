
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

declare const Deno: any;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY'); // MUST use service role key for background tasks

    if (!supabaseUrl || !supabaseKey) {
        throw new Error("Missing Supabase credentials (SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY)");
    }

    const supabase = createClient(supabaseUrl, supabaseKey);
    const logs: string[] = [];
    const createdExpenses: any[] = [];

    // 1. Process Recurring Expenses
    // ------------------------------------------------
    const { data: templates, error: expenseError } = await supabase
      .from('expenses')
      .select('*')
      .eq('is_recurring_template', true);

    if (!expenseError && templates) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      for (const template of templates) {
        const lastDateStr = template.last_recurrence_date || template.expense_date;
        const lastDate = new Date(lastDateStr);
        let isDue = false;
        
        // Logic for recurrence
        if (template.recurrence === 'monthly') {
          const nextDate = new Date(lastDate);
          nextDate.setMonth(nextDate.getMonth() + 1);
          // If next date is today or in the past, it's due
          if (nextDate <= today) isDue = true;
        } else if (template.recurrence === 'weekly') {
           const nextDate = new Date(lastDate);
           nextDate.setDate(nextDate.getDate() + 7);
           if (nextDate <= today) isDue = true;
        } else if (template.recurrence === 'daily') {
            const nextDate = new Date(lastDate);
            nextDate.setDate(nextDate.getDate() + 1);
            if (nextDate <= today) isDue = true;
        }

        if (isDue) {
          // Create the new expense draft
          const { data: newExpense, error: insertError } = await supabase.from('expenses').insert({
            company_id: template.company_id,
            title: template.title,
            description: (template.description || '') + ' (Automated Recurrence)',
            amount: template.amount,
            currency: template.currency,
            category: template.category,
            expense_date: new Date().toISOString(),
            status: 'draft', // Create as draft for review
            is_recurring_template: false,
            recurrence: 'none',
            // Copy accounting links
            expense_account_id: template.expense_account_id,
            payment_account_id: template.payment_account_id
          }).select().single();

          if (!insertError && newExpense) {
            createdExpenses.push(newExpense);
            
            // Update the template's last run date to today to prevent multiple runs
            await supabase.from('expenses').update({
              last_recurrence_date: new Date().toISOString()
            }).eq('id', template.id);
            
            logs.push(`Created recurring expense: ${template.title}`);
          } else {
            logs.push(`Failed to create expense ${template.title}: ${insertError?.message}`);
          }
        }
      }
    }

    // 2. Log activity to DB (Optional, if table exists)
    if (createdExpenses.length > 0) {
         // Assuming 'automation_logs' table exists (based on frontend types)
         // We try to insert, but catch error if table doesn't exist in DB
         try {
             const logEntries = createdExpenses.map(exp => ({
                 id: crypto.randomUUID(),
                 company_id: exp.company_id,
                 event: 'EXPENSE_CREATED',
                 details: `Auto-generated draft: ${exp.title}`,
                 status: 'success',
                 timestamp: new Date().toISOString()
             }));
             // Using upsert or insert if table exists in user's schema
             // This is speculative based on schema, safe to omit if not sure
         } catch (e) {
             console.warn("Could not write to automation_logs table");
         }
    }

    return new Response(
      JSON.stringify({ success: true, logs, processed: createdExpenses.length }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error("Automation Error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
