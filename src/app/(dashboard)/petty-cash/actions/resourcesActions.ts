'use server';

import { createClient } from '@/lib/supabase-server';
import { revalidatePath } from 'next/cache';
import fs from 'fs/promises';
import path from 'path';

const SETTINGS_FILE = path.join(process.cwd(), 'src', 'data', 'petty-cash-settings.json');

async function readSettings() {
  try {
    const content = await fs.readFile(SETTINGS_FILE, 'utf-8');
    return JSON.parse(content);
  } catch (err) {
    return {
      allowedEmployeeIds: [
        '715e9fae-9b70-4c72-b644-bf0555e8ba49',
        '5e21389a-01d3-4603-99c7-36e4664e07ce',
        'aa7ec15f-64cd-4117-8611-9b9f1195ebe2',
        'e836d78d-b9d3-4a87-8128-c2d35ce2da86'
      ],
      recurringDescriptions: [
        { id: 'desc-1', text: 'Office Stationery and Supplies' },
        { id: 'desc-2', text: 'Fuel for Factory & Site Vehicles' },
        { id: 'desc-3', text: 'Hospitality & Refreshments for Guests' },
        { id: 'desc-4', text: 'Facility Maintenance and Repair' },
        { id: 'desc-5', text: 'Cleaning & Pantry Supplies' },
        { id: 'desc-6', text: 'Courier & Document Delivery' },
        { id: 'desc-7', text: 'Small Tools and Consumables' },
        { id: 'desc-8', text: 'IT & Electrical Supplies' }
      ]
    };
  }
}

async function saveSettings(settings: any) {
  try {
    const dir = path.dirname(SETTINGS_FILE);
    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(SETTINGS_FILE, JSON.stringify(settings, null, 2), 'utf-8');
    return true;
  } catch (err) {
    console.error('Error saving petty cash settings:', err);
    return false;
  }
}

/* ========================================================================= */
/* 1. PROJECTS CRUD                                                          */
/* ========================================================================= */

export async function getProjects() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .order('name');
  if (error) console.error('Error fetching projects:', error);
  return data || [];
}

export async function createProject(name: string) {
  if (!name || !name.trim()) return { error: 'Project name is required' };
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('projects')
    .insert([{ name: name.trim() }])
    .select();
  if (error) return { error: error.message };

  revalidatePath('/petty-cash/resources');
  revalidatePath('/petty-cash/dashboard');
  return { success: true, data };
}

export async function updateProject(id: string, name: string) {
  if (!name || !name.trim()) return { error: 'Project name is required' };
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('projects')
    .update({ name: name.trim() })
    .eq('id', id)
    .select();
  if (error) return { error: error.message };

  revalidatePath('/petty-cash/resources');
  revalidatePath('/petty-cash/dashboard');
  return { success: true, data };
}

export async function deleteProject(id: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from('projects')
    .delete()
    .eq('id', id);
  if (error) return { error: error.message };

  revalidatePath('/petty-cash/resources');
  revalidatePath('/petty-cash/dashboard');
  return { success: true };
}

/* ========================================================================= */
/* 2. CATEGORIES CRUD                                                        */
/* ========================================================================= */

export async function getCategories() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('petty_cash_categories')
    .select('*')
    .order('name');
  if (error) console.error('Error fetching categories:', error);
  return data || [];
}

export async function createCategory(name: string) {
  if (!name || !name.trim()) return { error: 'Category name is required' };
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('petty_cash_categories')
    .insert([{ name: name.trim() }])
    .select();
  if (error) return { error: error.message };

  revalidatePath('/petty-cash/resources');
  revalidatePath('/petty-cash/dashboard');
  return { success: true, data };
}

export async function updateCategory(id: string, name: string) {
  if (!name || !name.trim()) return { error: 'Category name is required' };
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('petty_cash_categories')
    .update({ name: name.trim() })
    .eq('id', id)
    .select();
  if (error) return { error: error.message };

  revalidatePath('/petty-cash/resources');
  revalidatePath('/petty-cash/dashboard');
  return { success: true, data };
}

export async function deleteCategory(id: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from('petty_cash_categories')
    .delete()
    .eq('id', id);
  if (error) return { error: error.message };

  revalidatePath('/petty-cash/resources');
  revalidatePath('/petty-cash/dashboard');
  return { success: true };
}

/* ========================================================================= */
/* 3. EMPLOYEES SELECTION FOR PETTY CASH                                     */
/* ========================================================================= */

export async function getAllEmployeesWithStatus() {
  const supabase = await createClient();
  const settings = await readSettings();
  const allowedSet = new Set(settings.allowedEmployeeIds || []);

  const { data: profiles, error } = await supabase
    .from('profiles')
    .select('id, full_name, username, is_active')
    .order('full_name');

  if (error) console.error('Error fetching profiles:', error);

  return (profiles || []).map(p => ({
    ...p,
    displayName: p.full_name || p.username,
    isPettyCashAllowed: allowedSet.has(p.id)
  }));
}

export async function toggleEmployeeAllowed(profileId: string) {
  const settings = await readSettings();
  let allowed = settings.allowedEmployeeIds || [];
  
  if (allowed.includes(profileId)) {
    allowed = allowed.filter((id: string) => id !== profileId);
  } else {
    allowed.push(profileId);
  }

  settings.allowedEmployeeIds = allowed;
  await saveSettings(settings);

  revalidatePath('/petty-cash/resources');
  revalidatePath('/petty-cash/dashboard');
  return { success: true, allowed };
}

export async function updateEmployeeName(profileId: string, newName: string) {
  if (!newName || !newName.trim()) return { error: 'Employee name is required' };
  const supabase = await createClient();
  const { error } = await supabase
    .from('profiles')
    .update({ full_name: newName.trim() })
    .eq('id', profileId);

  if (error) return { error: error.message };

  revalidatePath('/petty-cash/resources');
  revalidatePath('/petty-cash/dashboard');
  return { success: true };
}

/* ========================================================================= */
/* 4. RECURRING REQUEST DESCRIPTIONS                                         */
/* ========================================================================= */

export async function getRecurringDescriptions() {
  const settings = await readSettings();
  return settings.recurringDescriptions || [];
}

export async function addRecurringDescription(text: string) {
  if (!text || !text.trim()) return { error: 'Description text is required' };
  const settings = await readSettings();
  const list = settings.recurringDescriptions || [];
  
  const newItem = {
    id: `desc-${Date.now()}`,
    text: text.trim()
  };

  list.push(newItem);
  settings.recurringDescriptions = list;
  await saveSettings(settings);

  revalidatePath('/petty-cash/resources');
  revalidatePath('/petty-cash/dashboard');
  return { success: true, item: newItem };
}

export async function updateRecurringDescription(id: string, text: string) {
  if (!text || !text.trim()) return { error: 'Description text is required' };
  const settings = await readSettings();
  const list = settings.recurringDescriptions || [];

  const index = list.findIndex((item: any) => item.id === id);
  if (index === -1) return { error: 'Item not found' };

  list[index].text = text.trim();
  settings.recurringDescriptions = list;
  await saveSettings(settings);

  revalidatePath('/petty-cash/resources');
  revalidatePath('/petty-cash/dashboard');
  return { success: true, item: list[index] };
}

export async function deleteRecurringDescription(id: string) {
  const settings = await readSettings();
  let list = settings.recurringDescriptions || [];
  list = list.filter((item: any) => item.id !== id);

  settings.recurringDescriptions = list;
  await saveSettings(settings);

  revalidatePath('/petty-cash/resources');
  revalidatePath('/petty-cash/dashboard');
  return { success: true };
}
