import ExcelJS from 'exceljs';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import JSZip from 'jszip';
import { PettyCashBatch } from '@/app/(dashboard)/petty-cash/actions/batchesActions';

const MONTH_NAMES_EN = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

function formatDateDot(dateStr?: string): string {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    // YYYY-MM-DD -> DD.MM.YYYY (matches official template e.g. 14.07.2026)
    return `${parts[2]}.${parts[1]}.${parts[0]}`;
  }
  return dateStr;
}

function sanitizeFileName(name: string): string {
  return name.replace(/[^a-zA-Z0-9_\-\u0600-\u06FF ]/g, '').trim().replace(/\s+/g, '_');
}

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

/**
 * Generates the official ECTRON Petty Cash Accounts Report (.xlsx)
 * Columns:
 * A: Expense No
 * B: Date
 * C: Request Description
 * D: Category
 * E: Amount
 * F: Project Name
 */
export async function generateAccountsReportBuffer(
  batch: PettyCashBatch,
  orderedInvoices: any[]
): Promise<ArrayBuffer> {
  const wb = new ExcelJS.Workbook();
  wb.creator = 'ECTRON Reporting System';
  wb.created = new Date();

  const ws = wb.addWorksheet('Sheet1', {
    views: [{ showGridLines: true }]
  });

  // Set official column widths for Columns A..F
  ws.columns = [
    { key: 'expense_no', width: 15 },          // Column A: Expense No
    { key: 'date', width: 14 },                // Column B: Date
    { key: 'description', width: 34 },         // Column C: Request Description
    { key: 'category', width: 22 },            // Column D: Category
    { key: 'amount', width: 15 },              // Column E: Amount
    { key: 'project', width: 36 },             // Column F: Project Name
  ];

  const monthLabel = `${MONTH_NAMES_EN[(batch.month || 1) - 1] || 'Month'} ${batch.year}`;

  // Row 3: Batch / Period subtitle in Col F
  const row3 = ws.getRow(3);
  row3.height = 21;
  const c3F = row3.getCell(6);
  c3F.value = batch.name;
  c3F.font = { name: 'Tahoma', size: 11, bold: true };
  c3F.alignment = { horizontal: 'center', vertical: 'middle' };

  // Row 4: Title Banner (Petty Cash Voucher - <Batch / Month>) & PCV No
  const row4 = ws.getRow(4);
  row4.height = 20;
  ws.mergeCells('A4:C4');
  const titleCell = row4.getCell(1);
  titleCell.value = ` Petty Cash Voucher - ${batch.name} (${monthLabel}) `;
  titleCell.font = { name: 'Trebuchet MS', size: 12, bold: true, color: { argb: 'FF0070C0' } };
  titleCell.alignment = { horizontal: 'left', vertical: 'middle' };

  for (let c = 1; c <= 6; c++) {
    row4.getCell(c).border = {
      top: { style: 'hair' },
      bottom: { style: 'hair' },
      left: { style: 'hair' },
      right: { style: 'hair' }
    };
  }

  const pcvCell = row4.getCell(6);
  pcvCell.value = batch.pcvNo ? `PCV No: ${batch.pcvNo}` : 'PCV No     ';
  pcvCell.font = { name: 'Trebuchet MS', size: 10, bold: Boolean(batch.pcvNo) };
  pcvCell.alignment = { horizontal: 'center', vertical: 'middle' };

  // Row 6: Table Headers (A..F)
  const row6 = ws.getRow(6);
  row6.height = 18;
  const headers = [
    'Expense No',
    'Date',
    'Request Description',
    'Category',
    'Amount',
    'Project Name'
  ];

  const thinBorder: Partial<ExcelJS.Borders> = {
    top: { style: 'thin', color: { argb: 'FF000000' } },
    bottom: { style: 'thin', color: { argb: 'FF000000' } },
    left: { style: 'thin', color: { argb: 'FF000000' } },
    right: { style: 'thin', color: { argb: 'FF000000' } }
  };

  headers.forEach((h, idx) => {
    const cell = row6.getCell(idx + 1);
    cell.value = h;
    cell.font = { name: 'Trebuchet MS', size: 10, bold: true };
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFB8CCE4' } // Official template header light blue
    };
    cell.border = thinBorder;
    cell.alignment = { horizontal: 'center', vertical: 'middle' };
  });

  // Data Rows starting at Row 7
  const startRow = 7;
  let totalSpent = 0;

  orderedInvoices.forEach((exp, index) => {
    const rNum = startRow + index;
    const row = ws.getRow(rNum);
    row.height = 16;

    const amt = Number(exp.amount || 0);
    totalSpent += amt;

    const cA = row.getCell(1);
    cA.value = exp.expense_no || String(index + 1).padStart(3, '0');
    cA.font = { name: 'Trebuchet MS', size: 10 };
    cA.alignment = { horizontal: 'center', vertical: 'middle' };
    cA.border = thinBorder;

    const cB = row.getCell(2);
    cB.value = formatDateDot(exp.expense_date);
    cB.font = { name: 'Trebuchet MS', size: 10 };
    cB.alignment = { horizontal: 'center', vertical: 'middle' };
    cB.border = thinBorder;

    const cC = row.getCell(3);
    cC.value = exp.request_description || '';
    cC.font = { name: 'Trebuchet MS', size: 10 };
    cC.alignment = { horizontal: 'left', vertical: 'middle', wrapText: true };
    cC.border = thinBorder;

    const cD = row.getCell(4);
    cD.value = exp.petty_cash_categories?.name || 'General';
    cD.font = { name: 'Trebuchet MS', size: 10 };
    cD.alignment = { horizontal: 'center', vertical: 'middle' };
    cD.border = thinBorder;

    const cE = row.getCell(5);
    cE.value = amt;
    cE.numFmt = '0.000';
    cE.font = { name: 'Trebuchet MS', size: 10, bold: true };
    cE.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFFFFF00' } // Official yellow highlight for Amount column
    };
    cE.alignment = { horizontal: 'center', vertical: 'middle' };
    cE.border = thinBorder;

    const cF = row.getCell(6);
    cF.value = exp.projects?.name || 'HEAD OFFICE';
    cF.font = { name: 'Trebuchet MS', size: 10 };
    cF.alignment = { horizontal: 'left', vertical: 'middle' };
    cF.border = thinBorder;
  });

  const lastDataRow = Math.max(startRow, startRow + orderedInvoices.length - 1);

  // Leave 3 blank rows before footer summary (just like template row 51 -> 55)
  const totalSpentRowIdx = lastDataRow + 4;
  const scrapRowIdx = totalSpentRowIdx + 1;
  const receivedRowIdx = totalSpentRowIdx + 2;
  const extraPaidRowIdx = totalSpentRowIdx + 3;
  const availableCashRowIdx = totalSpentRowIdx + 4;
  const newRequiredRowIdx = totalSpentRowIdx + 5;
  const totalTransferRowIdx = totalSpentRowIdx + 6;
  const sigDotsRowIdx = totalSpentRowIdx + 7;
  const sigLabelsRowIdx = totalSpentRowIdx + 8;

  const advanceAmt = batch.advanceAmount ?? 1000;

  // Helper to style merged summary rows (A..D merged for label, E for value/formula, F bordered)
  const buildSummaryRow = (
    rowIdx: number,
    label: string,
    valOrFormula: number | { formula: string; result?: number } | null,
    opts?: {
      labelAlign?: 'center' | 'right';
      labelFillArgb?: string;
      valFillArgb?: string;
      numFmt?: string;
      fontSize?: number;
    }
  ) => {
    const r = ws.getRow(rowIdx);
    r.height = 17;
    ws.mergeCells(`A${rowIdx}:D${rowIdx}`);

    for (let c = 1; c <= 4; c++) {
      const cell = r.getCell(c);
      if (c === 1) cell.value = label;
      cell.font = { name: 'Tahoma', size: opts?.fontSize || 10 };
      cell.alignment = { horizontal: opts?.labelAlign || 'center', vertical: 'middle' };
      if (opts?.labelFillArgb) {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: opts.labelFillArgb } };
      }
      cell.border = thinBorder;
    }

    const valCell = r.getCell(5);
    valCell.value = valOrFormula as any;
    valCell.font = { name: 'Trebuchet MS', size: 10, bold: true };
    valCell.alignment = { horizontal: 'center', vertical: 'middle' };
    valCell.numFmt = opts?.numFmt || '0.000';
    if (opts?.valFillArgb) {
      valCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: opts.valFillArgb } };
    }
    valCell.border = thinBorder;

    const endCell = r.getCell(6);
    endCell.border = thinBorder;
  };

  // 1. Total Spent OMR (Formula in Column E)
  buildSummaryRow(
    totalSpentRowIdx,
    'Total Spent OMR    ',
    orderedInvoices.length > 0
      ? { formula: `SUM(E${startRow}:E${lastDataRow})`, result: Number(totalSpent.toFixed(3)) }
      : 0,
    { fontSize: 11 }
  );

  // 2. scrap selling cash <year>
  buildSummaryRow(scrapRowIdx, `scrap selling cash ${batch.year}`, null, { fontSize: 10 });

  // 3. Received in advance OMR
  buildSummaryRow(receivedRowIdx, 'Received in advance OMR    ', advanceAmt, {
    fontSize: 11,
    valFillArgb: 'FFD99594'
  });

  // 4. Extra amount paid OMR
  buildSummaryRow(extraPaidRowIdx, 'Extra amount paid OMR    ', null, { fontSize: 11 });

  // 5. Amount Available in Cash OMR
  buildSummaryRow(
    availableCashRowIdx,
    'Amount Available in Cash OMR    ',
    {
      formula: `E${receivedRowIdx}+E${scrapRowIdx}-E${totalSpentRowIdx}`,
      result: Number((advanceAmt - totalSpent).toFixed(3))
    },
    { fontSize: 11 }
  );

  // 6. New amount required for current month OMR
  buildSummaryRow(newRequiredRowIdx, 'New amount required for current month OMR', advanceAmt, {
    labelAlign: 'right',
    labelFillArgb: 'FFE5DFEC',
    numFmt: '0'
  });

  // 7. Total amount to be transfer to Ectron OMR
  buildSummaryRow(totalTransferRowIdx, 'Total amount to be transfer to Ectron OMR', advanceAmt, {
    labelAlign: 'right',
    labelFillArgb: 'FFE5DFEC',
    valFillArgb: 'FFCCC0DA',
    numFmt: '0'
  });

  // 8. Signature Dots & Labels
  const rDots = ws.getRow(sigDotsRowIdx);
  rDots.height = 18;
  ws.mergeCells(`A${sigDotsRowIdx}:B${sigDotsRowIdx}`);
  ws.mergeCells(`C${sigDotsRowIdx}:D${sigDotsRowIdx}`);
  ws.mergeCells(`E${sigDotsRowIdx}:F${sigDotsRowIdx}`);
  [1, 3, 5].forEach(c => {
    const cell = rDots.getCell(c);
    cell.value = '………………………';
    cell.font = { name: 'Trebuchet MS', size: 8 };
    cell.alignment = { horizontal: 'center', vertical: 'bottom' };
  });

  const rSigs = ws.getRow(sigLabelsRowIdx);
  rSigs.height = 18;
  ws.mergeCells(`A${sigLabelsRowIdx}:B${sigLabelsRowIdx}`);
  ws.mergeCells(`C${sigLabelsRowIdx}:D${sigLabelsRowIdx}`);
  ws.mergeCells(`E${sigLabelsRowIdx}:F${sigLabelsRowIdx}`);

  const sig1 = rSigs.getCell(1);
  sig1.value = 'Prepared By ';
  sig1.font = { name: 'Trebuchet MS', size: 10, bold: true };
  sig1.alignment = { horizontal: 'center', vertical: 'top' };

  const sig2 = rSigs.getCell(3);
  sig2.value = ' Approved By';
  sig2.font = { name: 'Trebuchet MS', size: 10, bold: true };
  sig2.alignment = { horizontal: 'center', vertical: 'top' };

  const sig3 = rSigs.getCell(5);
  sig3.value = 'Received By  ';
  sig3.font = { name: 'Trebuchet MS', size: 10, bold: true };
  sig3.alignment = { horizontal: 'center', vertical: 'top' };

  return await wb.xlsx.writeBuffer();
}

/**
 * Helper to convert an image blob/buffer into PNG/JPEG bytes via browser canvas if needed
 */
async function fetchImageAsPngBytes(url: string): Promise<Uint8Array | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth || img.width || 800;
        canvas.height = img.naturalHeight || img.height || 1000;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(null);
          return;
        }
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0);
        canvas.toBlob(async (blob) => {
          if (!blob) {
            resolve(null);
            return;
          }
          const buf = await blob.arrayBuffer();
          resolve(new Uint8Array(buf));
        }, 'image/jpeg', 0.92);
      } catch {
        resolve(null);
      }
    };
    img.onerror = () => resolve(null);
    img.src = url;
  });
}

/**
 * Generates one Merged PDF containing all invoice attachments in the selected order.
 */
export async function generateMergedPdfBuffer(
  batch: PettyCashBatch,
  orderedInvoices: any[]
): Promise<{ pdfBytes: Uint8Array; attachedCount: number }> {
  const mergedPdf = await PDFDocument.create();
  const fontBold = await mergedPdf.embedFont(StandardFonts.HelveticaBold);
  const fontRegular = await mergedPdf.embedFont(StandardFonts.Helvetica);

  let attachedCount = 0;

  for (let i = 0; i < orderedInvoices.length; i++) {
    const exp = orderedInvoices[i];
    const url: string | undefined = exp.attachment_url;
    if (!url) continue;

    try {
      const response = await fetch(url);
      if (!response.ok) continue;

      const contentType = (response.headers.get('content-type') || '').toLowerCase();
      const cleanUrl = url.split('?')[0].toLowerCase();
      const arrayBuffer = await response.arrayBuffer();
      const bytes = new Uint8Array(arrayBuffer);

      const stampText = `#${String(i + 1).padStart(3, '0')} | ${exp.expense_no || ''} | ${formatDateDot(exp.expense_date)} | OMR ${Number(exp.amount || 0).toFixed(3)}`;

      if (contentType.includes('pdf') || cleanUrl.endsWith('.pdf')) {
        const srcPdf = await PDFDocument.load(bytes, { ignoreEncryption: true });
        const copiedPages = await mergedPdf.copyPages(srcPdf, srcPdf.getPageIndices());
        copiedPages.forEach((page, pageIdx) => {
          if (pageIdx === 0) {
            const { width, height } = page.getSize();
            page.drawRectangle({
              x: 12,
              y: height - 26,
              width: Math.min(width - 24, 340),
              height: 18,
              color: rgb(0.06, 0.46, 0.43),
              opacity: 0.9
            });
            page.drawText(stampText, {
              x: 18,
              y: height - 20,
              size: 8.5,
              font: fontBold,
              color: rgb(1, 1, 1)
            });
          }
          mergedPdf.addPage(page);
        });
        attachedCount++;
      } else {
        // Image attachment (JPG, PNG, WEBP, etc.)
        let embeddedImg: any = null;
        if (contentType.includes('png') || cleanUrl.endsWith('.png')) {
          try {
            embeddedImg = await mergedPdf.embedPng(bytes);
          } catch {}
        } else if (
          contentType.includes('jpeg') ||
          contentType.includes('jpg') ||
          cleanUrl.endsWith('.jpg') ||
          cleanUrl.endsWith('.jpeg')
        ) {
          try {
            embeddedImg = await mergedPdf.embedJpg(bytes);
          } catch {}
        }

        if (!embeddedImg) {
          const convertedJpg = await fetchImageAsPngBytes(url);
          if (convertedJpg) {
            embeddedImg = await mergedPdf.embedJpg(convertedJpg);
          }
        }

        if (embeddedImg) {
          const pageWidth = 595.28; // A4 width
          const pageHeight = 841.89; // A4 height
          const page = mergedPdf.addPage([pageWidth, pageHeight]);

          // Header banner on top of the A4 attachment page
          page.drawRectangle({
            x: 24,
            y: pageHeight - 52,
            width: pageWidth - 48,
            height: 32,
            color: rgb(0.09, 0.23, 0.39)
          });

          page.drawText(stampText, {
            x: 34,
            y: pageHeight - 36,
            size: 10,
            font: fontBold,
            color: rgb(1, 1, 1)
          });

          const descSafe = String(exp.request_description || '').replace(/[^\x20-\x7E]/g, '').slice(0, 60);
          if (descSafe) {
            page.drawText(descSafe, {
              x: 34,
              y: pageHeight - 47,
              size: 8,
              font: fontRegular,
              color: rgb(0.8, 0.95, 0.92)
            });
          }

          // Fit image inside A4 margin box
          const maxW = pageWidth - 48;
          const maxH = pageHeight - 90;
          const imgDims = embeddedImg.scale(1);
          const scale = Math.min(maxW / imgDims.width, maxH / imgDims.height, 1);
          const drawW = imgDims.width * scale;
          const drawH = imgDims.height * scale;

          const x = (pageWidth - drawW) / 2;
          const y = (pageHeight - 60 - drawH) / 2 + 12;

          page.drawImage(embeddedImg, {
            x,
            y,
            width: drawW,
            height: drawH
          });
          attachedCount++;
        }
      }
    } catch (err) {
      console.error('Error merging attachment for expense', exp.expense_no, err);
    }
  }

  // If no attachments were found/embedded, add a clean summary page so the PDF is still valid
  if (mergedPdf.getPageCount() === 0) {
    const page = mergedPdf.addPage([595.28, 841.89]);
    page.drawText(`ECTRON Petty Cash Batch: ${batch.name}`, {
      x: 50,
      y: 780,
      size: 16,
      font: fontBold,
      color: rgb(0.09, 0.23, 0.39)
    });
    page.drawText(`No uploaded file attachments were found for the ${orderedInvoices.length} invoice(s) in this batch.`, {
      x: 50,
      y: 750,
      size: 11,
      font: fontRegular,
      color: rgb(0.3, 0.35, 0.4)
    });
  }

  const pdfBytes = await mergedPdf.save();
  return { pdfBytes, attachedCount };
}

export async function exportBatchAccountsReport(batch: PettyCashBatch, orderedInvoices: any[]) {
  const buffer = await generateAccountsReportBuffer(batch, orderedInvoices);
  const safeName = sanitizeFileName(batch.name) || 'Batch';
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  });
  triggerDownload(blob, `ECTRON_Accounts_Report_${safeName}.xlsx`);
}

export async function exportBatchMergedPdf(batch: PettyCashBatch, orderedInvoices: any[]) {
  const { pdfBytes, attachedCount } = await generateMergedPdfBuffer(batch, orderedInvoices);
  const safeName = sanitizeFileName(batch.name) || 'Batch';
  const blob = new Blob([pdfBytes as any], { type: 'application/pdf' });
  triggerDownload(blob, `ECTRON_Merged_Attachments_${safeName}.pdf`);
  return { attachedCount };
}

export async function exportBatchZipPackage(batch: PettyCashBatch, orderedInvoices: any[]) {
  const safeName = sanitizeFileName(batch.name) || 'Batch';
  const [excelBuffer, { pdfBytes, attachedCount }] = await Promise.all([
    generateAccountsReportBuffer(batch, orderedInvoices),
    generateMergedPdfBuffer(batch, orderedInvoices)
  ]);

  const zip = new JSZip();
  zip.file(`ECTRON_Accounts_Report_${safeName}.xlsx`, excelBuffer);
  zip.file(`ECTRON_Merged_Attachments_${safeName}.pdf`, pdfBytes);

  const zipBlob = await zip.generateAsync({ type: 'blob' });
  triggerDownload(zipBlob, `ECTRON_PettyCash_${safeName}_Package.zip`);
  return { attachedCount };
}
