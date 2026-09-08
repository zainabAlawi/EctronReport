import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase-admin';

export async function GET() {
  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase.from('roles').select('*').order('name');
    if (error) throw error;
    return NextResponse.json({ roles: data });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { name, description } = await request.json();
    const supabase = createAdminClient();
    
    const { data, error } = await supabase
      .from('roles')
      .insert([{ name, description }])
      .select()
      .single();
      
    if (error) throw error;
    return NextResponse.json({ role: data });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const { id, name, description } = await request.json();
    const supabase = createAdminClient();
    
    const { data, error } = await supabase
      .from('roles')
      .update({ name, description })
      .eq('id', id)
      .select()
      .single();
      
    if (error) throw error;
    return NextResponse.json({ role: data });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) throw new Error('Missing ID');
    
    const supabase = createAdminClient();
    const { error } = await supabase.from('roles').delete().eq('id', id);
    if (error) throw error;
    
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
