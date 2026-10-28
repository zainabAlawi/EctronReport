import ExcelJS from 'exceljs';
import { VisitRecord } from './visitorTypes';

function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

// 1. Export Visits List to Excel
export async function exportVisitsListToExcel(visits: VisitRecord[], filename = 'ECTRON_Visits_List.xlsx') {
  const wb = new ExcelJS.Workbook();
  wb.creator = 'ECTRON Smart Factory';
  wb.created = new Date();

  const ws = wb.addWorksheet('Visits Summary', {
    views: [{ showGridLines: true }]
  });

  // Title Banner
  ws.mergeCells('A1:I1');
  const titleCell = ws.getCell('A1');
  titleCell.value = 'ECTRON SMART FACTORY — VISITOR MANAGEMENT REPORT';
  titleCell.font = { name: 'Calibri', size: 14, bold: true, color: { argb: 'FFFFFFFF' } };
  titleCell.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF173B63' } // ECTRON Navy
  };
  titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
  ws.getRow(1).height = 34;

  // Subtitle / Date Generated
  ws.mergeCells('A2:I2');
  const subCell = ws.getCell('A2');
  subCell.value = `Generated on: ${new Date().toLocaleDateString('en-GB')} | Total Visits: ${visits.length}`;
  subCell.font = { name: 'Calibri', size: 10, italic: true, color: { argb: 'FF0F766E' } };
  subCell.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFF0FDFA' }
  };
  subCell.alignment = { horizontal: 'center', vertical: 'middle' };
  ws.getRow(2).height = 20;

  // Header Row
  const headers = [
    'Visit ID',
    'Date',
    'Time In',
    'Time Out',
    'Organization (EN)',
    'Organization (AR)',
    'Country',
    'Coordination by (عن طريق)',
    'Visit Reason',
    'Visitors Count',
    'Visitor Names',
    'Registration Source'
  ];

  const headerRow = ws.addRow(headers);
  headerRow.height = 26;
  headerRow.eachCell((cell) => {
    cell.font = { name: 'Calibri', size: 11, bold: true, color: { argb: 'FFFFFFFF' } };
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF0F766E' } // Teal accent
    };
    cell.alignment = { horizontal: 'center', vertical: 'middle' };
    cell.border = {
      top: { style: 'thin', color: { argb: 'FFCCCCCC' } },
      bottom: { style: 'medium', color: { argb: 'FF173B63' } },
      left: { style: 'thin', color: { argb: 'FFCCCCCC' } },
      right: { style: 'thin', color: { argb: 'FFCCCCCC' } }
    };
  });

  // Data Rows
  visits.forEach((v, index) => {
    let visitorNames = '';
    if (v.organizations && v.organizations.length > 0) {
      visitorNames = v.organizations
        .map(org => {
          const orgName = org.organization_ar || org.organization_en || 'مؤسسة';
          const names = (org.visitors || [])
            .map(vis => vis.full_name_ar || vis.full_name_en || '')
            .filter(Boolean)
            .join(', ');
          return `[${orgName}]: ${names || '-'}`;
        })
        .join(' | ');
    } else {
      visitorNames = (v.visitors || [])
        .map(vis => vis.full_name_ar || vis.full_name_en || '')
        .filter(Boolean)
        .join(', ');
    }

    const row = ws.addRow([
      v.visit_number,
      v.visit_date,
      v.time_in,
      v.time_out || '-',
      v.organization_en || '-',
      v.organization_ar || '-',
      v.country || 'Oman',
      v.coordination_by || 'Ectron',
      v.visit_reason || '-',
      (v.visitors || []).length || 1,
      visitorNames || '-',
      v.registration_source.toUpperCase()
    ]);

    row.height = 22;
    const isEven = index % 2 === 0;
    row.eachCell((cell, colNumber) => {
      cell.font = { name: 'Calibri', size: 10 };
      cell.alignment = {
        vertical: 'middle',
        horizontal: [1, 2, 3, 4, 7, 8, 10, 12].includes(colNumber) ? 'center' : 'left'
      };
      if (isEven) {
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFF8FAFC' }
        };
      }
      cell.border = {
        top: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        right: { style: 'thin', color: { argb: 'FFE2E8F0' } }
      };
    });
  });

  // Column Widths
  ws.columns = [
    { width: 16 }, // Visit ID
    { width: 14 }, // Date
    { width: 12 }, // Time In
    { width: 12 }, // Time Out
    { width: 28 }, // Org EN
    { width: 28 }, // Org AR
    { width: 14 }, // Country
    { width: 22 }, // Coordination By
    { width: 24 }, // Reason
    { width: 14 }, // Count
    { width: 32 }, // Names
    { width: 18 }  // Source
  ];

  const buffer = await wb.xlsx.writeBuffer();
  triggerDownload(new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }), filename);
}

// 2. Export Detailed Visitors List to Excel (One row per individual visitor)
export async function exportDetailedVisitorsToExcel(visits: VisitRecord[], filename = 'ECTRON_Detailed_Visitors.xlsx') {
  const wb = new ExcelJS.Workbook();
  wb.creator = 'ECTRON Smart Factory';
  wb.created = new Date();

  const ws = wb.addWorksheet('Visitors Directory', {
    views: [{ showGridLines: true }]
  });

  // Title Banner
  ws.mergeCells('A1:J1');
  const titleCell = ws.getCell('A1');
  titleCell.value = 'ECTRON SMART FACTORY — DETAILED VISITOR DIRECTORY';
  titleCell.font = { name: 'Calibri', size: 14, bold: true, color: { argb: 'FFFFFFFF' } };
  titleCell.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF173B63' }
  };
  titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
  ws.getRow(1).height = 34;

  // Header Row
  const headers = [
    'Visit ID',
    'Visit Date',
    'Visitor Name (EN)',
    'Visitor Name (AR)',
    'Phone Number',
    'Organization (EN)',
    'Organization (AR)',
    'Country',
    'Coordination by (عن طريق)',
    'Visit Reason',
    'Source'
  ];

  const headerRow = ws.addRow(headers);
  headerRow.height = 26;
  headerRow.eachCell((cell) => {
    cell.font = { name: 'Calibri', size: 11, bold: true, color: { argb: 'FFFFFFFF' } };
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF0F766E' }
    };
    cell.alignment = { horizontal: 'center', vertical: 'middle' };
    cell.border = {
      bottom: { style: 'medium', color: { argb: 'FF173B63' } }
    };
  });

  let rowIndex = 0;
  visits.forEach(v => {
    const list = v.visitors && v.visitors.length > 0 ? v.visitors : [{ full_name_en: '-', full_name_ar: '-', phone_number: '-' }];
    list.forEach(vis => {
      rowIndex++;
      const row = ws.addRow([
        v.visit_number,
        v.visit_date,
        vis.full_name_en || '-',
        vis.full_name_ar || '-',
        vis.phone_number || '-',
        vis.organization_en || v.organization_en || '-',
        vis.organization_ar || v.organization_ar || '-',
        v.country || 'Oman',
        v.coordination_by || 'Ectron',
        v.visit_reason || '-',
        v.registration_source.toUpperCase()
      ]);

      row.height = 22;
      const isEven = rowIndex % 2 === 0;
      row.eachCell((cell, colNumber) => {
        cell.font = { name: 'Calibri', size: 10 };
        cell.alignment = {
          vertical: 'middle',
          horizontal: [1, 2, 5, 8, 9, 11].includes(colNumber) ? 'center' : 'left'
        };
        if (isEven) {
          cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFF8FAFC' }
          };
        }
        cell.border = {
          top: { style: 'thin', color: { argb: 'FFE2E8F0' } },
          bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
          left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
          right: { style: 'thin', color: { argb: 'FFE2E8F0' } }
        };
      });
    });
  });

  ws.columns = [
    { width: 16 }, // Visit ID
    { width: 14 }, // Date
    { width: 24 }, // Visitor Name EN
    { width: 24 }, // Visitor Name AR
    { width: 18 }, // Phone
    { width: 26 }, // Org EN
    { width: 26 }, // Org AR
    { width: 14 }, // Country
    { width: 22 }, // Coordination by
    { width: 22 }, // Reason
    { width: 14 }  // Source
  ];

  const buffer = await wb.xlsx.writeBuffer();
  triggerDownload(new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }), filename);
}

// 3. Print / PDF Export
export function printVisitsReport() {
  window.print();
}
