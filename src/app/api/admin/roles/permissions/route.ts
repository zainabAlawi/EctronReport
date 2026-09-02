import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase-admin';

export async function POST(request: Request) {
  try {
    const { roles } = await request.json();
    if (!roles || !Array.isArray(roles)) {
      return NextResponse.json({ error: 'Invalid data' }, { status: 400 });
    }

    const supabase = createAdminClient();

    for (const role of roles) {
      if (role.name === 'Admin') continue; // Don't modify Admin defaults

      // Delete old permissions
      await supabase.from('role_permissions').delete().eq('role_id', role.id);
      
      // Insert new permissions
      if (role.permissions.length > 0) {
        const toInsert = role.permissions.map((permId: string) => ({
          role_id: role.id,
          permission_id: permId
        }));
        await supabase.from('role_permissions').insert(toInsert);
      }
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
