import { NextResponse } from 'next/server';
import * as xlsx from 'xlsx';

export async function GET() {
  const ws = xlsx.utils.json_to_sheet([
    {
      username: 'ahmed01',
      password: 'password123',
      name: 'Ahmed Ali',
      user_type: 'Employee'
    },
    {
      username: 'sara02',
      password: 'password123',
      name: 'Sara Mohammed',
      user_type: 'Manager'
    }
  ]);
  
  const wb = xlsx.utils.book_new();
  xlsx.utils.book_append_sheet(wb, ws, 'Users Template');
  
  const buffer = xlsx.write(wb, { type: 'buffer', bookType: 'xlsx' });
  
  return new NextResponse(buffer, {
    headers: {
      'Content-Disposition': 'attachment; filename="users_template.xlsx"',
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    }
  });
}
