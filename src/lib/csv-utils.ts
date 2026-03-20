import { MarkData, calculateTotals } from "./types";
import { AppSettings } from "./settings-context";
import * as XLSX from "xlsx";

export interface CSVState {
  dataRows: { regNo: string; markData: MarkData | null }[];
}

export function createEmptySpreadsheet(): CSVState {
  return { dataRows: [] };
}

export function findRowByRegNo(csv: CSVState, regNo: string): number {
  return csv.dataRows.findIndex((r) => r.regNo === regNo.trim());
}

export function generateXLSXString(csv: CSVState, settings: AppSettings): Blob {
  const header1: string[] = ["S.No", "Register Number"];
  const header2: string[] = ["MARKS", ""];

  let qNum = 1;
  const partsLabel: string[] = [];

  settings.parts.filter(p => p.enabled).forEach(part => {
    partsLabel.push(part.name);
    if (part.type === "single") {
      for (let i = 0; i < part.questionCount; i++) {
        header1.push(`Q${qNum}`);
        header2.push(part.maxMarks.toString());
        qNum++;
      }
    } else {
      for (let i = 0; i < part.questionCount; i++) {
        header1.push(`Q${qNum}(A)`);
        header1.push(`Q${qNum}(B)`);
        header2.push(part.maxMarks.toString());
        header2.push(part.maxMarks.toString());
        qNum++;
      }
    }
  });

  header1.push(...partsLabel, "Total");
  header2.push(...Array(partsLabel.length + 1).fill(""));

  const aoa: any[][] = [header1, header2];

  csv.dataRows.forEach((row, index) => {
    const dataRow: any[] = [index + 1, row.regNo];

    if (row.markData) {
      settings.parts.filter(p => p.enabled).forEach(part => {
        const pData = row.markData!.parts[part.id];
        if (pData) {
          if (part.type === "single") {
             (pData as number[]).forEach(v => dataRow.push(v || ""));
          } else {
             (pData as {a: number, b: number}[]).forEach(pair => {
                dataRow.push(pair.a || "");
                dataRow.push(pair.b || "");
             });
          }
        } else {
          // Fill empty if missing
          const colsCount = part.type === "single" ? part.questionCount : part.questionCount * 2;
          for(let i = 0; i < colsCount; i++) dataRow.push("");
        }
      });

      const totals = calculateTotals(row.markData, settings);
      settings.parts.filter(p => p.enabled).forEach(part => {
        dataRow.push(totals.partTotals[part.id]);
      });
      dataRow.push(totals.grandTotal);
    } else {
      // Not Graded row
      let totalCells = 0;
       settings.parts.filter(p => p.enabled).forEach(part => {
          totalCells += part.type === "single" ? part.questionCount : part.questionCount * 2;
       });
       totalCells += partsLabel.length + 1;
       for(let i=0; i < totalCells; i++) dataRow.push("");
    }

    aoa.push(dataRow);
  });

  const ws = XLSX.utils.aoa_to_sheet(aoa);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Sheet1");
  
  const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  return new Blob([wbout], { type: "application/octet-stream" });
}

export function parseCSV(_text: string): CSVState {
  // Legacy function: previously we imported a CSV, now we just return an empty sheet or mock it
  // Since we shouldn't upload CSV by default, this might not even be used, but let's keep it safe.
  // Actually, wait, let's just make it return empty. 
  return { dataRows: [] };
}

export function getRegisteredNumbers(csv: CSVState): string[] {
  return csv.dataRows
    .map((r) => r.regNo?.trim())
    .filter((regNo) => regNo && /^\d+$/.test(regNo));
}
