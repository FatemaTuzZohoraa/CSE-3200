import { Response } from "express";
import PDFDocument from "pdfkit";

export interface ExportColumn {
    header: string;
    width: number;                            // PDF width in points; all widths should sum to 515 on A4
    get: (row: any, index: number) => string; // how to turn one row into this cell's text
}

interface ExportOptions {
    title: string;
    subtitle: string;
    filename: string; // without extension
    columns: ExportColumn[];
    rows: any[];
}

export const formatDhaka = (value: any): string =>
    new Date(value).toLocaleString("en-GB", {
        timeZone: "Asia/Dhaka",
        day: "2-digit", month: "short", year: "numeric",
        hour: "2-digit", minute: "2-digit"
    });

// Keep downloaded file names safe: letters, digits, dashes only.
const safeName = (name: string) =>
    name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 60) || "export";

// A cell starting with = + - @ can run as a formula when opened in Excel. Defuse it.
const csvCell = (value: string) => {
    const guarded = /^[=+\-@]/.test(value) ? `'${value}` : value;
    return `"${guarded.replace(/"/g, '""')}"`;
};

export const sendExport = (res: Response, format: string, opts: ExportOptions) => {
    const file = safeName(opts.filename);

    if (format === "csv") {
        const lines = [
            opts.columns.map((c) => csvCell(c.header)).join(","),
            ...opts.rows.map((row, i) => opts.columns.map((c) => csvCell(c.get(row, i))).join(","))
        ];
        res.setHeader("Content-Type", "text/csv; charset=utf-8");
        res.setHeader("Content-Disposition", `attachment; filename="${file}.csv"`);
        // BOM so Excel reads UTF-8 correctly
        res.send("\uFEFF" + lines.join("\r\n"));
        return;
    }

    const doc = new PDFDocument({ size: "A4", margin: 40, bufferPages: true });
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${file}.pdf"`);
    doc.pipe(res);

    const left = 40;
    const rowHeight = 20;

    const drawHeaderRow = () => {
        let x = left;
        const y = doc.y;
        doc.rect(left, y - 3, 515, rowHeight).fill("#F3E8D8");
        doc.fillColor("#000").font("Helvetica-Bold").fontSize(9);
        for (const c of opts.columns) {
            doc.text(c.header, x + 4, y + 2, { width: c.width - 8, height: 12, ellipsis: true, lineBreak: false });
            x += c.width;
        }
        doc.y = y + rowHeight;
    };

    doc.font("Helvetica-Bold").fontSize(16).text(opts.title, left, 40);
    doc.font("Helvetica").fontSize(9).fillColor("#555")
        .text(opts.subtitle)
        .text(`Generated ${formatDhaka(new Date())} (Asia/Dhaka)  |  ${opts.rows.length} row(s)`);
    doc.moveDown(1);
    drawHeaderRow();

    opts.rows.forEach((row, i) => {
        if (doc.y > doc.page.height - 70) {
            doc.addPage();
            doc.y = 40;
            drawHeaderRow();
        }
        const y = doc.y;
        if (i % 2 === 1) doc.rect(left, y - 3, 515, rowHeight).fill("#FAF6F0");
        doc.fillColor("#000").font("Helvetica").fontSize(9);
        let x = left;
        for (const c of opts.columns) {
            doc.text(c.get(row, i), x + 4, y + 2, { width: c.width - 8, height: 12, ellipsis: true, lineBreak: false });
            x += c.width;
        }
        doc.y = y + rowHeight;
    });

    if (opts.rows.length === 0) {
        doc.fillColor("#777").text("Nobody to list yet.", left + 4, doc.y + 6);
    }

    // Page numbers. The bottom margin is zeroed while writing, or PDFKit adds a blank page.
    const range = doc.bufferedPageRange();
    for (let p = 0; p < range.count; p++) {
        doc.switchToPage(p);
        doc.page.margins.bottom = 0;
        doc.fillColor("#888").fontSize(8)
            .text(`Page ${p + 1} of ${range.count}`, left, doc.page.height - 30,
                  { width: 515, align: "center", lineBreak: false });
    }

    doc.end();
};