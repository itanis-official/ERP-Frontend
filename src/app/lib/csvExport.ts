export type CsvValue = string | number | boolean | null | undefined;

export interface CsvColumn<T> {
  header: string;
  value: (row: T) => CsvValue;
}

const escapeCsvValue = (value: CsvValue): string => {
  if (value === null || value === undefined) {
    return "";
  }

  const text = String(value);
  const escaped = text.replace(/"/g, '""');
  return /["\n\r,;]/.test(text) ? `"${escaped}"` : escaped;
};

const toCsv = <T>(rows: T[], columns: CsvColumn<T>[]): string => {
  const headerLine = columns.map((column) => escapeCsvValue(column.header)).join(",");
  const dataLines = rows.map((row) => columns.map((column) => escapeCsvValue(column.value(row))).join(","));
  return [headerLine, ...dataLines].join("\n");
};

export const downloadCsv = <T>(fileName: string, rows: T[], columns: CsvColumn<T>[]): void => {
  const csvContent = toCsv(rows, columns);
  const blob = new Blob(["\uFEFF", csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.download = fileName.endsWith(".csv") ? fileName : `${fileName}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  URL.revokeObjectURL(url);
};
