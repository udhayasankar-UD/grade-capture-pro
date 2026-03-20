import { useRef, useState, useEffect } from "react";
import { FileText, Camera, Upload, Download, Search, GraduationCap, X, ChevronRight, Image as ImageIcon, Coins, Pencil, Save } from "lucide-react";
import { CSVState, generateXLSXString } from "@/lib/csv-utils";
import { calculateTotals } from "@/lib/types";
import { useAuth } from "@/lib/auth-context";
import { ProfileMenu } from "@/components/ProfileMenu";
import { useSettings } from "@/lib/settings-context";

interface SpreadsheetDashboardProps {
  csvState: CSVState;
  csvFileName: string;
  isProcessing: boolean;
  processingMessage?: string;
  onImageUpload: (file: File) => void;
  onCancel?: () => void;
  onBack: () => void;
  onCsvUpdate?: (csv: CSVState) => void;
}

export function SpreadsheetDashboard({
  csvState,
  csvFileName,
  isProcessing,
  processingMessage = "Extracting Marks...",
  onImageUpload,
  onCancel,
  onBack,
  onCsvUpdate,
}: SpreadsheetDashboardProps) {
  const { credits } = useAuth();
  const { settings } = useSettings();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editingMarkData, setEditingMarkData] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortConfig, setSortConfig] = useState<{ key: 'regNo' | 'total', direction: 'asc' | 'desc' } | null>(null);
  const [viewMode, setViewMode] = useState<'roster' | 'spreadsheet'>('roster');
  const [pendingImage, setPendingImage] = useState<{ file: File; url: string } | null>(null);
  const [fakeProgress, setFakeProgress] = useState(0);
  const [fakeMessage, setFakeMessage] = useState("Initializing AI Scanner...");

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isProcessing) {
      interval = setInterval(() => {
        setFakeProgress(prev => {
          if (processingMessage === "Complete") {
            setFakeMessage("Extraction Successful!");
            return 100;
          }
          let step = 0;
          if (prev < 20) step = 0.8;
          else if (prev < 50) step = 0.5;
          else if (prev < 75) step = 0.3;
          else if (prev < 90) step = 0.15;
          else if (prev < 95) step = 0.05;
          else if (prev < 98) step = 0.01;
          const next = Math.min(prev + step, 99);
          if (processingMessage && processingMessage.includes("Retry")) {
            setFakeMessage(processingMessage);
          } else {
            if (next >= 80) setFakeMessage("Finalizing Output...");
            else if (next >= 45) setFakeMessage("Analyzing Results...");
            else if (next >= 15) setFakeMessage("Scanning Answer Sheet...");
            else setFakeMessage("Initializing AI Scanner...");
          }
          return next;
        });
      }, 100);
    } else {
      setFakeProgress(0);
      setFakeMessage("Initializing...");
    }
    return () => clearInterval(interval);
  }, [isProcessing, processingMessage]);

  const parsedStudents = csvState.dataRows.map((row) => {
    const isGraded = !!row.markData;
    const totals = row.markData ? calculateTotals(row.markData, settings) : null;
    return {
      regNo: row.regNo,
      total: isGraded ? totals?.grandTotal : null,
      status: isGraded ? "Graded" : "Pending",
      rawRow: row,
      markData: row.markData,
      totals
    };
  });

  const students = parsedStudents
    .filter(s => s.regNo.toLowerCase().includes(searchQuery.toLowerCase()))
    .sort((a, b) => {
      if (!sortConfig) return 0;
      if (sortConfig.key === 'total') {
        const valA = a.total ?? -1;
        const valB = b.total ?? -1;
        return sortConfig.direction === 'asc' ? valA - valB : valB - valA;
      }
      return sortConfig.direction === 'asc' ? a.regNo.localeCompare(b.regNo) : b.regNo.localeCompare(a.regNo);
    });

  const gradedCount = parsedStudents.filter((s) => s.status === "Graded").length;

  const handleDownload = () => {
    const blob = generateXLSXString(csvState, settings);
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = csvFileName.replace(/\.[^/.]+$/, "") + "_Graded.xlsx";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="bg-card border-b border-border px-4 md:px-8 py-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-sm">
        <div className="flex items-center gap-4 w-full md:w-auto">
          <button onClick={onBack} className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors shrink-0">
            <ChevronRight className="w-5 h-5 rotate-180" />
            <span className="font-heading font-medium text-sm hidden sm:inline">Back</span>
          </button>
          <div className="h-6 w-px bg-border shrink-0" />
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
              <GraduationCap className="w-5 h-5 text-primary" />
            </div>
            <div className="min-w-0">
              <h1 className="font-heading font-bold text-sm text-foreground truncate">
                {csvFileName}
              </h1>
              <p className="text-[11px] text-muted-foreground font-medium truncate">
                {gradedCount} Graded
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-end">
          <div className="flex items-center gap-2 bg-[#E8F3F1] dark:bg-[#34A853]/10 px-3 py-1.5 rounded-full border border-[#34A853]/10 dark:border-[#34A853]/20">
            <Coins className="w-3.5 h-3.5 text-[#34A853]" />
            <span className="text-xs font-bold text-[#34A853]">{credits} Credits</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setViewMode(viewMode === 'roster' ? 'spreadsheet' : 'roster')}
              className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-lg font-heading text-sm font-semibold transition-all shadow-sm ${
                viewMode === 'spreadsheet' 
                  ? 'bg-primary text-primary-foreground hover:bg-primary/90' 
                  : 'bg-card text-foreground border border-border hover:bg-muted'
              }`}
            >
              <FileText className="w-4 h-4" />
              <span className="hidden sm:inline">{viewMode === 'spreadsheet' ? 'View Roster' : 'Spreadsheet'}</span>
              <span className="sm:hidden">{viewMode === 'spreadsheet' ? 'Roster' : 'Sheet'}</span>
            </button>

            <button
              onClick={handleDownload}
              className="flex items-center gap-2 bg-[#0F172A] text-white dark:bg-white dark:text-black font-heading text-sm font-semibold px-3 sm:px-4 py-2 rounded-lg transition-all shadow-sm hover:opacity-90"
            >
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">Download XLSX</span>
            </button>
            <div className="h-6 w-px bg-border hidden md:block mx-1" />
            <ProfileMenu />
          </div>
        </div>
      </header>

      {isProcessing && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[150] flex items-center justify-center p-4">
          <div className="bg-card w-full max-w-sm rounded-2xl border border-border shadow-2xl p-6 flex flex-col items-center animate-in fade-in zoom-in-95">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-5 relative">
              <div className="absolute inset-0 border-4 border-primary/30 rounded-full animate-ping" />
              <Camera className="w-8 h-8 text-primary animate-pulse" />
            </div>
            <h3 className="font-heading font-bold text-lg text-foreground mb-4">Reading Answer Sheet</h3>
            
            <div className="w-full bg-muted rounded-full h-2.5 mb-2 overflow-hidden border border-border">
               <div className="h-full bg-primary transition-all duration-75 ease-linear" style={{ width: `${Math.min(fakeProgress, 100)}%` }} />
            </div>
            
            <div className="flex w-full items-center justify-between mb-6 px-1">
               <p className="font-heading font-medium text-muted-foreground text-sm animate-pulse">{fakeMessage}</p>
               <p className="font-data font-bold text-primary text-sm">{Math.floor(fakeProgress)}%</p>
            </div>
            
            <button onClick={onCancel} className="flex items-center justify-center gap-2 w-full text-destructive hover:bg-destructive/10 font-heading text-sm font-bold py-2.5 rounded-xl transition-all border border-transparent hover:border-destructive/20">
               Cancel Extraction
            </button>
          </div>
        </div>
      )}

      {pendingImage && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[150] flex items-center justify-center p-4">
          <div className="bg-card w-full max-w-sm rounded-2xl p-5 shadow-2xl border border-border animate-in fade-in zoom-in-95 duration-200 flex flex-col gap-4">
              <h2 className="font-heading font-bold text-foreground text-lg">Image Selected</h2>
              <div className="relative aspect-[3/4] rounded-xl overflow-hidden border border-border bg-muted/30 shadow-inner group">
                <img src={pendingImage.url} alt="Preview" className="w-full h-full object-contain" />
              </div>
              <div className="grid grid-cols-2 gap-3 mt-1">
                <button
                  onClick={() => { URL.revokeObjectURL(pendingImage.url); setPendingImage(null); }}
                  className="flex items-center justify-center gap-2 bg-card text-foreground border border-border hover:bg-muted font-heading text-sm font-bold py-3 rounded-xl transition-all shadow-sm"
                >Cancel</button>
                <button
                  onClick={() => { onImageUpload(pendingImage.file); setPendingImage(null); }}
                  className="flex items-center justify-center gap-2 bg-primary text-primary-foreground hover:bg-primary/90 font-heading text-sm font-bold py-3 rounded-xl transition-all shadow-md"
                >Extract</button>
              </div>
          </div>
        </div>
      )}

      <main className="flex-1 max-w-[1400px] w-full mx-auto px-4 md:px-8 py-6 flex flex-col gap-6 lg:flex-row">
        <div className="flex flex-col gap-6 w-full lg:w-80 shrink-0">
          <div className="bg-card rounded-2xl border border-border p-6 shadow-sm">
            <h2 className="font-heading font-bold text-foreground text-base mb-5">Grade Next Student</h2>
            
            <div className="flex flex-col gap-4">
              <button
                onClick={() => cameraInputRef.current?.click()}
                className="flex items-center justify-center gap-3 w-full bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20 font-heading text-base font-bold px-6 py-4 rounded-xl transition-all shadow-sm"
              >
                <Camera className="w-5 h-5" />
                Open Camera
              </button>
              <input type="file" accept="image/*" capture="environment" className="hidden" ref={cameraInputRef} onChange={(e) => { const file = e.target.files?.[0]; if (file) setPendingImage({ file, url: URL.createObjectURL(file) }); }} />

              <div className="relative my-2">
                <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-border" /></div>
                <div className="relative flex justify-center text-[10px] font-bold uppercase tracking-widest"><span className="bg-card px-3 text-muted-foreground">or</span></div>
              </div>

              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center justify-center gap-3 w-full bg-card text-foreground hover:bg-muted border border-border font-heading text-base font-bold px-6 py-4 rounded-xl transition-all shadow-sm"
              >
                <Upload className="w-5 h-5" />
                Upload Image
              </button>
              <input type="file" accept="image/*,.jpg,.jpeg,.png" className="hidden" ref={fileInputRef} onChange={(e) => { const file = e.target.files?.[0]; if (file) setPendingImage({ file, url: URL.createObjectURL(file) }); }} />
            </div>
          </div>

          <div className="bg-primary/5 border border-primary/10 rounded-2xl p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="font-heading font-bold text-xs text-muted-foreground uppercase tracking-wider">Total Evaluated</span>
              <span className="font-data font-bold text-primary text-base">{gradedCount} Sheets</span>
            </div>
          </div>
        </div>

        <div className="flex-1 bg-card rounded-2xl border border-border flex flex-col overflow-hidden shadow-sm min-h-[500px]">
          <div className="p-5 border-b border-border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <h2 className="font-heading font-bold text-foreground text-base">Class Data</h2>
            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input 
                type="text" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search Reg No..." 
                className="pl-9 pr-4 py-2 text-sm font-medium bg-muted border border-border rounded-lg focus:border-primary focus:ring-1 focus:ring-primary/20 outline-none w-full transition-all"
              />
            </div>
          </div>
          
          <div className="flex-1 overflow-auto relative">
            {viewMode === 'spreadsheet' ? (
              <table className="w-full text-left border-collapse whitespace-nowrap">
                <thead>
                  <tr className="bg-muted/80 border-b border-border">
                    <th colSpan={3} className="sticky top-0 left-0 z-30 bg-muted p-0 border-r border-border">
                      <div className="px-3 py-2 border-b border-border text-[10px] uppercase font-bold text-muted-foreground text-center tracking-wider">Student Info</div>
                    </th>
                    {settings.parts.filter(p=>p.enabled).map(part => {
                      const colspan = part.type === "single" ? part.questionCount : part.questionCount * 2;
                      return (
                        <th key={part.id} colSpan={colspan} className="sticky top-0 z-20 bg-muted p-0 border-r border-border text-[10px] uppercase font-bold text-center tracking-wider px-3">{part.name} (Max {part.maxMarks * part.questionCount})</th>
                      );
                    })}
                    <th colSpan={settings.parts.filter(p=>p.enabled).length + 1} className="sticky top-0 z-20 bg-muted p-0 text-[10px] uppercase font-bold text-muted-foreground text-center tracking-wider">Totals</th>
                  </tr>
                  <tr className="bg-muted/80 text-[10px]">
                    <th className="sticky top-8 left-0 z-30 bg-muted px-2 py-2 font-bold text-muted-foreground text-center w-8 border-r border-b border-border shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">#</th>
                    <th className="sticky top-8 left-8 z-30 bg-muted px-3 py-2 font-bold text-foreground border-r border-b border-border cursor-pointer hover:bg-accent shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]" onClick={() => setSortConfig({ key: 'regNo', direction: sortConfig?.key === 'regNo' && sortConfig.direction === 'asc' ? 'desc' : 'asc' })}>
                      REG NO {sortConfig?.key === 'regNo' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : ''}
                    </th>
                    <th className="sticky top-8 left-[120px] z-30 bg-muted px-2 py-2 font-bold text-foreground text-center w-16 border-r border-b border-border shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">STATUS</th>
                    
                    {(() => {
                        let q = 1;
                        return settings.parts.filter(p=>p.enabled).map(part => {
                          const cols = [];
                          for (let i=0; i<part.questionCount; i++) {
                            if (part.type === "single") {
                              cols.push(<th key={`${part.id}_${q}`} className="sticky top-8 bg-muted px-2 py-2 text-center border-r border-b border-border min-w-[32px]">Q{q}</th>);
                            } else {
                              cols.push(
                                <th key={`${part.id}_${q}a`} className="sticky top-8 bg-muted px-2 py-2 text-center border-r border-b border-border min-w-[32px]">{q}a</th>,
                                <th key={`${part.id}_${q}b`} className="sticky top-8 bg-muted px-2 py-2 text-center border-r border-b border-border min-w-[32px]">{q}b</th>
                              );
                            }
                            q++;
                          }
                          return cols;
                        });
                    })()}

                    {settings.parts.filter(p=>p.enabled).map(part => (
                      <th key={`t_${part.id}`} className="sticky top-8 bg-muted px-3 py-2 text-center border-r border-b border-border">{part.id}</th>
                    ))}
                    
                    <th className="sticky top-8 bg-muted px-3 py-2 text-center text-primary font-bold cursor-pointer hover:bg-accent border-b border-border" onClick={() => setSortConfig({ key: 'total', direction: sortConfig?.key === 'total' && sortConfig.direction === 'desc' ? 'asc' : 'desc' })}>
                      TOTAL {sortConfig?.key === 'total' ? (sortConfig.direction === 'desc' ? '↓' : '↑') : ''}
                    </th>
                  </tr>
                </thead>
                <tbody className="text-xs">
                  {students.map((s, idx) => (
                    <tr key={idx} className="border-b border-border hover:bg-muted/50 transition-colors group">
                      <td className="sticky left-0 bg-card group-hover:bg-muted/50 px-2 py-2.5 text-center text-muted-foreground border-r border-border font-data z-10 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)]">{idx + 1}</td>
                      <td className="sticky left-8 bg-card group-hover:bg-muted/50 px-3 py-2.5 font-bold text-foreground border-r border-border font-data z-10 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)]">
                        <button onClick={() => setSelectedStudent(s.rawRow)} className="hover:text-primary transition-colors">{s.regNo}</button>
                      </td>
                      <td className="sticky left-[120px] bg-card group-hover:bg-muted/50 px-2 py-2.5 text-center border-r border-border font-bold z-10 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)]">
                        <span className={`inline-block w-1.5 h-1.5 rounded-full ${s.status === "Graded" ? "bg-primary" : "bg-muted-foreground"}`} />
                      </td>
                      
                      {settings.parts.filter(p=>p.enabled).map(part => {
                          const cols = [];
                          const pData = s.markData?.parts[part.id];
                          for (let i=0; i<part.questionCount; i++) {
                            if (part.type === "single") {
                               const val = pData ? (pData as number[])[i] : null;
                               cols.push(<td key={`${s.regNo}_${part.id}_${i}`} className="px-2 py-2.5 text-center border-r border-border font-data">{val && val > 0 ? val : '-'}</td>);
                            } else {
                               const pair = pData ? (pData as {a: number, b: number}[])[i] : null;
                               cols.push(
                                <td key={`${s.regNo}_${part.id}_${i}a`} className="px-2 py-2.5 text-center border-r border-border bg-muted/20 font-data">{pair && pair.a > 0 ? pair.a : '-'}</td>,
                                <td key={`${s.regNo}_${part.id}_${i}b`} className="px-2 py-2.5 text-center border-r border-border font-data">{pair && pair.b > 0 ? pair.b : '-'}</td>
                               );
                            }
                          }
                          return cols;
                      })}

                      {settings.parts.filter(p=>p.enabled).map(part => (
                          <td key={`${s.regNo}_t_${part.id}`} className="px-3 py-2.5 text-center font-bold border-r border-border font-data">{s.totals?.partTotals[part.id] ?? '-'}</td>
                      ))}

                      <td className="px-3 py-2.5 text-center font-bold text-primary bg-primary/5 font-data">{s.total ?? '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-muted/50 text-[11px] font-bold text-muted-foreground uppercase tracking-wider border-b border-border">
                    <th className="px-6 py-4 text-center w-16 italic font-heading">#</th>
                    <th className="px-6 py-4 font-heading">Register No</th>
                    <th className="px-6 py-4 text-right font-heading">Grand Total</th>
                    <th className="px-6 py-4 text-center w-32 font-heading">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {students.map((s, idx) => (
                    <tr key={idx} className="hover:bg-muted/30 transition-colors group">
                      <td className="px-6 py-4.5 text-center text-muted-foreground font-data italic">{idx + 1}</td>
                      <td className="px-6 py-4.5">
                        <button 
                          onClick={() => setSelectedStudent(s.rawRow)}
                          className="font-data font-bold text-foreground text-sm hover:text-primary transition-colors"
                        >
                          {s.regNo}
                        </button>
                      </td>
                      <td className="px-6 py-4.5 text-right font-data font-bold text-primary text-base">
                        {s.total ?? '-'}
                      </td>
                      <td className="px-6 py-4.5 text-center">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border ${
                          s.status === 'Graded' ? 'bg-primary/10 text-primary border-primary/20' : 'bg-muted text-muted-foreground border-border'
                        }`}>
                          {s.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
            {students.length === 0 && (
              <div className="flex flex-col items-center justify-center p-20 text-center mx-auto absolute top-10 left-0 right-0">
                <Search className="w-12 h-12 text-muted-foreground/30 mb-4" />
                <h3 className="text-foreground font-bold text-lg">No students found</h3>
                <p className="text-muted-foreground text-sm">Use the left panel to scan and add students</p>
              </div>
            )}
          </div>
        </div>
      </main>

      {selectedStudent && (() => {
        const currentMarkData = isEditing ? editingMarkData : selectedStudent.markData;
        const currentTotals = currentMarkData ? calculateTotals(currentMarkData, settings) : null;
        let qCounter = 1;

        const handleStartEdit = () => {
          setEditingMarkData(JSON.parse(JSON.stringify(selectedStudent.markData)));
          setIsEditing(true);
        };

        const handleSaveEdit = () => {
          if (!editingMarkData || !onCsvUpdate) return;
          const rowIndex = csvState.dataRows.findIndex(r => r.regNo === selectedStudent.regNo);
          if (rowIndex >= 0) {
            const newRows = [...csvState.dataRows];
            newRows[rowIndex] = { ...newRows[rowIndex], markData: editingMarkData };
            onCsvUpdate({ ...csvState, dataRows: newRows });
            setSelectedStudent({ ...selectedStudent, markData: editingMarkData });
          }
          setIsEditing(false);
          setEditingMarkData(null);
        };

        const handleCancelEdit = () => {
          setIsEditing(false);
          setEditingMarkData(null);
        };

        const updateEditMark = (partId: string, questionIdx: number, field: 'value' | 'a' | 'b', val: number) => {
          const newData = JSON.parse(JSON.stringify(editingMarkData));
          if (field === 'value') {
            newData.parts[partId][questionIdx] = val;
          } else {
            newData.parts[partId][questionIdx][field] = val;
          }
          setEditingMarkData(newData);
        };

        return (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
          <div className="bg-card w-full max-w-2xl rounded-2xl border border-border shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-border flex items-center justify-between bg-muted/30">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <GraduationCap className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-heading font-bold text-lg text-foreground">Student {selectedStudent.regNo}</h3>
                  <p className="text-sm font-heading text-muted-foreground">{isEditing ? 'Editing Marks' : 'Grade Breakdown'}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {selectedStudent.markData && !isEditing && (
                  <button 
                    onClick={handleStartEdit} 
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-heading font-semibold text-primary hover:bg-primary/10 transition-colors border border-primary/20"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                    Edit
                  </button>
                )}
                <button onClick={() => { setSelectedStudent(null); handleCancelEdit(); }} className="p-2 rounded-full hover:bg-muted text-muted-foreground transition-colors"><X className="w-5 h-5" /></button>
              </div>
            </div>

            <div className="p-6 overflow-y-auto max-h-[70vh]">
              {currentMarkData ? (() => {
                return (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {settings.parts.filter(p=>p.enabled).map(part => {
                        const startQ = qCounter;
                        qCounter += part.questionCount;
                        const pData = currentMarkData.parts[part.id];
                        return (
                          <div key={part.id} className="bg-card border border-border rounded-xl p-4 shadow-sm">
                            <h4 className="font-heading font-bold text-sm text-muted-foreground uppercase mb-3 border-b border-border pb-2">{part.name}</h4>
                            <ul className="space-y-2 mb-4 text-sm font-data">
                               {part.type === "single" ? (
                                  (pData as number[] || []).map((v: number, i: number) => (
                                    <li key={i} className="flex justify-between items-center">
                                      <span className="text-muted-foreground">Q{startQ + i}</span>
                                      {isEditing ? (
                                        <input 
                                          type="number" min={0} max={part.maxMarks} step={0.5}
                                          value={v}
                                          onChange={(e) => updateEditMark(part.id, i, 'value', parseFloat(e.target.value) || 0)}
                                          className="w-16 px-2 py-1 text-right bg-background border border-border rounded-md font-semibold text-sm"
                                        />
                                      ) : (
                                        <span className="font-semibold">{v}</span>
                                      )}
                                    </li>
                                  ))
                               ) : (
                                  (pData as {a: number, b: number}[] || []).map((p: {a: number, b: number}, i: number) => (
                                    <li key={i} className="flex justify-between items-center">
                                      <span className="text-muted-foreground">Q{startQ + i}</span>
                                      {isEditing ? (
                                        <div className="flex items-center gap-1">
                                          <input 
                                            type="number" min={0} max={part.maxMarks} step={0.5}
                                            value={p.a}
                                            onChange={(e) => updateEditMark(part.id, i, 'a', parseFloat(e.target.value) || 0)}
                                            className="w-14 px-1.5 py-1 text-center bg-background border border-border rounded-md font-semibold text-xs"
                                            title="Option A"
                                          />
                                          <span className="text-muted-foreground text-xs">/</span>
                                          <input 
                                            type="number" min={0} max={part.maxMarks} step={0.5}
                                            value={p.b}
                                            onChange={(e) => updateEditMark(part.id, i, 'b', parseFloat(e.target.value) || 0)}
                                            className="w-14 px-1.5 py-1 text-center bg-background border border-border rounded-md font-semibold text-xs"
                                            title="Option B"
                                          />
                                        </div>
                                      ) : (
                                        <span className="font-semibold">{Math.max(p.a, p.b)}</span>
                                      )}
                                    </li>
                                  ))
                               )}
                            </ul>
                            <div className="pt-2 border-t border-border flex justify-between font-bold">
                              <span className="text-sm font-heading uppercase text-muted-foreground">Total</span>
                              <span className="text-primary font-data">{currentTotals?.partTotals[part.id]}</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    <div className="bg-primary/5 border-2 border-primary/20 rounded-xl px-6 py-4 flex items-center justify-between shadow-sm">
                      <span className="font-heading font-bold text-base text-foreground uppercase tracking-widest">Grand Total</span>
                      <span className="font-data font-bold text-3xl text-primary">{currentTotals?.grandTotal}</span>
                    </div>
                  </div>
                );
              })() : (
                <div className="py-12 flex flex-col items-center justify-center text-center">
                  <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4"><FileText className="w-8 h-8 text-muted-foreground/50" /></div>
                  <h4 className="font-heading font-bold text-lg text-foreground mb-1">Not Graded Yet</h4>
                  <p className="text-muted-foreground text-sm max-w-sm">Use the upload card on the dashboard to extract marks.</p>
                </div>
              )}
            </div>
            
            <div className="px-6 py-4 bg-muted/30 border-t border-border flex justify-end gap-3">
              {isEditing ? (
                <>
                  <button onClick={handleCancelEdit} className="font-heading font-semibold text-sm px-5 py-2 rounded-lg text-muted-foreground hover:bg-muted transition-colors">Cancel</button>
                  <button onClick={handleSaveEdit} className="flex items-center gap-2 font-heading font-semibold text-sm px-5 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors">
                    <Save className="w-4 h-4" />
                    Save Changes
                  </button>
                </>
              ) : (
                <button onClick={() => { setSelectedStudent(null); handleCancelEdit(); }} className="font-heading font-semibold text-sm px-6 py-2 rounded-lg bg-secondary text-foreground hover:bg-secondary/80 border border-border transition-colors">Close</button>
              )}
            </div>
          </div>
        </div>
        );
      })()}
    </div>
  );
}
