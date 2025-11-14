// CSVExporter.js
import React from 'react';

/* lightweight CSV export helper (no external deps) */
const escapeCell = (val) => {
  if (val === null || val === undefined) return '';
  let s = String(val);
  if (s.includes('"')) s = s.replace(/"/g, '""');
  if (/[",\n]/.test(s)) s = `"${s}"`;
  return s;
};

export const exportToCsv = (filename, headers = [], rows = []) => {
  // headers: [{ label, key }, ...]
  if (!Array.isArray(rows) || rows.length === 0) return;
  const headerLine = headers.map(h => escapeCell(h.label || h.key)).join(',');
  const keys = headers.map(h => h.key);
  const csvLines = [headerLine];
  for (const row of rows) {
    const line = keys.map(k => escapeCell(row[k])).join(',');
    csvLines.push(line);
  }
  const csvContent = csvLines.join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename || 'export.csv';
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
};

/* Default CSVExporter component — flattens attendance records and uses exportToCsv */
function CSVExporter({ records = [], filename = 'attendance_export.csv' }) {
  if (!Array.isArray(records) || records.length === 0) return null;

  const flattenedData = records.flatMap(student =>
    Array.isArray(student.attendance) ? student.attendance.map(a => ({
      name: student.name || '',
      roll_number: student.roll_number || '',
      date: a.date || '',
      subject: a.subject_code ? `${a.subject} (${a.subject_code})` : (a.subject || ''),
      entry_status: a.entry_status || '',
      exit_status: a.exit_status || '',
    })) : []
  );

  if (flattenedData.length === 0) return null;

  const headers = [
    { label: 'Name', key: 'name' },
    { label: 'Roll Number', key: 'roll_number' },
    { label: 'Date', key: 'date' },
    { label: 'Subject', key: 'subject' },
    { label: 'Entry Status', key: 'entry_status' },
    { label: 'Exit Status', key: 'exit_status' },
  ];

  return (
    <div className="mb-3">
      <button
        type="button"
        className="btn btn-outline-success"
        onClick={() => exportToCsv(filename, headers, flattenedData)}
      >
        📥 Export Attendance CSV
      </button>
    </div>
  );
}

export default CSVExporter;
