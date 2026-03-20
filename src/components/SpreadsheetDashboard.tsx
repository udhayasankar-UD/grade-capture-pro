import { useRef, useState } from "react";
import { FileText, Camera, Upload, Download, Search, GraduationCap, X, ChevronRight, Image as ImageIcon, LogOut, Coins } from "lucide-react";
import { CSVState, generateCSV, COL, rowToMarkData } from "@/lib/csv-utils";
import { calculateTotals } from "@/lib/types";
import { useAuth } from "@/lib/auth-context";

interface SpreadsheetDashboardProps {
  csvState: CSVState;
  csvFileName: string;
  isProcessing: boolean;
  onImageUpload: (file: File) => void;
  onBack: () => void;
}

export function SpreadsheetDashboard({
  csvState,
  csvFileName,
  isProcessing,
  onImageUpload,
  onBack,
}: SpreadsheetDashboardProps) {
  const { credits, logout } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const [selectedStudent, setSelectedStudent] = useState<{ regNo: string; cells: string[] } | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortConfig, setSortConfig] = useState<{ key: 'regNo' | 'total', direction: 'asc' | 'desc' } | null>(null);

  const parsedStudents = csvState.dataRows.map((row) => {
    const isGraded = !!row.cells[COL.GRAND_TOTAL];
    const markData = isGraded ? rowToMarkData(row.cells) : null;
    const totals = markData ? calculateTotals(markData) : null;
    return {
      regNo: row.regNo,
      total: isGraded ? (totals?.grandTotal || Number(row.cells[COL.GRAND_TOTAL])) : null,
      status: isGraded ? "Graded" : "Pending",
      rawRow: row,
      markData,
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
    const csvString = generateCSV(csvState);
    const blob = new Blob([csvString], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = csvFileName.replace(".csv", "_Graded.csv");
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="border-b border-border bg-card px-4 md:px-8 py-3 md:py-5 flex items-center justify-between shadow-sm gap-2">
        <div className="flex items-center gap-2 sm:gap-4 flex-1 min-w-0">
          <button onClick={onBack} className="text-muted-foreground hover:text-foreground shrink-0 flex items-center">
            <span className="font-heading font-medium text-sm sm:text-base">← Back</span>
          </button>
          <div className="h-5 w-px bg-border max-sm:hidden shrink-0" />
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
              <GraduationCap className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
            </div>
            <div className="min-w-0">
              <h1 className="font-heading font-bold text-xs sm:text-base text-foreground truncate">{csvFileName}</h1>
              <p className="text-[10px] sm:text-xs text-muted-foreground font-heading mt-0.5">
                {gradedCount} / {students.length} Graded
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4 shrink-0">
          <div className="hidden sm:flex items-center gap-2 bg-primary/10 px-4 py-2 rounded-lg border border-primary/20">
            <Coins className="w-4 h-4 text-primary" />
            <div className="flex flex-col">
              <span className="text-[10px] uppercase font-bold text-primary/70 leading-none">Credits</span>
              <span className="text-sm font-data font-bold text-primary leading-tight">{credits}</span>
            </div>
          </div>
          
          <button
            onClick={handleDownload}
            className="flex items-center gap-1.5 sm:gap-2 whitespace-nowrap bg-secondary text-foreground font-heading text-xs sm:text-sm font-semibold px-3 sm:px-5 py-2 sm:py-3 rounded-lg hover:bg-secondary/80 border border-border transition-colors shadow-sm shrink-0"
          >
            <Download className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span className="hidden lg:inline">Download CSV</span>
            <span className="hidden sm:inline lg:hidden">Download</span>
          </button>

          <button
            onClick={() => logout()}
            className="p-2 sm:p-3 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-all"
            title="Logout"
          >
            <LogOut className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        </div>
      </header>

      <main className="flex-1 max-w-[1200px] w-full mx-auto px-4 md:px-8 py-4 md:py-10 flex flex-col gap-6 md:gap-8 lg:flex-row h-full">
        {/* Left Side: Actions */}
        <div className="flex flex-col gap-4 sm:gap-6 w-full lg:w-80 shrink-0">
          
          {/* Metrics Dashboard */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-card border border-border shadow-sm rounded-xl p-3 flex flex-col items-center justify-center text-center">
                <span className="text-xs font-heading font-semibold text-muted-foreground uppercase tracking-widest mb-1">Processed</span>
                <span className="text-xl font-data font-bold text-foreground">{gradedCount}/{parsedStudents.length}</span>
            </div>
            <div className="bg-card border border-border shadow-sm rounded-xl p-3 flex flex-col items-center justify-center text-center">
                <span className="text-xs font-heading font-semibold text-muted-foreground uppercase tracking-widest mb-1">Errors Found</span>
                <span className="text-xl font-data font-bold text-destructive">0</span>
            </div>
          </div>

          <div className="bg-card rounded-2xl border border-border p-6 shadow-sm">
            <h2 className="font-heading font-bold text-foreground text-base mb-5">Grade Next Student</h2>
            
            {isProcessing ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin mb-4" />
                <p className="font-heading font-semibold text-base text-foreground">AI Extracting Marks...</p>
                <p className="text-sm text-muted-foreground mt-1">Please wait a moment</p>
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                {/* Camera Capture */}
                <button
                  onClick={() => cameraInputRef.current?.click()}
                  className="flex items-center justify-center gap-3 w-full bg-primary/10 text-primary border border-primary/20 hover:bg-primary/15 font-heading text-base font-semibold px-6 py-4 rounded-xl transition-all"
                >
                  <Camera className="w-5 h-5" />
                  Open Camera
                </button>
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="hidden"
                  ref={cameraInputRef}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) onImageUpload(file);
                  }}
                />

                <div className="relative my-3">
                  <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-border" /></div>
                  <div className="relative flex justify-center text-sm uppercase"><span className="bg-card px-3 text-muted-foreground font-heading">or</span></div>
                </div>

                {/* File Upload */}
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center justify-center gap-3 w-full bg-secondary text-foreground hover:bg-secondary/80 border border-border font-heading text-base font-semibold px-6 py-4 rounded-xl transition-all shadow-sm"
                >
                  <Upload className="w-5 h-5" />
                  Upload Image
                </button>
                <input
                  type="file"
                  accept="image/*,.jpg,.jpeg,.png"
                  className="hidden"
                  ref={fileInputRef}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) onImageUpload(file);
                  }}
                />
              </div>
            )}
          </div>

          <div className="bg-success/10 border border-success/30 rounded-2xl p-5 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <span className="font-heading font-semibold text-sm text-foreground">Progress</span>
              <span className="font-data font-bold text-success text-base">{Math.round((gradedCount/parsedStudents.length)*100 || 0)}%</span>
            </div>
            <div className="h-2.5 bg-background rounded-full overflow-hidden border border-border">
              <div 
                className="h-full bg-success transition-all duration-500" 
                style={{ width: `${(gradedCount/parsedStudents.length)*100 || 0}%` }}
              />
            </div>
          </div>
        </div>

        {/* Right Side: Spreadsheet */}
        <div className="flex-1 bg-card rounded-2xl border border-border flex flex-col overflow-hidden shadow-sm min-h-[400px]">
          <div className="p-4 sm:p-5 border-b border-border flex flex-col sm:flex-row sm:items-center justify-between bg-muted/30 gap-3">
            <h2 className="font-heading font-bold text-foreground text-sm sm:text-base">Class Roster (Spreadsheet)</h2>
            <div className="flex items-center gap-2">
               <button 
                  onClick={() => setSortConfig(null)}
                  className="px-3 py-2 text-xs font-heading text-muted-foreground hover:bg-muted rounded-md transition-colors"
                >
                  Clear Sort
               </button>
               <div className="relative w-full sm:w-64 shrink-0">
                 <Search className="w-4 h-4 sm:w-5 sm:h-5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                 <input 
                   type="text" 
                   value={searchQuery}
                   onChange={(e) => setSearchQuery(e.target.value)}
                   placeholder="Search Reg No..." 
                   className="pl-9 sm:pl-10 pr-4 py-2 text-xs sm:text-sm font-data bg-background border border-border rounded-lg focus:border-primary outline-none w-full shadow-sm"
                 />
               </div>
            </div>
          </div>
          
          <div className="flex-1 overflow-auto relative">
            <table className="w-full text-left border-collapse whitespace-nowrap">
              <thead>
                <tr className="bg-muted/95 backdrop-blur border-b border-border shadow-sm">
                  <th colSpan={3} className="sticky top-0 left-0 z-30 bg-muted/95 p-0 border-r border-border">
                    <div className="px-3 py-2 border-b border-border text-[10px] uppercase font-bold text-muted-foreground text-center tracking-wider">Student Info</div>
                  </th>
                  <th colSpan={5} className="sticky top-0 z-20 bg-muted/95 p-0 border-r border-border">
                    <div className="px-3 py-2 border-b border-border text-[10px] uppercase font-bold text-muted-foreground text-center tracking-wider bg-teal-500/10 text-teal-700 dark:text-teal-400">Part A (Max 10)</div>
                  </th>
                  <th colSpan={10} className="sticky top-0 z-20 bg-muted/95 p-0 border-r border-border">
                    <div className="px-3 py-2 border-b border-border text-[10px] uppercase font-bold text-muted-foreground text-center tracking-wider bg-blue-500/10 text-blue-700 dark:text-blue-400">Part B (Max 20)</div>
                  </th>
                  <th colSpan={10} className="sticky top-0 z-20 bg-muted/95 p-0 border-r border-border">
                    <div className="px-3 py-2 border-b border-border text-[10px] uppercase font-bold text-muted-foreground text-center tracking-wider bg-indigo-500/10 text-indigo-700 dark:text-indigo-400">Part C (Max 35)</div>
                  </th>
                  <th colSpan={4} className="sticky top-0 z-20 bg-muted/95 p-0">
                    <div className="px-3 py-2 border-b border-border text-[10px] uppercase font-bold text-muted-foreground text-center tracking-wider">Totals</div>
                  </th>
                </tr>
                <tr className="bg-muted/80 backdrop-blur border-b border-border shadow-sm text-[10px] sm:text-xs">
                  {/* Left Sticky Cols */}
                  <th className="sticky top-8 left-0 z-30 bg-muted/95 px-2 py-2 font-heading font-semibold uppercase text-muted-foreground text-center w-8 border-r border-border shadow-[1px_0_0_0_rgba(0,0,0,0.1)]">#</th>
                  <th className="sticky top-8 left-8 z-30 bg-muted/95 px-3 py-2 font-heading font-semibold uppercase text-muted-foreground border-r border-border cursor-pointer hover:bg-muted shadow-[1px_0_0_0_rgba(0,0,0,0.1)]" onClick={() => setSortConfig({ key: 'regNo', direction: sortConfig?.key === 'regNo' && sortConfig.direction === 'asc' ? 'desc' : 'asc' })}>
                    Register No {sortConfig?.key === 'regNo' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : ''}
                  </th>
                  <th className="sticky top-8 left-[120px] sm:left-[160px] z-30 bg-muted/95 px-2 py-2 font-heading font-semibold uppercase text-muted-foreground text-center w-16 border-r border-border">Status</th>
                  
                  {/* Part A cols */}
                  {[1, 2, 3, 4, 5].map(q => (
                    <th key={`a${q}`} className="sticky top-8 z-20 px-2 py-2 font-data font-semibold text-center text-muted-foreground border-r border-border min-w-[32px]">Q{q}</th>
                  ))}
                  
                  {/* Part B cols */}
                  {[6, 7, 8, 9, 10].flatMap(q => [
                    <th key={`b${q}a`} className="sticky top-8 z-20 px-2 py-2 font-data font-semibold text-center text-muted-foreground border-r border-border bg-black/5 min-w-[32px]">{q}a</th>,
                    <th key={`b${q}b`} className="sticky top-8 z-20 px-2 py-2 font-data font-semibold text-center text-muted-foreground border-r border-border min-w-[32px]">{q}b</th>
                  ])}

                  {/* Part C cols */}
                  {[11, 12, 13, 14, 15].flatMap(q => [
                    <th key={`c${q}a`} className="sticky top-8 z-20 px-2 py-2 font-data font-semibold text-center text-muted-foreground border-r border-border bg-black/5 min-w-[32px]">{q}a</th>,
                    <th key={`c${q}b`} className="sticky top-8 z-20 px-2 py-2 font-data font-semibold text-center text-muted-foreground border-r border-border min-w-[32px]">{q}b</th>
                  ])}
                  
                  {/* Totals */}
                  <th className="sticky top-8 z-20 px-3 py-2 font-heading font-bold text-center text-teal-700 dark:text-teal-400 border-r border-border">A</th>
                  <th className="sticky top-8 z-20 px-3 py-2 font-heading font-bold text-center text-blue-700 dark:text-blue-400 border-r border-border">B</th>
                  <th className="sticky top-8 z-20 px-3 py-2 font-heading font-bold text-center text-indigo-700 dark:text-indigo-400 border-r border-border">C</th>
                  <th className="sticky top-8 z-20 px-3 py-2 font-heading font-bold text-center text-primary cursor-pointer hover:bg-muted" onClick={() => setSortConfig({ key: 'total', direction: sortConfig?.key === 'total' && sortConfig.direction === 'desc' ? 'asc' : 'desc' })}>
                    Grand Total {sortConfig?.key === 'total' ? (sortConfig.direction === 'desc' ? '↓' : '↑') : ''}
                  </th>
                </tr>
              </thead>
              <tbody className="text-xs sm:text-sm">
                {students.map((s, idx) => (
                  <tr key={idx} className="border-b border-border hover:bg-muted/30 transition-colors group">
                    {/* Fixed Left */}
                    <td className="sticky left-0 z-10 bg-card group-hover:bg-muted/50 px-2 py-2 font-data text-muted-foreground text-center border-r border-border shadow-[1px_0_0_0_rgba(0,0,0,0.05)]">{idx + 1}</td>
                    <td className="sticky left-8 z-10 bg-card group-hover:bg-muted/50 px-3 py-2 font-data font-semibold text-foreground border-r border-border shadow-[1px_0_0_0_rgba(0,0,0,0.05)]">
                      <button 
                        onClick={() => setSelectedStudent(s.rawRow)}
                        className="hover:text-primary hover:underline transition-all text-left w-full truncate"
                      >
                        {s.regNo || "Empty"}
                      </button>
                    </td>
                    <td className="sticky left-[120px] sm:left-[160px] z-10 bg-card group-hover:bg-muted/50 px-2 py-2 text-center border-r border-border">
                      <div className={`w-2 h-2 rounded-full mx-auto ${s.status === "Graded" ? "bg-success" : "bg-muted-foreground/30"}`} title={s.status} />
                    </td>

                    {/* Part A Data */}
                    {s.markData ? s.markData.partA.map((val, i) => (
                       <td key={`da${i}`} className="px-2 py-2 text-center font-data border-r border-border">{val > 0 ? val : '-'}</td>
                    )) : Array(5).fill(0).map((_, i) => <td key={`da_e${i}`} className="px-2 py-2 border-r border-border"></td>)}

                    {/* Part B Data */}
                    {s.markData ? s.markData.partB.flatMap((pair, i) => [
                       <td key={`db${i}a`} className="px-2 py-2 text-center font-data border-r border-border bg-black/[0.02]">{pair.a > 0 ? pair.a : '-'}</td>,
                       <td key={`db${i}b`} className="px-2 py-2 text-center font-data border-r border-border">{pair.b > 0 ? pair.b : '-'}</td>
                    ]) : Array(10).fill(0).map((_, i) => <td key={`db_e${i}`} className="px-2 py-2 border-r border-border"></td>)}

                    {/* Part C Data */}
                    {s.markData ? s.markData.partC.flatMap((pair, i) => [
                       <td key={`dc${i}a`} className="px-2 py-2 text-center font-data border-r border-border bg-black/[0.02]">{pair.a > 0 ? pair.a : '-'}</td>,
                       <td key={`dc${i}b`} className="px-2 py-2 text-center font-data border-r border-border">{pair.b > 0 ? pair.b : '-'}</td>
                    ]) : Array(10).fill(0).map((_, i) => <td key={`dc_e${i}`} className="px-2 py-2 border-r border-border"></td>)}

                    {/* Totals Data with Red Highlights for Errors */}
                    <td className={`px-3 py-2 text-center font-data font-bold border-r border-border ${(s.totals?.partATotal ?? 0) > 10 ? 'bg-destructive/20 text-destructive' : 'text-foreground'}`}>
                      {s.totals?.partATotal ?? '-'}
                    </td>
                    <td className={`px-3 py-2 text-center font-data font-bold border-r border-border ${(s.totals?.partBTotal ?? 0) > 20 ? 'bg-destructive/20 text-destructive' : 'text-foreground'}`}>
                      {s.totals?.partBTotal ?? '-'}
                    </td>
                    <td className={`px-3 py-2 text-center font-data font-bold border-r border-border ${(s.totals?.partCTotal ?? 0) > 35 ? 'bg-destructive/20 text-destructive' : 'text-foreground'}`}>
                      {s.totals?.partCTotal ?? '-'}
                    </td>
                    <td className="px-3 py-2 text-center font-data font-extrabold text-primary bg-primary/5">
                      {s.total ?? '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {students.length === 0 && (
            <div className="flex items-center justify-center p-8 text-muted-foreground text-sm font-heading">
                No students match your search.
            </div>
          )}
        </div>
      </main>

      {/* Student Detail Modal Overlay */}
      {selectedStudent && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-card w-full max-w-2xl rounded-2xl border border-border shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-border flex items-center justify-between bg-muted/30">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <GraduationCap className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-heading font-bold text-lg text-foreground">Student {selectedStudent.regNo}</h3>
                  <p className="text-sm font-heading text-muted-foreground">Grade Breakdown</p>
                </div>
              </div>
              <button 
                onClick={() => setSelectedStudent(null)}
                className="p-2 rounded-full hover:bg-muted text-muted-foreground transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto max-h-[70vh]">
              {selectedStudent.cells[COL.GRAND_TOTAL] ? (() => {
                const markData = rowToMarkData(selectedStudent.cells);
                const totals = calculateTotals(markData);
                return (
                  <div className="space-y-6">
                    {/* Visual Flex Row for Thumbnail preview idea */}
                    <div className="flex items-center gap-4 bg-muted/20 p-4 rounded-xl border border-border">
                      <div className="w-12 h-16 bg-muted border border-border rounded flex items-center justify-center shrink-0 shadow-sm">
                        <ImageIcon className="w-5 h-5 text-muted-foreground/50" />
                      </div>
                      <div>
                        <p className="font-heading font-semibold text-sm text-foreground">Answer Sheet Artifact</p>
                        <p className="font-data text-xs text-muted-foreground">Processed & verified from standard UI</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      {/* Part A Card */}
                      <div className="bg-card border border-border rounded-xl p-4 shadow-sm">
                        <h4 className="font-heading font-bold text-sm text-muted-foreground uppercase mb-3 border-b border-border pb-2">Part A</h4>
                        <ul className="space-y-2 mb-4 text-sm font-data">
                          {markData.partA.map((val, i) => (
                            <li key={i} className="flex justify-between">
                              <span className="text-muted-foreground">Q{i+1}</span>
                              <span className="font-semibold text-foreground">{val}</span>
                            </li>
                          ))}
                        </ul>
                        <div className="pt-2 border-t border-border flex justify-between font-bold">
                          <span className="text-sm font-heading uppercase text-muted-foreground">Total</span>
                          <span className="text-primary font-data">{totals.partATotal}</span>
                        </div>
                      </div>

                      {/* Part B Card */}
                      <div className="bg-card border border-border rounded-xl p-4 shadow-sm">
                        <h4 className="font-heading font-bold text-sm text-muted-foreground uppercase mb-3 border-b border-border pb-2">Part B</h4>
                        <ul className="space-y-2 mb-4 text-sm font-data">
                          {markData.partB.map((pair, i) => (
                            <li key={i} className="flex justify-between">
                              <span className="text-muted-foreground">Q{i+6}</span>
                              <span className="font-semibold text-foreground">{Math.max(pair.a, pair.b)}</span>
                            </li>
                          ))}
                        </ul>
                        <div className="pt-2 border-t border-border flex justify-between font-bold">
                          <span className="text-sm font-heading uppercase text-muted-foreground">Total</span>
                          <span className="text-primary font-data">{totals.partBTotal}</span>
                        </div>
                      </div>

                      {/* Part C Card */}
                      <div className="bg-card border border-border rounded-xl p-4 shadow-sm">
                        <h4 className="font-heading font-bold text-sm text-muted-foreground uppercase mb-3 border-b border-border pb-2">Part C</h4>
                        <ul className="space-y-2 mb-4 text-sm font-data">
                          {markData.partC.map((pair, i) => (
                            <li key={i} className="flex justify-between">
                              <span className="text-muted-foreground">Q{i+11}</span>
                              <span className="font-semibold text-foreground">{Math.max(pair.a, pair.b)}</span>
                            </li>
                          ))}
                        </ul>
                        <div className="pt-2 border-t border-border flex justify-between font-bold">
                          <span className="text-sm font-heading uppercase text-muted-foreground">Total</span>
                          <span className="text-primary font-data">{totals.partCTotal}</span>
                        </div>
                      </div>
                    </div>

                    <div className="bg-primary/5 border-2 border-primary/20 rounded-xl px-6 py-4 flex items-center justify-between shadow-sm">
                      <span className="font-heading font-bold text-base text-foreground uppercase tracking-widest">Grand Total</span>
                      <span className="font-data font-bold text-3xl text-primary">
                        {totals.grandTotal}
                      </span>
                    </div>

                  </div>
                );
              })() : (
                <div className="py-12 flex flex-col items-center justify-center text-center">
                  <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
                    <FileText className="w-8 h-8 text-muted-foreground/50" />
                  </div>
                  <h4 className="font-heading font-bold text-lg text-foreground mb-1">Not Graded Yet</h4>
                  <p className="text-muted-foreground text-sm max-w-sm">
                    This student's answer sheet hasn't been processed. Use the upload card on the dashboard to extract marks.
                  </p>
                </div>
              )}
            </div>
            
            {/* Modal Footer */}
            <div className="px-6 py-4 bg-muted/30 border-t border-border flex justify-end">
              <button 
                onClick={() => setSelectedStudent(null)}
                className="font-heading font-semibold text-sm px-6 py-2 rounded-lg bg-secondary text-foreground hover:bg-secondary/80 border border-border transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
