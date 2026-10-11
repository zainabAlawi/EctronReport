'use server';

import { createClient } from '@/lib/supabase-server';
import { revalidatePath } from 'next/cache';

export async function getFormData() {
  const supabase = await createClient();
  
  const [categoriesResp, profilesResp, projectsResp] = await Promise.all([
    supabase.from('petty_cash_categories').select('id, name').eq('active', true).order('name'),
    supabase.from('profiles').select('id, full_name, username').eq('is_active', true).order('full_name'),
    supabase.from('projects').select('id, name').eq('active', true).order('name')
  ]);

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
    profiles: profilesResp.data || [],
    projects: projectsResp.data || [],
    nextExpenseNo
  };
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
  const project_id = formData.get('project_id') as string || null;
  
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
  const project_id = formData.get('project_id') as string || null;

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
