import { AppSettings, PartConfig } from "./settings-context";

export interface MarkData {
  regNo: string;
  parts: Record<string, any>;
  // For 'single': number[]
  // For 'choice': { a: number; b: number }[]
}

export interface ValidationError {
  field: string;
  message: string;
}

export function createEmptyMarkData(settings: AppSettings): MarkData {
  const parts: Record<string, any> = {};
  
  settings.parts.filter(p => p.enabled).forEach(part => {
    if (part.type === "single") {
      parts[part.id] = new Array(part.questionCount).fill(0);
    } else {
      parts[part.id] = Array.from({ length: part.questionCount }, () => ({ a: 0, b: 0 }));
    }
  });

  return { regNo: "", parts };
}

export function validateMarks(data: MarkData, settings: AppSettings): ValidationError[] {
  const errors: ValidationError[] = [];

  if (!data.regNo.trim()) {
    errors.push({ field: "regNo", message: "Register Number is required." });
  }

  const isValidMark = (val: number) => typeof val === 'number' && !Number.isNaN(val) && val >= 0 && val % 0.5 === 0;

  let currentQuestionNumber = 1;

  settings.parts.filter(p => p.enabled).forEach(part => {
    const partData = data.parts[part.id];
    let partTotal = 0;

    if (!partData) return;

    if (part.type === "single") {
      (partData as number[]).forEach((val, i) => {
        const qNum = currentQuestionNumber + i;
        if (!isValidMark(val)) {
          errors.push({ field: `parts.${part.id}.${i}`, message: `Q${qNum}: Must be a valid whole or half mark.` });
        } else if (val > part.maxMarks) {
          errors.push({ field: `parts.${part.id}.${i}`, message: `Q${qNum}: Maximum mark is ${part.maxMarks} (entered ${val}).` });
        }
        partTotal += val;
      });
      currentQuestionNumber += part.questionCount;
    } else {
      (partData as {a: number, b: number}[]).forEach((pair, i) => {
        const qNum = currentQuestionNumber + i;
        if (!isValidMark(pair.a)) {
          errors.push({ field: `parts.${part.id}.${i}.a`, message: `Q${qNum}a: Must be a valid whole or half mark.` });
        } else if (pair.a > part.maxMarks) {
          errors.push({ field: `parts.${part.id}.${i}.a`, message: `Q${qNum}a: Maximum mark is ${part.maxMarks} (entered ${pair.a}).` });
        }
        
        if (!isValidMark(pair.b)) {
          errors.push({ field: `parts.${part.id}.${i}.b`, message: `Q${qNum}b: Must be a valid whole or half mark.` });
        } else if (pair.b > part.maxMarks) {
          errors.push({ field: `parts.${part.id}.${i}.b`, message: `Q${qNum}b: Maximum mark is ${part.maxMarks} (entered ${pair.b}).` });
        }
        
        if (pair.a > 0 && pair.b > 0) {
          errors.push({ field: `parts.${part.id}.${i}`, message: `Q${qNum}: Cannot have marks in both (a) and (b). Choose one.` });
        }
        partTotal += Math.max(pair.a, pair.b);
      });
      currentQuestionNumber += part.questionCount;
    }

    const expectedPartMaxTotal = part.questionCount * part.maxMarks;
    const roundedPartTotal = Number(partTotal.toFixed(1));
    if (roundedPartTotal > expectedPartMaxTotal) {
      errors.push({ field: `parts.${part.id}.total`, message: `Part ${part.id} total (${roundedPartTotal}) exceeds absolute maximum of ${expectedPartMaxTotal}.` });
    }
  });

  return errors;
}

export function calculateTotals(data: MarkData, settings: AppSettings) {
  const partTotals: Record<string, number> = {};
  let grandTotal = 0;

  settings.parts.filter(p => p.enabled).forEach(part => {
    const partData = data.parts[part.id];
    if (!partData) {
       partTotals[part.id] = 0;
       return;
    }
    
    let total = 0;
    if (part.type === "single") {
       total = (partData as number[]).reduce((s, v) => s + v, 0);
    } else {
       total = (partData as {a: number, b: number}[]).reduce((s, p) => s + Math.max(p.a, p.b), 0);
    }
    const roundedTotal = Number(total.toFixed(1));
    partTotals[part.id] = roundedTotal;
    grandTotal += roundedTotal;
  });

  return { partTotals, grandTotal: Number(grandTotal.toFixed(1)) };
}
