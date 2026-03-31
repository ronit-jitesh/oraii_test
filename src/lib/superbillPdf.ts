/**
 * Superbill PDF Generator
 * Generates CMS-1500-style superbill PDFs using browser APIs (no dependencies)
 */

interface PdfBillCPT {
    code: string;
    description: string;
    fee: number;
}

interface PdfBillICD10 {
    code: string;
    description: string;
}

interface SuperbillPdfData {
    patientName: string;
    serviceDate: string;
    cptCodes: PdfBillCPT[];
    icd10Codes: PdfBillICD10[];
    totalFee: number;
    providerName?: string;
    providerNpi?: string;
    practiceName?: string;
    practiceAddress?: string;
    practicePhone?: string;
    practiceTaxId?: string;
    sessionDuration?: number;
    placeOfService?: string;
    status: string;
    notes?: string;
}

export function generateSuperbillPdf(data: SuperbillPdfData): void {
    // Load provider settings from localStorage
    let providerSettings: Record<string, string> = {};
    try {
        const stored = localStorage.getItem('clinical-copilot-provider-settings');
        if (stored) providerSettings = JSON.parse(stored);
    } catch { /* ignore */ }

    const providerName = data.providerName || providerSettings.providerName || 'Provider';
    const providerNpi = data.providerNpi || providerSettings.providerNpi || '';
    const practiceName = data.practiceName || providerSettings.practiceName || '';
    const practiceAddress = data.practiceAddress || providerSettings.practiceAddress || '';
    const practicePhone = data.practicePhone || providerSettings.practicePhone || '';
    const practiceTaxId = data.practiceTaxId || providerSettings.practiceTaxId || '';

    const canvas = document.createElement('canvas');
    const W = 816; // 8.5" at 96dpi
    const H = 1056; // 11" at 96dpi
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext('2d')!;

    // Background
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, W, H);

    let y = 40;

    // â”€â”€ Header â”€â”€
    ctx.fillStyle = '#1E293B';
    ctx.fillRect(40, y, W - 80, 80);
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 22px Arial, sans-serif';
    ctx.fillText('SUPERBILL / ENCOUNTER FORM', 60, y + 35);
    ctx.font = '12px Arial, sans-serif';
    ctx.fillStyle = '#94A3B8';
    ctx.fillText(`Generated ${new Date().toLocaleDateString('en-GB')}`, 60, y + 58);

    // Status badge
    const statusColors: Record<string, string> = {
        Finalized: '#166534', submitted: '#92400E', paid: '#065F46', denied: '#991B1B',
        draft: '#475569', ready_for_payer: '#1D4ED8',
    };
    ctx.fillStyle = statusColors[data.status] || '#475569';
    const statusLabel = data.status.toUpperCase().replace('_', ' ');
    const statusWidth = ctx.measureText(statusLabel).width + 24;
    ctx.fillRect(W - 40 - statusWidth - 20, y + 20, statusWidth + 20, 28);
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 11px Arial, sans-serif';
    ctx.fillText(statusLabel, W - 40 - statusWidth - 8, y + 39);

    y += 100;

    // â”€â”€ Provider / Patient Row â”€â”€
    const colW = (W - 80) / 2;

    // Provider box
    ctx.strokeStyle = '#E2DDD5';
    ctx.lineWidth = 1;
    ctx.strokeRect(40, y, colW - 10, 100);
    ctx.fillStyle = '#F8FAFC';
    ctx.fillRect(41, y + 1, colW - 12, 22);
    ctx.fillStyle = '#1E293B';
    ctx.font = 'bold 10px Arial, sans-serif';
    ctx.fillText('PROVIDER', 52, y + 15);
    ctx.font = '13px Arial, sans-serif';
    ctx.fillStyle = '#334155';
    ctx.fillText(providerName, 52, y + 42);
    ctx.font = '11px Arial, sans-serif';
    ctx.fillStyle = '#64748B';
    if (providerNpi) ctx.fillText(`NPI: ${providerNpi}`, 52, y + 58);
    if (practiceName) ctx.fillText(practiceName, 52, y + 74);
    if (practiceAddress) ctx.fillText(practiceAddress, 52, y + 88);

    // Patient box
    const px = 40 + colW + 10;
    ctx.strokeStyle = '#E2DDD5';
    ctx.strokeRect(px, y, colW - 10, 100);
    ctx.fillStyle = '#F8FAFC';
    ctx.fillRect(px + 1, y + 1, colW - 12, 22);
    ctx.fillStyle = '#1E293B';
    ctx.font = 'bold 10px Arial, sans-serif';
    ctx.fillText('PATIENT', px + 12, y + 15);
    ctx.font = '13px Arial, sans-serif';
    ctx.fillStyle = '#334155';
    ctx.fillText(data.patientName, px + 12, y + 42);
    ctx.font = '11px Arial, sans-serif';
    ctx.fillStyle = '#64748B';
    ctx.fillText(`Date of Service: ${new Date(data.serviceDate).toLocaleDateString('en-GB')}`, px + 12, y + 58);
    if (data.sessionDuration) ctx.fillText(`Duration: ${data.sessionDuration} min`, px + 12, y + 74);
    if (data.placeOfService) ctx.fillText(`Place of Service: ${data.placeOfService}`, px + 12, y + 88);

    y += 120;

    // â”€â”€ CPT Codes Table â”€â”€
    ctx.fillStyle = '#F8FAFC';
    ctx.fillRect(40, y, W - 80, 24);
    ctx.strokeStyle = '#E2DDD5';
    ctx.strokeRect(40, y, W - 80, 24);
    ctx.fillStyle = '#1E293B';
    ctx.font = 'bold 10px Arial, sans-serif';
    ctx.fillText('CPT CODE', 52, y + 16);
    ctx.fillText('DESCRIPTION', 170, y + 16);
    ctx.fillText('FEE', W - 120, y + 16);
    y += 24;

    ctx.font = '12px Arial, sans-serif';
    for (const cpt of data.cptCodes) {
        ctx.strokeStyle = '#F1F5F9';
        ctx.strokeRect(40, y, W - 80, 24);
        ctx.fillStyle = '#4338CA';
        ctx.font = 'bold 12px Courier, monospace';
        ctx.fillText(cpt.code, 52, y + 16);
        ctx.fillStyle = '#475569';
        ctx.font = '11px Arial, sans-serif';
        const desc = cpt.description.length > 55 ? cpt.description.substring(0, 55) + '...' : cpt.description;
        ctx.fillText(desc, 170, y + 16);
        ctx.fillStyle = '#065F46';
        ctx.font = 'bold 12px Arial, sans-serif';
        ctx.fillText(`Â£${cpt.fee.toFixed(2)}`, W - 120, y + 16);
        y += 24;
    }

    // CPT total row
    ctx.fillStyle = '#F0FDF4';
    ctx.fillRect(40, y, W - 80, 28);
    ctx.strokeStyle = '#BBF7D0';
    ctx.strokeRect(40, y, W - 80, 28);
    ctx.fillStyle = '#065F46';
    ctx.font = 'bold 13px Arial, sans-serif';
    ctx.fillText('TOTAL', 170, y + 19);
    ctx.fillText(`Â£${data.totalFee.toFixed(2)}`, W - 120, y + 19);
    y += 44;

    // â”€â”€ ICD-10 Codes â”€â”€
    if (data.icd10Codes.length > 0) {
        ctx.fillStyle = '#F8FAFC';
        ctx.fillRect(40, y, W - 80, 24);
        ctx.strokeStyle = '#E2DDD5';
        ctx.strokeRect(40, y, W - 80, 24);
        ctx.fillStyle = '#1E293B';
        ctx.font = 'bold 10px Arial, sans-serif';
        ctx.fillText('ICD-10 CODE', 52, y + 16);
        ctx.fillText('DIAGNOSIS', 170, y + 16);
        y += 24;

        for (const icd of data.icd10Codes) {
            ctx.strokeStyle = '#F1F5F9';
            ctx.strokeRect(40, y, W - 80, 24);
            ctx.fillStyle = '#6B21A8';
            ctx.font = 'bold 12px Courier, monospace';
            ctx.fillText(icd.code, 52, y + 16);
            ctx.fillStyle = '#475569';
            ctx.font = '11px Arial, sans-serif';
            ctx.fillText(icd.description, 170, y + 16);
            y += 24;
        }
        y += 16;
    }

    // â”€â”€ Notes â”€â”€
    if (data.notes) {
        ctx.fillStyle = '#1E293B';
        ctx.font = 'bold 10px Arial, sans-serif';
        ctx.fillText('NOTES', 52, y + 12);
        y += 20;
        ctx.fillStyle = '#64748B';
        ctx.font = '11px Arial, sans-serif';
        const words = data.notes.split(' ');
        let line = '';
        for (const word of words) {
            const test = line + word + ' ';
            if (ctx.measureText(test).width > W - 120) {
                ctx.fillText(line.trim(), 52, y);
                y += 16;
                line = word + ' ';
            } else {
                line = test;
            }
        }
        if (line.trim()) { ctx.fillText(line.trim(), 52, y); y += 16; }
        y += 16;
    }

    // â”€â”€ Signature Line â”€â”€
    y = Math.max(y, H - 180);
    ctx.strokeStyle = '#CBD5E0';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(52, y + 40);
    ctx.lineTo(320, y + 40);
    ctx.stroke();
    ctx.fillStyle = '#64748B';
    ctx.font = '10px Arial, sans-serif';
    ctx.fillText('Provider Signature', 52, y + 54);
    ctx.fillText(`${providerName}`, 52, y + 68);

    ctx.beginPath();
    ctx.moveTo(400, y + 40);
    ctx.lineTo(W - 52, y + 40);
    ctx.stroke();
    ctx.fillText('Date', 400, y + 54);

    // â”€â”€ Footer â”€â”€
    ctx.fillStyle = '#F1F5F9';
    ctx.fillRect(40, H - 60, W - 80, 30);
    ctx.fillStyle = '#94A3B8';
    ctx.font = '9px Arial, sans-serif';
    const footerParts = [practiceName, practicePhone, practiceTaxId ? `Tax ID: ${practiceTaxId}` : ''].filter(Boolean);
    ctx.fillText(footerParts.join('  â€¢  ') || 'ORAII', 52, H - 42);
    ctx.fillText('Generated by ORAII', W - 220, H - 42);

    // â”€â”€ Download â”€â”€
    canvas.toBlob((blob) => {
        if (!blob) return;
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `superbill_${data.patientName.replace(/\s+/g, '_')}_${data.serviceDate}.png`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }, 'image/png');
}
