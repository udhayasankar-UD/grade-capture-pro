export interface MarkData {
  regNo: string;
  partA: number[]; // Q1-Q5, 5 values
  partB: { a: number; b: number }[]; // Q6-Q10, 5 pairs
  partC: { a: number; b: number }[]; // Q11-Q15, 5 pairs
}

export interface ValidationError {
  field: string;
  message: string;
}

export function createEmptyMarkData(): MarkData {
  return {
    regNo: "",
    partA: [0, 0, 0, 0, 0],
    partB: Array.from({ length: 5 }, () => ({ a: 0, b: 0 })),
    partC: Array.from({ length: 5 }, () => ({ a: 0, b: 0 })),
  };
}

export function validateMarks(data: MarkData): ValidationError[] {
  const errors: ValidationError[] = [];

  if (!data.regNo.trim()) {
    errors.push({ field: "regNo", message: "Register Number is required." });
  }

  const isValidMark = (val: number) => typeof val === 'number' && !Number.isNaN(val) && val >= 0 && val % 0.5 === 0;

  // Part A: max 2 per question, total <= 10
  data.partA.forEach((val, i) => {
    if (!isValidMark(val)) {
      errors.push({ field: `partA.${i}`, message: `Q${i + 1}: Must be a valid whole or half mark.` });
    } else if (val > 2) {
      errors.push({ field: `partA.${i}`, message: `Q${i + 1}: Maximum mark is 2 (entered ${val}).` });
    }
  });
  const partATotal = Number(data.partA.reduce((s, v) => s + v, 0).toFixed(1));
  if (partATotal > 10) {
    errors.push({ field: "partA.total", message: `Part A total (${partATotal}) exceeds maximum of 10.` });
  }

  // Part B: max 4 per question, total <= 20, mutual exclusivity
  data.partB.forEach((pair, i) => {
    const qNum = i + 6;
    if (!isValidMark(pair.a)) {
      errors.push({ field: `partB.${i}.a`, message: `Q${qNum}a: Must be a valid whole or half mark.` });
    } else if (pair.a > 4) {
      errors.push({ field: `partB.${i}.a`, message: `Q${qNum}a: Maximum mark is 4 (entered ${pair.a}).` });
    }
    if (!isValidMark(pair.b)) {
      errors.push({ field: `partB.${i}.b`, message: `Q${qNum}b: Must be a valid whole or half mark.` });
    } else if (pair.b > 4) {
      errors.push({ field: `partB.${i}.b`, message: `Q${qNum}b: Maximum mark is 4 (entered ${pair.b}).` });
    }
    if (pair.a > 0 && pair.b > 0) {
      errors.push({ field: `partB.${i}`, message: `Q${qNum}: Cannot have marks in both (a) and (b). Choose one.` });
    }
  });
  const partBTotal = Number(data.partB.reduce((s, p) => s + Math.max(p.a, p.b), 0).toFixed(1));
  if (partBTotal > 20) {
    errors.push({ field: "partB.total", message: `Part B total (${partBTotal}) exceeds maximum of 20.` });
  }

  // Part C: max 7 per question, total <= 35, mutual exclusivity
  data.partC.forEach((pair, i) => {
    const qNum = i + 11;
    if (!isValidMark(pair.a)) {
      errors.push({ field: `partC.${i}.a`, message: `Q${qNum}a: Must be a valid whole or half mark.` });
    } else if (pair.a > 7) {
      errors.push({ field: `partC.${i}.a`, message: `Q${qNum}a: Maximum mark is 7 (entered ${pair.a}).` });
    }
    if (!isValidMark(pair.b)) {
      errors.push({ field: `partC.${i}.b`, message: `Q${qNum}b: Must be a valid whole or half mark.` });
    } else if (pair.b > 7) {
      errors.push({ field: `partC.${i}.b`, message: `Q${qNum}b: Maximum mark is 7 (entered ${pair.b}).` });
    }
    if (pair.a > 0 && pair.b > 0) {
      errors.push({ field: `partC.${i}`, message: `Q${qNum}: Cannot have marks in both (a) and (b). Choose one.` });
    }
  });
  const partCTotal = Number(data.partC.reduce((s, p) => s + Math.max(p.a, p.b), 0).toFixed(1));
  if (partCTotal > 35) {
    errors.push({ field: "partC.total", message: `Part C total (${partCTotal}) exceeds maximum of 35.` });
  }

  return errors;
}

export function calculateTotals(data: MarkData) {
  const partATotal = Number(data.partA.reduce((s, v) => s + v, 0).toFixed(1));
  const partBTotal = Number(data.partB.reduce((s, p) => s + Math.max(p.a, p.b), 0).toFixed(1));
  const partCTotal = Number(data.partC.reduce((s, p) => s + Math.max(p.a, p.b), 0).toFixed(1));
  return { partATotal, partBTotal, partCTotal, grandTotal: Number((partATotal + partBTotal + partCTotal).toFixed(1)) };
}
