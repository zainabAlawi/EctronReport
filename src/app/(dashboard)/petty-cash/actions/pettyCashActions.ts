'use server';

import { createClient } from '@/lib/supabase-server';
import { revalidatePath } from 'next/cache';

import { getRecurringDescriptions } from './resourcesActions';

export async function getFormData() {
  const supabase = await createClient();
  
  const [categoriesResp, profilesResp, projectsResp, recurring] = await Promise.all([
    supabase.from('petty_cash_categories').select('id, name').eq('active', true).order('name'),
    supabase.from('profiles').select('id, full_name, username').eq('is_active', true).order('full_name'),
    supabase.from('projects').select('id, name').eq('active', true).order('name'),
    getRecurringDescriptions()
  ]);

  let allowedProfiles = profilesResp.data || [];
  try {
    const fs = await import('fs/promises');
    const path = await import('path');
    const settingsPath = path.join(process.cwd(), 'src', 'data', 'petty-cash-settings.json');
    const content = await fs.readFile(settingsPath, 'utf-8');
    const settings = JSON.parse(content);
    if (settings.allowedEmployeeIds && settings.allowedEmployeeIds.length > 0) {
      const allowedSet = new Set(settings.allowedEmployeeIds);
      allowedProfiles = allowedProfiles.filter((p: any) => allowedSet.has(p.id));
    }
  } catch (e) {
    // fallback to all profiles
  }

  // Generate next Expense No
  const currentYear = new Date().getFullYear();
  const { data: latestExpense } = await supabase
    .from('petty_cash_expenses')
    .select('expense_no')
    .like('expense_no', `PC-${currentYear}-%`)
    .order('expense_no', { ascending: false })
    .limit(1);

  let nextNumber = 1;
  if (latestExpense && latestExpense.length > 0) {
    const lastNo = latestExpense[0].expense_no;
    const parts = lastNo.split('-');
    if (parts.length === 3) {
      nextNumber = parseInt(parts[2], 10) + 1;
    }
  }

  const nextExpenseNo = `PC-${currentYear}-${nextNumber.toString().padStart(4, '0')}`;

  return {
    categories: categoriesResp.data || [],
    profiles: allowedProfiles,
    projects: projectsResp.data || [],
    recurringDescriptions: recurring || [],
    nextExpenseNo
  };
}

async function resolveProjectAllocation(
  supabase: any,
  projectAllocationsStr: string | null,
  directProjectId: string | null,
  projectText?: string | null
): Promise<string | null> {
  // If direct project text is provided (from single-line input in Update or New modal)
  if (projectText !== undefined && projectText !== null) {
    const trimmed = projectText.trim();
    if (!trimmed) {
      return null;
    }

    // Check if project exists by name (case-insensitive)
    const { data: existing } = await supabase
      .from('projects')
      .select('id')
      .ilike('name', trimmed)
      .maybeSingle();

    if (existing) {
      return existing.id;
    }

    // Create new project with this text
    const { data: newProj, error } = await supabase
      .from('projects')
      .insert([{ name: trimmed, active: true }])
      .select('id')
      .single();

    if (newProj) {
      return newProj.id;
    }
    if (error) {
      console.error('Error inserting project with text:', error);
    }
  }

  if (!projectAllocationsStr) {
    return directProjectId || null;
  }

  try {
    const allocations: Array<{ projectId: string; percentage: number }> = JSON.parse(projectAllocationsStr);
    const validAllocs = allocations.filter(a => a.projectId && Number(a.percentage) > 0);

    if (validAllocs.length === 0) {
      return null;
    }

    if (validAllocs.length === 1 && Number(validAllocs[0].percentage) === 100) {
      return validAllocs[0].projectId;
    }

    // Multiple projects or split percentages (e.g. 80% / 20%)
    const projectIds = validAllocs.map(a => a.projectId);
    const { data: projectRecords } = await supabase
      .from('projects')
      .select('id, name')
      .in('id', projectIds);

    const projectMap = new Map<string, string>((projectRecords || []).map((p: any) => [p.id, p.name]));

    const compositeParts = validAllocs.map(a => {
      const name = projectMap.get(a.projectId) || 'Project';
      return `${name} ${a.percentage}%`;
    });
    const compositeName = compositeParts.join(', ');

    // Check if this composite exists
    const { data: existingCombo } = await supabase
      .from('projects')
      .select('id')
      .ilike('name', compositeName)
      .maybeSingle();

    if (existingCombo) {
      return existingCombo.id;
    }

    // Insert new composite project so it's tracked in projects table
    const { data: newCombo, error: insertError } = await supabase
      .from('projects')
      .insert([{ name: compositeName, active: true }])
      .select('id')
      .single();

    if (newCombo) {
      return newCombo.id;
    }

    if (insertError) {
      console.error('Error inserting composite project:', insertError);
    }
    return validAllocs[0].projectId;
  } catch (err) {
    console.error('Error in resolveProjectAllocation:', err);
    return directProjectId || null;
  }
}

export async function createExpense(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const expense_no = formData.get('expense_no') as string;
  const expense_date = formData.get('expense_date') as string;
  const request_description = formData.get('request_description') as string;
  const category_id = formData.get('category_id') as string;
  const employee_id = formData.get('employee_id') as string;
  const amount = parseFloat(formData.get('amount') as string);
  const projectAllocationsStr = formData.get('project_allocations') as string | null;
  const directProjectId = formData.get('project_id') as string || null;
  const projectText = formData.get('project_text') as string | null;
  const project_id = await resolveProjectAllocation(supabase, projectAllocationsStr, directProjectId, projectText);
  
  const attachmentFile = formData.get('attachment') as File | null;
  let attachment_url = null;
  if (attachmentFile && attachmentFile.size > 0 && attachmentFile.name) {
    try {
      const fileExt = attachmentFile.name.split('.').pop();
      const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `petty-cash/${fileName}`;
      
      const arrayBuffer = await attachmentFile.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      // Create an admin client to bypass RLS for storage uploads
      const { createClient: createSupabaseAdmin } = require('@supabase/supabase-js');
      const supabaseAdmin = createSupabaseAdmin(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      );

      const { error: uploadError } = await supabaseAdmin.storage
        .from('attachments')
        .upload(filePath, buffer, {
          contentType: attachmentFile.type,
          upsert: true
        });

      if (uploadError) {
        console.error('Error uploading attachment:', uploadError);
        return { error: 'Failed to upload attachment. Ensure the "attachments" bucket exists and permissions are correct.' };
      }

      const { data: publicUrlData } = supabaseAdmin.storage
        .from('attachments')
        .getPublicUrl(filePath);
        
      attachment_url = publicUrlData.publicUrl;
    } catch (err) {
      console.error('File processing error:', err);
      return { error: 'Failed to process attachment file.' };
    }
  }
  
  if (!expense_no || !expense_date || !request_description || !category_id || !employee_id || !amount || amount <= 0) {
    return { error: 'Missing required fields or invalid amount' };
  }

  // Check duplicate
  const { data: existing } = await supabase
    .from('petty_cash_expenses')
    .select('id')
    .eq('expense_date', expense_date)
    .eq('employee_id', employee_id)
    .eq('amount', amount)
    .eq('request_description', request_description)
    .eq('category_id', category_id);

  if (existing && existing.length > 0 && formData.get('confirm_duplicate') !== 'true') {
    return { error: 'DUPLICATE_WARNING', message: 'A similar expense already exists. Are you sure you want to save?' };
  }

  const { data, error } = await supabase
    .from('petty_cash_expenses')
    .insert([{
      expense_no,
      expense_date,
      request_description,
      category_id,
      employee_id,
      amount,
      project_id,
      attachment_url,
      created_by: user?.id,
      updated_by: user?.id
    }])
    .select();

  if (error) {
    console.error('Error saving expense:', error);
    return { error: error.message };
  }

  revalidatePath('/petty-cash/dashboard');
  revalidatePath('/petty-cash/settlement');
  return { success: true, data };
}

export async function updateExpense(id: string, formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const expense_date = formData.get('expense_date') as string;
  const request_description = formData.get('request_description') as string;
  const category_id = formData.get('category_id') as string;
  const employee_id = formData.get('employee_id') as string;
  const amount = parseFloat(formData.get('amount') as string);
  const projectAllocationsStr = formData.get('project_allocations') as string | null;
  const directProjectId = formData.get('project_id') as string || null;
  const projectText = formData.get('project_text') as string | null;
  const project_id = await resolveProjectAllocation(supabase, projectAllocationsStr, directProjectId, projectText);

  const attachmentFile = formData.get('attachment') as File | null;

  if (!expense_date || !request_description || !category_id || !employee_id || !amount || amount <= 0) {
    return { error: 'Missing required fields or invalid amount' };
  }

  const updatePayload: any = {
    expense_date,
    request_description,
    category_id,
    employee_id,
    amount,
    project_id,
    updated_by: user?.id,
    updated_at: new Date().toISOString()
  };

  if (attachmentFile && attachmentFile.size > 0 && attachmentFile.name) {
    try {
      const fileExt = attachmentFile.name.split('.').pop();
      const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `petty-cash/${fileName}`;
      
      const arrayBuffer = await attachmentFile.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      // Create an admin client to bypass RLS for storage uploads
      const { createClient: createSupabaseAdmin } = require('@supabase/supabase-js');
      const supabaseAdmin = createSupabaseAdmin(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      );

      const { error: uploadError } = await supabaseAdmin.storage
        .from('attachments')
        .upload(filePath, buffer, {
          contentType: attachmentFile.type,
          upsert: true
        });

      if (uploadError) {
        console.error('Error uploading attachment:', uploadError);
        return { error: 'Failed to upload attachment. Ensure the "attachments" bucket exists and permissions are correct.' };
      }

      const { data: publicUrlData } = supabaseAdmin.storage
        .from('attachments')
        .getPublicUrl(filePath);
        
      updatePayload.attachment_url = publicUrlData.publicUrl;
    } catch (err) {
      console.error('File processing error:', err);
      return { error: 'Failed to process attachment file.' };
    }
  }

  const { data, error } = await supabase
    .from('petty_cash_expenses')
    .update(updatePayload)
    .eq('id', id)
    .select();

  if (error) {
    console.error('Error updating expense:', error);
    return { error: error.message };
  }

  revalidatePath('/petty-cash/dashboard');
  revalidatePath('/petty-cash/settlement');
  return { success: true, data };
}

export async function deleteExpenses(ids: string[]) {
  try {
    const supabase = await createClient();

    if (!ids || ids.length === 0) {
      return { error: 'No expenses selected.' };
    }

    const { error } = await supabase
      .from('petty_cash_expenses')
      .delete()
      .in('id', ids);

    if (error) {
      console.error('Error deleting expenses:', error);
      return { error: error.message };
    }

    revalidatePath('/petty-cash/dashboard');
    revalidatePath('/petty-cash/settlement');
    return { success: true };
  } catch (err: any) {
    console.error('Unexpected error in deleteExpenses:', err);
    return { error: err.message || 'Failed to delete expenses' };
  }
}

export async function transferExpensesMonth(
  ids: string[],
  targetYear: number,
  targetMonth: number, // 1 to 12
  specificDate?: string
) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!ids || ids.length === 0) {
      return { error: 'No expenses selected.' };
    }

    if (specificDate) {
      const { error } = await supabase
        .from('petty_cash_expenses')
        .update({
          expense_date: specificDate,
          updated_by: user?.id,
          updated_at: new Date().toISOString()
        })
        .in('id', ids);

      if (error) {
        console.error('Error transferring expenses:', error);
        return { error: error.message };
      }
    } else {
      // Fetch each expense's current date so we can keep the day
      const { data: expenses, error: fetchError } = await supabase
        .from('petty_cash_expenses')
        .select('id, expense_date')
        .in('id', ids);

      if (fetchError || !expenses) {
        return { error: fetchError?.message || 'Failed to fetch selected expenses.' };
      }

      // Max days in the target month (targetMonth is 1-indexed: 1 = Jan, ..., 12 = Dec)
      const maxDaysInTargetMonth = new Date(targetYear, targetMonth, 0).getDate();

      for (const exp of expenses) {
        let day = 1;
        if (exp.expense_date) {
          const parts = exp.expense_date.split('-');
          if (parts.length === 3) {
            const origDay = parseInt(parts[2], 10);
            day = Math.min(origDay || 1, maxDaysInTargetMonth);
          }
        }
        const pad = (n: number) => n.toString().padStart(2, '0');
        const newDate = `${targetYear}-${pad(targetMonth)}-${pad(day)}`;

        const { error: updateErr } = await supabase
          .from('petty_cash_expenses')
          .update({
            expense_date: newDate,
            updated_by: user?.id,
            updated_at: new Date().toISOString()
          })
          .eq('id', exp.id);

        if (updateErr) {
          console.error(`Error updating expense ${exp.id}:`, updateErr);
        }
      }
    }

    revalidatePath('/petty-cash/dashboard');
    revalidatePath('/petty-cash/settlement');
    return { success: true };
  } catch (err: any) {
    console.error('Unexpected error in transferExpensesMonth:', err);
    return { error: err.message || 'Failed to transfer expenses' };
  }
}

export async function bulkUpdateExpenses(
  ids: string[],
  updates: {
    category_id?: string;
    employee_id?: string;
    project_id?: string;
    expense_date?: string;
  }
) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!ids || ids.length === 0) {
      return { error: 'No expenses selected.' };
    }

    const payload: any = {
      updated_by: user?.id,
      updated_at: new Date().toISOString()
    };

    if (updates.category_id) payload.category_id = updates.category_id;
    if (updates.employee_id) payload.employee_id = updates.employee_id;
    if (updates.project_id) payload.project_id = updates.project_id;
    if (updates.expense_date) payload.expense_date = updates.expense_date;

    const { error } = await supabase
      .from('petty_cash_expenses')
      .update(payload)
      .in('id', ids);

    if (error) {
      console.error('Error bulk updating expenses:', error);
      return { error: error.message };
    }

    revalidatePath('/petty-cash/dashboard');
    revalidatePath('/petty-cash/settlement');
    return { success: true };
  } catch (err: any) {
    console.error('Unexpected error in bulkUpdateExpenses:', err);
    return { error: err.message || 'Failed to bulk update expenses' };
  }
}

