import { useRef, useState, useEffect } from "react";
import { FileText, Camera, Upload, Download, Search, GraduationCap, X, ChevronRight, Image as ImageIcon, LogOut, Coins } from "lucide-react";
import { CSVState, generateCSV, COL, rowToMarkData } from "@/lib/csv-utils";
import { calculateTotals } from "@/lib/types";
import { useAuth } from "@/lib/auth-context";
import { ProfileMenu } from "@/components/ProfileMenu";

interface SpreadsheetDashboardProps {
  csvState: CSVState;
  csvFileName: string;
  isProcessing: boolean;
  processingMessage?: string;
  onImageUpload: (file: File) => void;
  onCancel?: () => void;
  onBack: () => void;
}

export function SpreadsheetDashboard({
  csvState,
  csvFileName,
  isProcessing,
  processingMessage = "Extracting Marks...",
  onImageUpload,
  onCancel,
  onBack,
}: SpreadsheetDashboardProps) {
  const { credits, logout } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const [selectedStudent, setSelectedStudent] = useState<{ regNo: string; cells: string[] } | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortConfig, setSortConfig] = useState<{ key: 'regNo' | 'total', direction: 'asc' | 'desc' } | null>(null);
  const [viewMode, setViewMode] = useState<'roster' | 'spreadsheet'>('roster');
  const [pendingImage, setPendingImage] = useState<{ file: File; url: string } | null>(null);

  // Fake Loading State
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
    <div className="min-h-screen bg-[#F8F9FA] flex flex-col">
      <header className="bg-white border-b border-gray-200 px-4 md:px-8 py-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-sm">
        <div className="flex items-center gap-4 w-full md:w-auto">
          <button onClick={onBack} className="flex items-center gap-1.5 text-gray-500 hover:text-gray-900 transition-colors shrink-0">
            <ChevronRight className="w-5 h-5 rotate-180" />
            <span className="font-heading font-medium text-sm hidden sm:inline">Back</span>
          </button>
          <div className="h-6 w-px bg-gray-200 shrink-0" />
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-lg bg-[#E8F3F1] flex items-center justify-center shrink-0">
              <GraduationCap className="w-5 h-5 text-[#34A853]" />
            </div>
            <div className="min-w-0">
              <h1 className="font-heading font-bold text-sm text-gray-900 truncate">
                {csvFileName}
              </h1>
              <p className="text-[11px] text-gray-500 font-medium truncate">
                {gradedCount}/{students.length} Graded
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-end">
          <div className="flex items-center gap-2 bg-[#E8F3F1] px-3 py-1.5 rounded-full border border-[#34A853]/10">
            <Coins className="w-3.5 h-3.5 text-[#34A853]" />
            <span className="text-xs font-bold text-[#34A853]">{credits} Credits</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setViewMode(viewMode === 'roster' ? 'spreadsheet' : 'roster')}
              className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-lg font-heading text-sm font-semibold transition-all shadow-sm ${
                viewMode === 'spreadsheet' 
                  ? 'bg-[#34A853] text-white hover:bg-[#2d9248]' 
                  : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'
              }`}
            >
              <FileText className="w-4 h-4" />
              <span className="hidden sm:inline">{viewMode === 'spreadsheet' ? 'View Roster' : 'Spreadsheet'}</span>
              <span className="sm:hidden">{viewMode === 'spreadsheet' ? 'Roster' : 'Sheet'}</span>
            </button>

            <button
              onClick={handleDownload}
              className="flex items-center gap-2 bg-[#0F172A] text-white font-heading text-sm font-semibold px-3 sm:px-4 py-2 rounded-lg hover:bg-[#1E293B] transition-all shadow-sm"
            >
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">Download CSV</span>
            </button>
            <div className="h-6 w-px bg-gray-200 hidden md:block mx-1" />
            <ProfileMenu />
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-[1400px] w-full mx-auto px-4 md:px-8 py-6 flex flex-col gap-6 lg:flex-row shadow-inner">
        {/* Left Side: Actions */}
        <div className="flex flex-col gap-6 w-full lg:w-80 shrink-0">
          <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
            <h2 className="font-heading font-bold text-gray-900 text-base mb-5">Grade Next Student</h2>
            
            {isProcessing ? (
              <div className="flex flex-col items-center py-4">
                <div className="w-full bg-gray-100 rounded-full h-2 mb-3 overflow-hidden border border-gray-200 relative">
                  <div 
                    className="absolute top-0 left-0 h-full bg-[#34A853] transition-all duration-75 ease-linear" 
                    style={{ width: `${Math.min(fakeProgress, 100)}%` }}
                  />
                </div>
                <div className="flex w-full items-center justify-between mb-6 px-1">
                  <p className="font-heading font-bold text-gray-900 text-sm animate-pulse">{fakeMessage}</p>
                  <p className="font-data font-bold text-[#34A853] text-sm">{Math.floor(fakeProgress)}%</p>
                </div>
                
                <button
                  onClick={onCancel}
                  className="flex items-center justify-center gap-2 w-full bg-white text-rose-600 border border-rose-200 hover:bg-rose-50 font-heading text-sm font-bold py-2.5 rounded-xl transition-all shadow-sm"
                >
                  <X className="w-4 h-4" />
                  Cancel Extraction
                </button>
              </div>
            ) : (
              <div className="flex flex-col gap-4">
              <button
                onClick={() => cameraInputRef.current?.click()}
                className="flex items-center justify-center gap-3 w-full bg-[#E8F3F1] text-[#34A853] border border-[#34A853]/20 hover:bg-[#DCF0ED] font-heading text-base font-bold px-6 py-4 rounded-xl transition-all shadow-sm"
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
                  if (file) setPendingImage({ file, url: URL.createObjectURL(file) });
                }}
              />

              <div className="relative my-2">
                <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-gray-100" /></div>
                <div className="relative flex justify-center text-[10px] font-bold uppercase tracking-widest"><span className="bg-white px-3 text-gray-400">or</span></div>
              </div>

              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center justify-center gap-3 w-full bg-white text-gray-700 hover:bg-gray-50 border border-gray-200 font-heading text-base font-bold px-6 py-4 rounded-xl transition-all shadow-sm"
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
                  if (file) setPendingImage({ file, url: URL.createObjectURL(file) });
                }}
              />
            </div>
            )}
          </div>
          {pendingImage && (
            <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <div className="bg-white w-full max-w-sm rounded-2xl p-5 shadow-2xl border border-gray-200 animate-in fade-in zoom-in-95 duration-200 flex flex-col gap-4">
                 <h2 className="font-heading font-bold text-gray-900 text-lg">Image Selected</h2>
                 <div className="relative aspect-[3/4] rounded-xl overflow-hidden border border-gray-200 bg-gray-50 shadow-inner group">
                    <img 
                      src={pendingImage.url} 
                      alt="Preview" 
                      className="w-full h-full object-contain"
                    />
                 </div>
                 <div className="grid grid-cols-2 gap-3 mt-1">
                    <button
                      onClick={() => {
                        URL.revokeObjectURL(pendingImage.url);
                        setPendingImage(null);
                      }}
                      className="flex items-center justify-center gap-2 bg-white text-gray-700 border border-gray-200 hover:bg-gray-50 font-heading text-sm font-bold py-3 rounded-xl transition-all shadow-sm"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => {
                        onImageUpload(pendingImage.file);
                        setPendingImage(null);
                      }}
                      className="flex items-center justify-center gap-2 bg-[#34A853] text-white hover:bg-[#2d9248] font-heading text-sm font-bold py-3 rounded-xl transition-all shadow-md"
                    >
                      Extract
                    </button>
                 </div>
              </div>
            </div>
          )}

          <div className="bg-[#E8F3F1]/50 border border-[#34A853]/10 rounded-2xl p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="font-heading font-bold text-xs text-gray-600 uppercase tracking-wider">Progress</span>
              <span className="font-data font-bold text-[#34A853] text-base">{Math.round((gradedCount/parsedStudents.length)*100 || 0)}%</span>
            </div>
            <div className="h-2 bg-white rounded-full overflow-hidden border border-gray-100">
              <div 
                className="h-full bg-[#34A853] transition-all duration-500 rounded-full" 
                style={{ width: `${(gradedCount/parsedStudents.length)*100 || 0}%` }}
              />
            </div>
          </div>
        </div>

        {/* Right Side: Roster or Spreadsheet */}
        <div className="flex-1 bg-white rounded-2xl border border-gray-200 flex flex-col overflow-hidden shadow-sm min-h-[500px]">
          <div className="p-5 border-b border-gray-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <h2 className="font-heading font-bold text-gray-900 text-base">Class Roster</h2>
            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input 
                type="text" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search Reg No..." 
                className="pl-9 pr-4 py-2 text-sm font-medium bg-gray-50 border border-gray-200 rounded-lg focus:border-[#34A853] focus:ring-1 focus:ring-[#34A853]/20 outline-none w-full transition-all"
              />
            </div>
          </div>
          
          <div className="flex-1 overflow-auto">
            {viewMode === 'spreadsheet' ? (
              <table className="w-full text-left border-collapse whitespace-nowrap">
                <thead>
                  <tr className="bg-gray-50/80 border-b border-gray-200">
                    <th colSpan={3} className="sticky top-0 left-0 z-30 bg-gray-50 p-0 border-r border-gray-200">
                      <div className="px-3 py-2 border-b border-gray-200 text-[10px] uppercase font-bold text-gray-400 text-center tracking-wider">Student Info</div>
                    </th>
                    <th colSpan={5} className="sticky top-0 z-20 bg-gray-50 p-0 border-r border-gray-200 text-[10px] uppercase font-bold text-teal-600 text-center tracking-wider bg-teal-50/50">Part A (Max 10)</th>
                    <th colSpan={10} className="sticky top-0 z-20 bg-gray-50 p-0 border-r border-gray-200 text-[10px] uppercase font-bold text-blue-600 text-center tracking-wider bg-blue-50/50">Part B (Max 20)</th>
                    <th colSpan={10} className="sticky top-0 z-20 bg-gray-50 p-0 border-r border-gray-200 text-[10px] uppercase font-bold text-indigo-600 text-center tracking-wider bg-indigo-50/50">Part C (Max 35)</th>
                    <th colSpan={4} className="sticky top-0 z-20 bg-gray-50 p-0 text-[10px] uppercase font-bold text-gray-600 text-center tracking-wider">Totals</th>
                  </tr>
                  <tr className="bg-gray-50/80 border-b border-gray-200 text-[10px]">
                    <th className="sticky top-8 left-0 z-30 bg-gray-50 px-2 py-2 font-bold text-gray-400 text-center w-8 border-r border-gray-200 shadow-sm">#</th>
                    <th className="sticky top-8 left-8 z-30 bg-gray-50 px-3 py-2 font-bold text-gray-600 border-r border-gray-200 cursor-pointer hover:bg-gray-100" onClick={() => setSortConfig({ key: 'regNo', direction: sortConfig?.key === 'regNo' && sortConfig.direction === 'asc' ? 'desc' : 'asc' })}>
                      REG NO {sortConfig?.key === 'regNo' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : ''}
                    </th>
                    <th className="sticky top-8 left-[120px] z-30 bg-gray-50 px-2 py-2 font-bold text-gray-600 text-center w-16 border-r border-gray-200">STATUS</th>
                    
                    {[1, 2, 3, 4, 5].map(q => <th key={`a${q}`} className="sticky top-8 px-2 py-2 text-center border-r border-gray-200 min-w-[32px]">Q{q}</th>)}
                    {[6, 7, 8, 9, 10].flatMap(q => [<th key={`b${q}a`} className="sticky top-8 px-2 py-2 text-center border-r border-gray-100 bg-gray-100/30 min-w-[32px]">{q}a</th>, <th key={`b${q}b`} className="sticky top-8 px-2 py-2 text-center border-r border-gray-200 min-w-[32px]">{q}b</th>])}
                    {[11, 12, 13, 14, 15].flatMap(q => [<th key={`c${q}a`} className="sticky top-8 px-2 py-2 text-center border-r border-gray-100 bg-gray-100/30 min-w-[32px]">{q}a</th>, <th key={`c${q}b`} className="sticky top-8 px-2 py-2 text-center border-r border-gray-200 min-w-[32px]">{q}b</th>])}
                    
                    <th className="sticky top-8 px-3 py-2 text-center text-teal-600 border-r border-gray-200">A</th>
                    <th className="sticky top-8 px-3 py-2 text-center text-blue-600 border-r border-gray-200">B</th>
                    <th className="sticky top-8 px-3 py-2 text-center text-indigo-600 border-r border-gray-200">C</th>
                    <th className="sticky top-8 px-3 py-2 text-center text-[#34A853] font-bold cursor-pointer hover:bg-gray-100" onClick={() => setSortConfig({ key: 'total', direction: sortConfig?.key === 'total' && sortConfig.direction === 'desc' ? 'asc' : 'desc' })}>
                      TOTAL {sortConfig?.key === 'total' ? (sortConfig.direction === 'desc' ? '↓' : '↑') : ''}
                    </th>
                  </tr>
                </thead>
                <tbody className="text-xs">
                  {students.map((s, idx) => (
                    <tr key={idx} className="border-b border-gray-100 hover:bg-gray-50 transition-colors group">
                      <td className="sticky left-0 bg-white group-hover:bg-gray-50 px-2 py-2.5 text-center text-gray-400 border-r border-gray-100 font-data">{idx + 1}</td>
                      <td className="sticky left-8 bg-white group-hover:bg-gray-50 px-3 py-2.5 font-bold text-gray-900 border-r border-gray-200 font-data">
                        <button onClick={() => setSelectedStudent(s.rawRow)} className="hover:text-[#34A853] transition-colors">{s.regNo}</button>
                      </td>
                      <td className="sticky left-[120px] bg-white group-hover:bg-gray-50 px-2 py-2.5 text-center border-r border-gray-100 font-bold">
                        <span className={`inline-block w-1.5 h-1.5 rounded-full ${s.status === "Graded" ? "bg-[#34A853]" : "bg-gray-200"}`} />
                      </td>
                      {s.markData ? s.markData.partA.map((val, i) => <td key={`da${i}`} className="px-2 py-2.5 text-center border-r border-gray-100 font-data">{val > 0 ? val : '-'}</td>) : Array(5).fill(0).map((_, i) => <td key={`dae${i}`} className="px-2 py-2.5 border-r border-gray-100"></td>)}
                      {s.markData ? s.markData.partB.flatMap((pair, i) => [<td key={`db${i}a`} className="px-2 py-2.5 text-center border-r border-gray-100 bg-gray-50/50 font-data">{pair.a > 0 ? pair.a : '-'}</td>, <td key={`db${i}b`} className="px-2 py-2.5 text-center border-r border-gray-100 font-data">{pair.b > 0 ? pair.b : '-'}</td>]) : Array(10).fill(0).map((_, i) => <td key={`dbe${i}`} className="px-2 py-2.5 border-r border-gray-100"></td>)}
                      {s.markData ? s.markData.partC.flatMap((pair, i) => [<td key={`dc${i}a`} className="px-2 py-2.5 text-center border-r border-gray-100 bg-gray-50/50 font-data">{pair.a > 0 ? pair.a : '-'}</td>, <td key={`dc${i}b`} className="px-2 py-2.5 text-center border-r border-gray-100 font-data">{pair.b > 0 ? pair.b : '-'}</td>]) : Array(10).fill(0).map((_, i) => <td key={`dce${i}`} className="px-2 py-2.5 border-r border-gray-100"></td>)}
                      <td className="px-3 py-2.5 text-center font-bold text-teal-600 border-r border-gray-100 font-data">{s.totals?.partATotal ?? '-'}</td>
                      <td className="px-3 py-2.5 text-center font-bold text-blue-600 border-r border-gray-100 font-data">{s.totals?.partBTotal ?? '-'}</td>
                      <td className="px-3 py-2.5 text-center font-bold text-indigo-600 border-r border-gray-100 font-data">{s.totals?.partCTotal ?? '-'}</td>
                      <td className="px-3 py-2.5 text-center font-bold text-[#34A853] bg-[#E8F3F1]/30 font-data">{s.total ?? '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 text-[11px] font-bold text-gray-400 uppercase tracking-wider border-b border-gray-100">
                    <th className="px-6 py-4 text-center w-16 italic font-heading">#</th>
                    <th className="px-6 py-4 font-heading">Register No</th>
                    <th className="px-6 py-4 text-right font-heading">Grand Total</th>
                    <th className="px-6 py-4 text-center w-32 font-heading">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {students.map((s, idx) => (
                    <tr key={idx} className="hover:bg-gray-50/50 transition-colors group">
                      <td className="px-6 py-4.5 text-center text-gray-400 font-data italic">{idx + 1}</td>
                      <td className="px-6 py-4.5">
                        <button 
                          onClick={() => setSelectedStudent(s.rawRow)}
                          className="font-data font-bold text-gray-900 text-sm hover:text-[#34A853] transition-colors"
                        >
                          {s.regNo}
                        </button>
                      </td>
                      <td className="px-6 py-4.5 text-right font-data font-bold text-[#34A853] text-base">
                        {s.total ?? '-'}
                      </td>
                      <td className="px-6 py-4.5 text-center">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border ${
                          s.status === 'Graded' 
                            ? 'bg-[#E8F3F1] text-[#34A853] border-[#34A853]/20' 
                            : 'bg-gray-50 text-gray-400 border-gray-200'
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
              <div className="flex flex-col items-center justify-center p-20 text-center">
                <Search className="w-12 h-12 text-gray-200 mb-4" />
                <h3 className="text-gray-900 font-bold text-lg">No students found</h3>
                <p className="text-gray-500 text-sm">Try adjusting your search query</p>
              </div>
            )}
          </div>
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
