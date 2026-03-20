import { MarkData, calculateTotals } from "./types";

// Col 0: S.No
// Col 1: Reg No
// Col 2: Student Name
// Col 3-7: Part A (Q1-Q5)
// Col 8-17: Part B pairs (Q6a,Q6b ... Q10a,Q10b)
// Col 18-27: Part C pairs (Q11a,Q11b ... Q15a,Q15b)
// Col 28: Grand Total
// Col 29: Remarks

const TOTAL_COLUMNS = 30;
export const COL = {
  REG_NO: 1,
  PART_A_START: 3, // cols 3-7
  PART_B_START: 8, // cols 8-17
  PART_C_START: 18, // cols 18-27
  GRAND_TOTAL: 28,
};

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;
  for (const ch of line) {
    if (ch === '"') {
      inQuotes = !inQuotes;
    } else if (ch === "," && !inQuotes) {
      result.push(current.trim());
      current = "";
    } else {
      current += ch;
    }
  }
  result.push(current.trim());
  return result;
}

export interface CSVState {
  rawLines: string[]; // preserve original lines (including header rows)
  headerLineCount: number;
  dataRows: { regNo: string; cells: string[] }[];
}

export function parseCSV(text: string): CSVState {
  const rawLines = text.split("\n");
  const nonEmpty = rawLines.filter((l) => l.trim());
  
  // Find how many header rows there are by locating the row starting with "S.No"
  let headerLineCount = 0;
  for (let i = 0; i < nonEmpty.length; i++) {
    const firstCell = parseCSVLine(nonEmpty[i])[0];
    if (firstCell && firstCell.trim() === "S.No") {
      // The data usually starts 4 rows after "S.No" (to skip MARKS, COURSE OUTCOMES, BLOOMS LEVELS)
      headerLineCount = i + 4;
      break;
    }
  }
  
  if (headerLineCount === 0 || headerLineCount >= nonEmpty.length) {
    // Fallback: look for the first row where column index 1 is a valid register number
    for (let i = 0; i < nonEmpty.length; i++) {
      const regNoCell = parseCSVLine(nonEmpty[i])[1];
      if (regNoCell && /^\d{5,12}$/.test(regNoCell.trim())) {
        headerLineCount = i;
        break;
      }
    }
  }

  const dataRows = nonEmpty.slice(headerLineCount).map((line) => {
    const cells = parseCSVLine(line);
    return { regNo: cells[COL.REG_NO] ? cells[COL.REG_NO].trim() : "", cells };
  });

  return { rawLines, headerLineCount, dataRows };
}

export function findRowByRegNo(csv: CSVState, regNo: string): number {
  return csv.dataRows.findIndex((r) => r.regNo === regNo.trim());
}

export function markDataToRow(data: MarkData, existingCells: string[] = []): string[] {
  const totals = calculateTotals(data);
  const row = new Array(TOTAL_COLUMNS).fill("");
  
  // Keep original values like S.No and Student Name
  for (let i = 0; i < existingCells.length; i++) {
    row[i] = existingCells[i] || "";
  }

  row[COL.REG_NO] = data.regNo;

  // Part A
  for (let i = 0; i < 5; i++) {
    row[COL.PART_A_START + i] = String(data.partA[i] || "0");
  }

  // Part B (5 pairs starting at col 8)
  for (let i = 0; i < 5; i++) {
    row[COL.PART_B_START + i * 2] = data.partB[i].a ? String(data.partB[i].a) : "0";
    row[COL.PART_B_START + i * 2 + 1] = data.partB[i].b ? String(data.partB[i].b) : "0";
  }

  // Part C (5 pairs starting at col 18)
  for (let i = 0; i < 5; i++) {
    row[COL.PART_C_START + i * 2] = data.partC[i].a ? String(data.partC[i].a) : "0";
    row[COL.PART_C_START + i * 2 + 1] = data.partC[i].b ? String(data.partC[i].b) : "0";
  }

  row[COL.GRAND_TOTAL] = String(totals.grandTotal);

  return row;
}

export function rowToMarkData(cells: string[]): MarkData {
  const num = (s: string) => {
    const n = parseInt(s, 10);
    return isNaN(n) ? 0 : n;
  };

  return {
    regNo: cells[COL.REG_NO] || "",
    partA: Array.from({ length: 5 }, (_, i) => num(cells[COL.PART_A_START + i] || "")),
    partB: Array.from({ length: 5 }, (_, i) => ({
      a: num(cells[COL.PART_B_START + i * 2] || ""),
      b: num(cells[COL.PART_B_START + i * 2 + 1] || ""),
    })),
    partC: Array.from({ length: 5 }, (_, i) => ({
      a: num(cells[COL.PART_C_START + i * 2] || ""),
      b: num(cells[COL.PART_C_START + i * 2 + 1] || ""),
    })),
  };
}

export function generateCSV(csv: CSVState): string {
  // Reconstruct: original header lines + updated data rows
  const nonEmpty = csv.rawLines.filter((l) => l.trim());
  const headerLines = nonEmpty.slice(0, csv.headerLineCount);
  const dataLines = csv.dataRows.map((r) => r.cells.join(","));
  return [...headerLines, ...dataLines].join("\n");
}

export function getRegisteredNumbers(csv: CSVState): string[] {
  // Only return valid register numbers (must be a sequence of digits)
  return csv.dataRows
    .map((r) => r.regNo?.trim())
    .filter((regNo) => regNo && /^\d+$/.test(regNo));
}
