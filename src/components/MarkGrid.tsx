import { MarkData, ValidationError } from "@/lib/types";

interface MarkGridProps {
  data: MarkData;
  errors: ValidationError[];
  onChange: (data: MarkData) => void;
}

function hasError(errors: ValidationError[], field: string): boolean {
  return errors.some((e) => e.field === field || e.field.startsWith(field + "."));
}

function CellInput({
  value,
  field,
  errors,
  max,
  onChange,
}: {
  value: number;
  field: string;
  errors: ValidationError[];
  max: number;
  onChange: (val: number) => void;
}) {
  const isError = hasError(errors, field);
  return (
    <input
      type="number"
      min={0}
      max={max}
      value={value || ""}
      placeholder="0"
      onChange={(e) => {
        const v = e.target.value === "" ? 0 : parseInt(e.target.value, 10);
        if (!isNaN(v)) onChange(v);
      }}
      className={`w-14 h-9 text-center font-data text-sm rounded-sm border outline-none transition-colors
        ${
          isError
            ? "bg-destructive text-destructive-foreground border-destructive"
            : "bg-grid-cell text-grid-foreground border-border focus:border-primary focus:ring-1 focus:ring-ring"
        }
      `}
    />
  );
}

export function MarkGrid({ data, errors, onChange }: MarkGridProps) {
  const updatePartA = (index: number, val: number) => {
    const next = { ...data, partA: [...data.partA] };
    next.partA[index] = val;
    onChange(next);
  };

  const updatePartB = (index: number, sub: "a" | "b", val: number) => {
    const next = { ...data, partB: data.partB.map((p, i) => (i === index ? { ...p, [sub]: val } : p)) };
    onChange(next);
  };

  const updatePartC = (index: number, sub: "a" | "b", val: number) => {
    const next = { ...data, partC: data.partC.map((p, i) => (i === index ? { ...p, [sub]: val } : p)) };
    onChange(next);
  };

  return (
    <div className="bg-grid rounded-sm border border-border p-4 space-y-6 overflow-x-auto">
      {/* Part A */}
      <div>
        <h3 className="font-heading text-sm text-muted-foreground mb-2 tracking-wide">
          PART A — Max 2/question, Total ≤ 10
        </h3>
        <div className="flex gap-2 items-end">
          {data.partA.map((val, i) => (
            <div key={i} className="flex flex-col items-center gap-1">
              <span className="text-xs text-muted-foreground font-heading">Q{i + 1}</span>
              <CellInput value={val} field={`partA.${i}`} errors={errors} max={2} onChange={(v) => updatePartA(i, v)} />
            </div>
          ))}
        </div>
      </div>

      {/* Part B */}
      <div>
        <h3 className="font-heading text-sm text-muted-foreground mb-2 tracking-wide">
          PART B — Max 4/question, Total ≤ 20, Choose (a) or (b)
        </h3>
        <div className="flex gap-4 items-end flex-wrap">
          {data.partB.map((pair, i) => (
            <div key={i} className="flex flex-col items-center gap-1">
              <span className="text-xs text-muted-foreground font-heading">Q{i + 6}</span>
              <div className="flex gap-1">
                <div className="flex flex-col items-center">
                  <span className="text-[10px] text-muted-foreground">a</span>
                  <CellInput value={pair.a} field={`partB.${i}.a`} errors={errors} max={4} onChange={(v) => updatePartB(i, "a", v)} />
                </div>
                <div className="flex flex-col items-center">
                  <span className="text-[10px] text-muted-foreground">b</span>
                  <CellInput value={pair.b} field={`partB.${i}.b`} errors={errors} max={4} onChange={(v) => updatePartB(i, "b", v)} />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Part C */}
      <div>
        <h3 className="font-heading text-sm text-muted-foreground mb-2 tracking-wide">
          PART C — Max 7/question, Total ≤ 35, Choose (a) or (b)
        </h3>
        <div className="flex gap-4 items-end flex-wrap">
          {data.partC.map((pair, i) => (
            <div key={i} className="flex flex-col items-center gap-1">
              <span className="text-xs text-muted-foreground font-heading">Q{i + 11}</span>
              <div className="flex gap-1">
                <div className="flex flex-col items-center">
                  <span className="text-[10px] text-muted-foreground">a</span>
                  <CellInput value={pair.a} field={`partC.${i}.a`} errors={errors} max={7} onChange={(v) => updatePartC(i, "a", v)} />
                </div>
                <div className="flex flex-col items-center">
                  <span className="text-[10px] text-muted-foreground">b</span>
                  <CellInput value={pair.b} field={`partC.${i}.b`} errors={errors} max={7} onChange={(v) => updatePartC(i, "b", v)} />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
