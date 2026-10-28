import { NextRequest, NextResponse } from 'next/server';
import { createVisit } from '@/lib/visitorService';

// In-memory rate limiting map: ip -> { count, lastReset }
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_WINDOW_MS = 5 * 60 * 1000; // 5 minutes
const MAX_REQUESTS_PER_WINDOW = 15;

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);

  if (!entry || now > entry.resetTime) {
    rateLimitMap.set(ip, { count: 1, resetTime: now + RATE_LIMIT_WINDOW_MS });
    return true;
  }

  if (entry.count >= MAX_REQUESTS_PER_WINDOW) {
    return false;
  }

  entry.count++;
  return true;
}

export async function POST(req: NextRequest) {
  try {
    // 1. IP Rate Limiting
    const forwardedFor = req.headers.get('x-forwarded-for');
    const ip = forwardedFor ? forwardedFor.split(',')[0].trim() : 'anonymous';
    
    if (!checkRateLimit(ip)) {
      return NextResponse.json(
        { success: false, error: 'Too many registration requests. Please wait a few moments and try again.' },
        { status: 429 }
      );
    }

    const body = await req.json();

    // 2. Anti-Spam Honeypot check
    // If hidden 'company_website_url' honeypot field is filled, reject bot
    if (body.company_website_url) {
      return NextResponse.json({ success: true, visit_number: 'VIS-PROCESSED' });
    }

    // 3. Validation & Sanitization
    let organizationEn = (body.organization_en || '').trim();
    let organizationAr = (body.organization_ar || '').trim();
    const country = (body.country || 'Oman').trim();
    const coordinationBy = (body.coordination_by || 'Ectron').trim();
    const visitReason = (body.visit_reason || '').trim();
    const notes = (body.notes || '').trim();
    const rawVisitors = Array.isArray(body.visitors) ? body.visitors : [];
    const rawOrganizations = Array.isArray(body.organizations) ? body.organizations : [];

    if (!visitReason) {
      return NextResponse.json(
        { success: false, error: 'Visit reason is required.' },
        { status: 400 }
      );
    }

    // Check if structured organizations are passed
    if (rawOrganizations.length > 0) {
      const sanitizedOrgs = rawOrganizations
        .map((org: any) => ({
          organization_en: (org.organization_en || '').trim(),
          organization_ar: (org.organization_ar || '').trim(),
          visitors: (Array.isArray(org.visitors) ? org.visitors : [])
            .map((vis: any) => ({
              full_name_en: (vis.full_name_en || '').trim(),
              full_name_ar: (vis.full_name_ar || '').trim(),
              phone_number: (vis.phone_number || '').trim()
            }))
            .filter((vis: any) => vis.full_name_en || vis.full_name_ar)
        }))
        .filter((org: any) => (org.organization_en || org.organization_ar) && org.visitors.length > 0);

      const totalCount = sanitizedOrgs.reduce((acc: number, o: any) => acc + o.visitors.length, 0);
      if (sanitizedOrgs.length === 0 || totalCount === 0) {
        return NextResponse.json(
          { success: false, error: 'At least one organization with at least one visitor name must be provided.' },
          { status: 400 }
        );
      }

      const result = await createVisit({
        country: country,
        coordination_by: coordinationBy,
        visit_reason: visitReason,
        notes: notes,
        registration_source: 'public',
        organizations: sanitizedOrgs
      });

      if (!result.success || !result.visit) {
        return NextResponse.json(
          { success: false, error: result.error || 'Failed to complete registration.' },
          { status: 500 }
        );
      }

      return NextResponse.json(
        {
          success: true,
          visit_number: result.visit.visit_number,
          visit_date: result.visit.visit_date,
          time_in: result.visit.time_in
        },
        { status: 200 }
      );
    }

    if (!organizationEn && !organizationAr) {
      return NextResponse.json(
        { success: false, error: 'Organization name in English or Arabic is required.' },
        { status: 400 }
      );
    }

    // Filter valid visitors
    const sanitizedVisitors = rawVisitors
      .map((vis: any) => ({
        full_name_en: (vis.full_name_en || '').trim(),
        full_name_ar: (vis.full_name_ar || '').trim(),
        phone_number: (vis.phone_number || '').trim()
      }))
      .filter((vis: any) => vis.full_name_en || vis.full_name_ar);

    if (sanitizedVisitors.length === 0) {
      return NextResponse.json(
        { success: false, error: 'At least one visitor with a name must be provided.' },
        { status: 400 }
      );
    }

    // 4. Save visit and visitors
    const result = await createVisit({
      organization_en: organizationEn,
      organization_ar: organizationAr,
      country: country,
      coordination_by: coordinationBy,
      visit_reason: visitReason,
      notes: notes,
      registration_source: 'public',
      visitors: sanitizedVisitors
    });

    if (!result.success || !result.visit) {
      return NextResponse.json(
        { success: false, error: result.error || 'Failed to complete registration.' },
        { status: 500 }
      );
    }

    // 5. Secure Response: Return only the assigned visit number and confirmation, no internal IDs or data
    return NextResponse.json({
      success: true,
      visit_number: result.visit.visit_number,
      visit_date: result.visit.visit_date,
      time_in: result.visit.time_in,
      message: 'Registration completed successfully.'
    });

  } catch (error: any) {
    console.error('Public visitor registration error:', error);
    return NextResponse.json(
      { success: false, error: 'An unexpected error occurred during registration.' },
      { status: 500 }
    );
  }
}
