/**
 * Unified export engine — Excel (.xlsx), CSV and PDF.
 * Columns: [{ key, label, align, format }]
 */
import * as XLSX from 'xlsx'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

const valueOf = (row, column) => {
  const raw = typeof column.key === 'function' ? column.key(row) : row[column.key]
  return column.format ? column.format(raw, row) : (raw ?? '')
}

const matrix = (columns, rows) => [
  columns.map((c) => c.label),
  ...rows.map((row) => columns.map((c) => valueOf(row, c)))
]

const stamp = () => new Date().toISOString().slice(0, 10)

/* ------------------------------------------------------------------ Excel */
export function exportExcel({ filename = 'export', sheetName = 'Sheet1', columns, rows, title }) {
  const data = matrix(columns, rows)
  if (title) data.unshift([title], [])
  const sheet = XLSX.utils.aoa_to_sheet(data)
  sheet['!cols'] = columns.map((c) => ({ wch: Math.max(12, String(c.label).length + 6, c.width || 0) }))
  const book = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(book, sheet, sheetName.slice(0, 31))
  XLSX.writeFile(book, `${filename}-${stamp()}.xlsx`)
}

/* -------------------------------------------------------------------- CSV */
export function exportCsv({ filename = 'export', columns, rows }) {
  const csv = matrix(columns, rows)
    .map((line) => line.map((cell) => `"${String(cell ?? '').replace(/"/g, '""')}"`).join(','))
    .join('\n')
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${filename}-${stamp()}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

/* -------------------------------------------------------------------- PDF */
export function exportPdf({
  filename = 'export',
  title = 'Report',
  subtitle = '',
  meta = [],
  columns,
  rows,
  summary = [],
  orientation = 'portrait'
}) {
  const doc = new jsPDF({ orientation, unit: 'pt', format: 'a4' })
  const width = doc.internal.pageSize.getWidth()

  doc.setFillColor(79, 70, 229)
  doc.rect(0, 0, width, 70, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(16)
  doc.text(title, 40, 32)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  if (subtitle) doc.text(subtitle, 40, 50)
  doc.text(`Generated ${new Date().toLocaleString()}`, width - 40, 50, { align: 'right' })

  let startY = 92
  if (meta.length) {
    doc.setTextColor(71, 85, 105)
    doc.setFontSize(9)
    meta.forEach((line, i) => doc.text(line, 40, startY + i * 13))
    startY += meta.length * 13 + 8
  }

  autoTable(doc, {
    startY,
    head: [columns.map((c) => c.label)],
    body: rows.map((row) => columns.map((c) => String(valueOf(row, c)))),
    styles: { fontSize: 8.5, cellPadding: 6, lineColor: [226, 232, 240], lineWidth: 0.5 },
    headStyles: { fillColor: [241, 245, 249], textColor: [51, 65, 85], fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [250, 250, 252] },
    columnStyles: columns.reduce((acc, c, i) => {
      if (c.align === 'right') acc[i] = { halign: 'right' }
      return acc
    }, {}),
    margin: { left: 40, right: 40 }
  })

  if (summary.length) {
    let y = doc.lastAutoTable.finalY + 18
    doc.setFontSize(9)
    summary.forEach(([label, value]) => {
      doc.setTextColor(100, 116, 139)
      doc.text(String(label), width - 200, y)
      doc.setTextColor(15, 23, 42)
      doc.setFont('helvetica', 'bold')
      doc.text(String(value), width - 40, y, { align: 'right' })
      doc.setFont('helvetica', 'normal')
      y += 15
    })
  }

  const pages = doc.internal.getNumberOfPages()
  for (let p = 1; p <= pages; p++) {
    doc.setPage(p)
    doc.setFontSize(8)
    doc.setTextColor(148, 163, 184)
    doc.text(`Page ${p} / ${pages}`, width / 2, doc.internal.pageSize.getHeight() - 20, {
      align: 'center'
    })
  }

  doc.save(`${filename}-${stamp()}.pdf`)
}

/* ----------------------------------------------------------------- Import */
/** Read an .xlsx/.csv file into an array of objects. */
export function importSpreadsheet(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onerror = () => reject(new Error('Unable to read the selected file.'))
    reader.onload = (event) => {
      try {
        const book = XLSX.read(event.target.result, { type: 'array' })
        const sheet = book.Sheets[book.SheetNames[0]]
        resolve(XLSX.utils.sheet_to_json(sheet, { defval: '' }))
      } catch (e) {
        reject(e)
      }
    }
    reader.readAsArrayBuffer(file)
  })
}
