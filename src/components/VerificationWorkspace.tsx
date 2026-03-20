import { useState, useCallback, useEffect } from "react";
import { ArrowLeft, ZoomIn, ZoomOut, Maximize, RotateCcw as RotateLeft, Image as ImageIcon, ChevronDown, GraduationCap, BookOpen, HelpCircle, Save, AlertCircle, RotateCcw, SkipForward } from "lucide-react";
import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch";
import { MarkData, ValidationError, createEmptyMarkData, validateMarks, calculateTotals } from "@/lib/types";
import { CSVState, findRowByRegNo, getRegisteredNumbers } from "@/lib/csv-utils";
import { ProfileMenu } from "@/components/ProfileMenu";
import { useSettings } from "@/lib/settings-context";

interface VerificationWorkspaceProps {
  csvState: CSVState;
  csvFileName: string;
  answerSheetUrl: string;
  initialData?: MarkData | null;
  onBack: () => void;
  onCsvUpdate: (csv: CSVState) => void;
}

function MarkSelect({
  value,
  field,
  rowField,
  errors,
  max,
  allowHalfMarks = false,
  onChange,
}: {
  value: number;
  field: string;
  rowField?: string;
  errors: ValidationError[];
  max: number;
  allowHalfMarks?: boolean;
  onChange: (val: number) => void;
}) {
  const specificError = errors.find((e) => e.field === field);
  const rowError = rowField ? errors.find((e) => e.field === rowField) : undefined;
  const error = specificError || rowError;
  const isError = !!error;
  
  const optionsSet = new Set<number>();
  const step = allowHalfMarks ? 0.5 : 1;
  for (let i = 0; i <= max; i += step) {
    optionsSet.add(i);
  }
  optionsSet.add(value);
  const options = Array.from(optionsSet).sort((a, b) => a - b);

  return (
    <div className="flex flex-col items-center w-full">
      <select
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className={`w-full h-11 sm:h-12 text-center font-data text-sm sm:text-base rounded-md border outline-none transition-all appearance-none bg-no-repeat bg-[length:14px] bg-[center_right_8px] px-2 sm:px-3
          ${isError
            ? "bg-destructive/10 text-destructive border-destructive ring-1 ring-destructive/30"
            : "bg-card text-foreground border-border focus:border-primary focus:ring-2 focus:ring-ring/20"
          }
        `}
        style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='14' height='14' viewBox='0 0 24 24' fill='none' stroke='%2394a3b8' stroke-width='2'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E")` }}
      >
        {options.map((n) => (
          <option key={n} value={n}>{n}</option>
        ))}
      </select>
      {isError && (
        <span className="text-[10px] sm:text-xs text-destructive mt-1.5 leading-tight text-center">{error.message.split(":").pop()?.trim()}</span>
      )}
    </div>
  );
}

function SectionTotal({ label, value, max }: { label: string; value: number; max: number }) {
  const isOver = value > max;
  return (
    <div className={`flex items-center justify-end gap-3 mt-3 px-3 sm:px-4 py-2 sm:py-3 rounded-lg text-right shadow-sm border border-border/50
      ${isOver ? "bg-destructive/10 border-destructive/30" : "bg-accent/50"}`}>
      <span className="font-heading font-bold text-xs sm:text-sm text-muted-foreground uppercase">{label}:</span>
      <span className={`font-data font-bold text-sm sm:text-base ${isOver ? "text-destructive" : "text-primary"}`}>
        {String(value).padStart(2, "0")} / {max}
      </span>
    </div>
  );
}

export function VerificationWorkspace({ csvState, csvFileName, answerSheetUrl, initialData, onBack, onCsvUpdate }: VerificationWorkspaceProps) {
  const { settings } = useSettings();
  const [markData, setMarkData] = useState<MarkData>(initialData || createEmptyMarkData(settings));
  const [errors, setErrors] = useState<ValidationError[]>([]);
  const [successMessage, setSuccessMessage] = useState("");
  const [showImage, setShowImage] = useState(false);
  const [rotation, setRotation] = useState(0);

  const regNumbers = getRegisteredNumbers(csvState);
  const displayRegNumbers = [...regNumbers];
  if (markData.regNo && !displayRegNumbers.includes(markData.regNo)) {
    displayRegNumbers.push(markData.regNo);
  }

  const totals = calculateTotals(markData, settings);

  useEffect(() => {
    setErrors(validateMarks(markData, settings));
  }, [markData, settings]);

  const displayErrors = errors.filter((e) => !(e.field === "regNo" && !markData.regNo));
  const isValid = errors.length === 0;
  const validationErrorCount = displayErrors.length;

  const handleClear = useCallback(() => {
    setMarkData(createEmptyMarkData(settings));
    setSuccessMessage("");
  }, [settings]);

  const handleSubmit = useCallback(() => {
    if (!isValid) return;
    
    const updatedCsv = { ...csvState, dataRows: [...csvState.dataRows] };
    const existingIdx = findRowByRegNo(csvState, markData.regNo);
    
    if (existingIdx >= 0) {
      updatedCsv.dataRows[existingIdx] = { regNo: markData.regNo, markData: markData };
    } else {
      updatedCsv.dataRows.push({ regNo: markData.regNo, markData: markData });
    }
    
    onCsvUpdate(updatedCsv);
    setSuccessMessage(`Marks for ${markData.regNo} saved!`);
    
    setTimeout(() => {
      onBack();
    }, 1000);
  }, [isValid, csvState, markData, onCsvUpdate, onBack]);

  useEffect(() => {
    if (!successMessage) return;
    const t = setTimeout(() => setSuccessMessage(""), 4000);
    return () => clearTimeout(t);
  }, [successMessage]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName.toLowerCase() === 'input' && target.getAttribute('type') === 'text') {
        if (e.key === 'Enter') {
            e.preventDefault();
            if (isValid) handleSubmit();
        }
        return; 
      }

      if (e.key === 'Enter') {
        e.preventDefault();
        if (isValid) handleSubmit();
      } else if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        if (isValid) handleSubmit();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isValid, handleSubmit]);

  let currentQuestion = 1;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="border-b border-border bg-card px-4 sm:px-8 py-4 sm:py-5 flex items-center justify-between shrink-0 shadow-sm">
        <div className="flex items-center gap-3 sm:gap-4 min-w-0">
          <button onClick={onBack} className="text-muted-foreground hover:text-foreground transition-colors shrink-0">
            <ArrowLeft className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <GraduationCap className="w-5 h-5 sm:w-6 sm:h-6 text-primary shrink-0" />
            <h1 className="font-heading font-bold text-sm sm:text-base text-foreground truncate">
              Thaal
            </h1>
          </div>
        </div>
        <div className="flex items-center gap-2 sm:gap-4">
          <div className="hidden sm:flex items-center gap-3">
            <span className="text-xs font-heading text-muted-foreground bg-muted px-3 py-1.5 rounded-md">
              <BookOpen className="w-4 h-4 inline mr-2" />
              {csvFileName}
            </span>
            <span className="text-xs font-heading text-muted-foreground bg-muted px-3 py-1.5 rounded-md">
              {regNumbers.length} Students
            </span>
          </div>
          <button
            onClick={() => setShowImage(!showImage)}
            className="lg:hidden flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-lg border border-border text-muted-foreground hover:bg-muted transition-colors text-xs sm:text-sm font-heading"
          >
            <ImageIcon className="w-4 h-4 sm:w-5 sm:h-5" />
            <span className="hidden xs:inline">Sheet</span>
            <ChevronDown className={`w-3 h-3 sm:w-4 sm:h-4 transition-transform ${showImage ? "rotate-180" : ""}`} />
          </button>
          <div className="h-6 w-px bg-border hidden sm:block mx-1" />
          <ProfileMenu />
        </div>
      </header>

      {showImage && (
        <div className="lg:hidden border-b border-border bg-card">
          <TransformWrapper initialScale={1} minScale={0.5} maxScale={5} centerOnInit>
            {({ zoomIn, zoomOut, centerView }) => (
              <>
                <div className="flex items-center gap-1 p-1.5 sm:p-2 border-b border-border">
                  <button onClick={() => zoomIn()} className="p-1.5 sm:p-2 rounded-md hover:bg-accent hover:text-foreground transition-colors"><ZoomIn className="w-4 h-4" /></button>
                  <button onClick={() => zoomOut()} className="p-1.5 sm:p-2 rounded-md hover:bg-accent hover:text-foreground transition-colors"><ZoomOut className="w-4 h-4" /></button>
                  <button onClick={() => centerView()} className="p-1.5 sm:p-2 rounded-md hover:bg-accent hover:text-foreground transition-colors"><Maximize className="w-4 h-4" /></button>
                  <button onClick={() => setRotation((r) => r - 90)} className="p-1.5 sm:p-2 rounded-md hover:bg-accent hover:text-foreground transition-colors"><RotateLeft className="w-4 h-4" /></button>
                </div>
                <div className="max-h-[40vh] h-[300px] w-full overflow-hidden bg-muted/30 cursor-grab active:cursor-grabbing border-b border-border">
                  <TransformComponent wrapperStyle={{ width: "100%", height: "100%" }} contentStyle={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <img src={answerSheetUrl} alt="Answer sheet" className="max-w-full max-h-full object-contain shadow-sm transition-transform duration-200" style={{ transform: `rotate(${rotation}deg)` }} />
                  </TransformComponent>
                </div>
              </>
            )}
          </TransformWrapper>
        </div>
      )}

      <div className="flex-1 flex overflow-hidden">
        <div className="hidden lg:flex w-[400px] xl:w-[480px] border-r border-border bg-card flex-col shrink-0">
          <TransformWrapper initialScale={1} minScale={0.5} maxScale={5} centerOnInit>
            {({ zoomIn, zoomOut, centerView }) => (
              <>
                <div className="flex items-center gap-2 p-3 border-b border-border bg-muted/10">
                  <button onClick={() => zoomIn()} className="p-2 rounded-md bg-background border border-border shadow-sm hover:bg-accent"><ZoomIn className="w-4 h-4" /></button>
                  <button onClick={() => zoomOut()} className="p-2 rounded-md bg-background border border-border shadow-sm hover:bg-accent"><ZoomOut className="w-4 h-4" /></button>
                  <button onClick={() => centerView()} className="p-2 rounded-md bg-background border border-border shadow-sm hover:bg-accent"><Maximize className="w-4 h-4" /></button>
                  <div className="h-6 w-px bg-border mx-1" />
                  <button onClick={() => setRotation((r) => r - 90)} className="p-2 mr-auto rounded-md bg-background border border-border shadow-sm hover:bg-accent"><RotateLeft className="w-4 h-4" /></button>
                </div>
                <div className="flex-1 w-full relative overflow-hidden bg-muted/20 cursor-grab active:cursor-grabbing">
                  <TransformComponent wrapperStyle={{ width: "100%", height: "100%" }} contentStyle={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <img src={answerSheetUrl} alt="Answer sheet" className="max-w-full max-h-full object-contain pointer-events-none transition-transform duration-200 shadow-sm" style={{ transform: `rotate(${rotation}deg)` }} />
                  </TransformComponent>
                </div>
              </>
            )}
          </TransformWrapper>
        </div>

        <div className="flex-1 overflow-auto bg-muted/10">
          <div className="max-w-3xl mx-auto px-4 sm:px-8 py-6 sm:py-10 space-y-8 sm:space-y-10">
            <div className="bg-card rounded-xl border border-border shadow-sm p-4 sm:p-6">
              <label className="font-heading font-bold text-xs sm:text-sm uppercase tracking-widest text-muted-foreground mb-2 sm:mb-3 block">Student Register Number</label>
              <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                <input
                  type="text"
                  placeholder="Enter Register Number"
                  value={markData.regNo}
                  onChange={(e) => setMarkData((d) => ({ ...d, regNo: e.target.value }))}
                  className="w-full sm:max-w-sm bg-background text-foreground font-data text-base sm:text-lg px-4 py-3 sm:px-5 sm:py-3.5 rounded-lg border border-border focus:border-primary focus:ring-2 focus:ring-ring/20 outline-none shadow-sm"
                />
              </div>
            </div>

            {successMessage && (
              <div className="bg-success/10 border border-success/30 rounded-md px-3 sm:px-4 py-2 sm:py-3">
                <p className="text-success font-heading text-xs sm:text-sm font-medium">✓ {successMessage}</p>
              </div>
            )}

            {settings.parts.filter(p => p.enabled).map((part) => {
              const startQ = currentQuestion;
              currentQuestion += part.questionCount;
              const maxPartTotal = part.questionCount * part.maxMarks;

              if (part.type === "single") {
                const arr = markData.parts[part.id] as number[] || Array(part.questionCount).fill(0);
                return (
                  <div key={part.id} className="bg-card rounded-xl border border-border shadow-sm p-3 sm:p-5">
                    <div className="flex items-center gap-2 mb-3 sm:mb-4">
                      <div className="w-1.5 h-6 bg-primary rounded-full" />
                      <h3 className="font-heading font-bold text-sm sm:text-base text-foreground uppercase">{part.name}: Q{startQ}–{startQ + part.questionCount - 1} (Max {part.maxMarks} each)</h3>
                    </div>
                    <div className="grid grid-cols-5 gap-2 sm:gap-4 p-3 sm:p-5 bg-muted/30 rounded-lg border border-border">
                      {arr.map((val, i) => (
                        <div key={i}>
                          <span className="text-[10px] sm:text-xs text-muted-foreground font-heading uppercase block text-center mb-1.5 font-bold">Q{startQ + i}</span>
                          <MarkSelect 
                            value={val} field={`parts.${part.id}.${i}`} errors={errors} max={part.maxMarks} allowHalfMarks={true} 
                            onChange={(v) => {
                              const newArr = [...arr];
                              newArr[i] = v;
                              setMarkData(d => ({...d, parts: {...d.parts, [part.id]: newArr}}));
                            }} 
                          />
                        </div>
                      ))}
                    </div>
                    <SectionTotal label={`${part.name} Total`} value={totals.partTotals[part.id]} max={maxPartTotal} />
                  </div>
                );
              } else {
                const arr = markData.parts[part.id] as {a: number, b: number}[] || Array(part.questionCount).fill({a:0, b:0});
                return (
                  <div key={part.id} className="bg-card rounded-xl border border-border shadow-sm p-3 sm:p-5">
                    <div className="flex items-center gap-2 mb-3 sm:mb-4">
                      <div className="w-1.5 h-6 bg-primary rounded-full" />
                      <h3 className="font-heading font-bold text-sm sm:text-base text-foreground uppercase">{part.name}: Q{startQ}–{startQ + part.questionCount - 1} (Max {part.maxMarks} each)</h3>
                    </div>
                    <div className="border border-border rounded-lg overflow-hidden bg-background">
                      <div className="grid grid-cols-[1fr_1fr_1fr_auto_1fr] gap-2 sm:gap-4 bg-muted/80 px-2 sm:px-4 py-2 sm:py-3 text-[10px] sm:text-xs font-heading font-semibold text-muted-foreground uppercase tracking-wider items-center border-b border-border">
                        <span>Q.No</span><span className="text-center">(A)</span><span className="text-center">(B)</span><span className="text-center w-10 sm:w-12"></span><span className="text-right">Sub</span>
                      </div>
                      <div className="divide-y divide-border">
                        {arr.map((pair, i) => (
                          <div key={i} className="grid grid-cols-[1fr_1fr_1fr_auto_1fr] items-center px-2 sm:px-4 py-3 sm:py-4 gap-2 sm:gap-4 hover:bg-muted/10 transition-colors">
                            <span className="font-data text-sm sm:text-base text-foreground font-medium">Q{startQ + i}</span>
                            <MarkSelect value={pair.a} field={`parts.${part.id}.${i}.a`} rowField={`parts.${part.id}.${i}`} errors={errors} max={part.maxMarks} allowHalfMarks={false} onChange={(v) => {
                              const newArr = [...arr];
                              newArr[i] = {...newArr[i], a: v};
                              setMarkData(d => ({...d, parts: {...d.parts, [part.id]: newArr}}));
                            }} />
                            <MarkSelect value={pair.b} field={`parts.${part.id}.${i}.b`} rowField={`parts.${part.id}.${i}`} errors={errors} max={part.maxMarks} allowHalfMarks={false} onChange={(v) => {
                              const newArr = [...arr];
                              newArr[i] = {...newArr[i], b: v};
                              setMarkData(d => ({...d, parts: {...d.parts, [part.id]: newArr}}));
                            }} />
                            <div className="flex justify-center shrink-0">
                              <button
                                onClick={() => {
                                  let isB = pair.b > pair.a;
                                  // if they are equal, intelligently add to the one that currently has a mark (or A if both 0)
                                  if (pair.a === pair.b) {
                                    isB = false; // default to A
                                  }
                                  const newArr = [...arr];
                                  if (isB) newArr[i] = {...newArr[i], b: Math.min(part.maxMarks, pair.b + 0.5)};
                                  else newArr[i] = {...newArr[i], a: Math.min(part.maxMarks, pair.a + 0.5)};
                                  setMarkData(d => ({...d, parts: {...d.parts, [part.id]: newArr}}));
                                }}
                                className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-accent text-accent-foreground border border-border hover:bg-primary/20 hover:text-primary hover:border-primary/30 font-data text-sm sm:text-base font-extrabold transition-all flex items-center justify-center shrink-0 shadow-sm"
                                type="button"
                              >+½</button>
                            </div>
                            <span className="font-data text-sm sm:text-base text-right font-bold text-primary">{String(Math.max(pair.a, pair.b)).padStart(2, "0")}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    <SectionTotal label={`${part.name} Total`} value={totals.partTotals[part.id]} max={maxPartTotal} />
                  </div>
                );
              }
            })}

            <div className="bg-card border-2 border-primary/20 rounded-xl px-4 sm:px-6 py-4 sm:py-6 flex items-center justify-between shadow-sm">
              <span className="font-heading font-bold text-sm sm:text-base text-foreground uppercase tracking-widest">Grand Total</span>
              <span className="font-data font-bold text-2xl sm:text-3xl text-primary">
                {totals.grandTotal} / {settings.parts.filter(p=>p.enabled).reduce((s, p) => s + (p.questionCount * p.maxMarks), 0)}
              </span>
            </div>
            <div className="h-4 sm:h-8" />
          </div>
        </div>
      </div>

      <footer className="border-t border-border bg-card px-4 sm:px-8 py-3 sm:py-5 shrink-0 shadow-sm">
        <div className="flex items-center justify-between gap-2 sm:gap-4">
          <div className="flex items-center gap-2 sm:gap-3">
            <button onClick={handleClear} className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-5 py-2 sm:py-3 rounded-lg border border-border text-muted-foreground hover:bg-muted font-heading text-xs sm:text-base font-semibold"><RotateCcw className="w-4 h-4" />Clear</button>
            <button onClick={onBack} className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-5 py-2 sm:py-3 rounded-lg border border-border text-muted-foreground hover:bg-muted font-heading text-xs sm:text-base font-semibold"><SkipForward className="w-4 h-4" />Skip</button>
          </div>
          <div className="flex items-center gap-3 sm:gap-4">
            <button onClick={onBack} className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-5 py-2.5 sm:py-3.5 rounded-lg border border-border text-muted-foreground hover:bg-muted font-heading text-sm sm:text-base font-bold shadow-sm">Back</button>
            {validationErrorCount > 0 && (
              <div className="flex items-center gap-2 px-3 sm:px-4 py-2 sm:py-2.5 bg-destructive/10 rounded-lg">
                <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 text-destructive" />
                <span className="font-heading text-xs sm:text-sm text-destructive font-bold">{validationErrorCount} Error{validationErrorCount !== 1 ? 's' : ''}</span>
              </div>
            )}
            <button
              disabled={!isValid}
              onClick={handleSubmit}
              className={`flex items-center gap-2 px-5 sm:px-8 py-2.5 sm:py-3.5 rounded-lg font-heading text-sm sm:text-base font-bold transition-all whitespace-nowrap ${isValid ? "bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg shadow-primary/25" : "bg-muted text-muted-foreground cursor-not-allowed"}`}
            >
              <Save className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="hidden sm:inline">Submit & Save (Enter)</span>
              <span className="sm:hidden">Submit</span>
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
