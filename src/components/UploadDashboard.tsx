import { useRef } from "react";
import { FileText, Camera, Zap, GraduationCap } from "lucide-react";

interface UploadDashboardProps {
  csvFile: File | null;
  answerSheetFile: File | null;
  onCSVUpload: (file: File) => void;
  onImageUpload: (file: File) => void;
  onProcess: () => void;
  studentCount: number;
  isProcessing?: boolean;
}

function UploadCard({
  icon: Icon,
  title,
  description,
  accept,
  fileName,
  onFile,
}: {
  icon: typeof FileText;
  title: string;
  description: string;
  accept: string;
  fileName?: string;
  onFile: (file: File) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div
      onClick={() => inputRef.current?.click()}
      className="flex flex-col items-center justify-center p-10 border-2 border-dashed border-border rounded-xl cursor-pointer hover:border-primary hover:bg-accent/50 transition-all min-h-[220px] group"
    >
      <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center mb-5 group-hover:bg-primary/20 transition-colors">
        <Icon className="w-8 h-8 text-primary" />
      </div>
      <p className="font-heading font-semibold text-foreground text-base mb-2">{title}</p>
      <p className="text-muted-foreground text-sm text-center mb-4">{description}</p>
      {fileName ? (
        <span className="bg-success/15 text-success font-data text-sm px-4 py-1.5 rounded-full">
          ✓ {fileName}
        </span>
      ) : (
        <span className="bg-primary text-primary-foreground font-heading text-xs font-semibold px-4 py-1.5 rounded-full uppercase tracking-wider">
          Required
        </span>
      )}
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) onFile(file);
        }}
      />
    </div>
  );
}

export function UploadDashboard({
  csvFile,
  answerSheetFile,
  onCSVUpload,
  onImageUpload,
  onProcess,
  studentCount,
  isProcessing = false,
}: UploadDashboardProps) {
  const bothUploaded = !!csvFile && !!answerSheetFile;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="border-b border-border bg-card px-8 py-5 flex items-center gap-4">
        <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center">
          <GraduationCap className="w-6 h-6 text-primary-foreground" />
        </div>
        <span className="font-heading font-bold text-primary text-xl">Thaal</span>
      </header>

      <main className="flex-1 max-w-3xl w-full mx-auto px-6 py-12">
        <h1 className="font-heading font-bold text-3xl sm:text-4xl text-foreground mb-3">Get Started</h1>
        <p className="text-muted-foreground text-base mb-10">
          To begin digitizing answer sheets, please upload your department's Master CSV Template below.
        </p>

        {/* Upload Cards */}
        <div className="mb-12 max-w-lg mx-auto">
          <div className="flex items-center gap-2 mb-4">
            <FileText className="w-5 h-5 text-muted-foreground" />
            <span className="font-heading font-semibold text-base text-foreground">Master Template</span>
          </div>
          <UploadCard
            icon={FileText}
            title="Upload Master CSV Template"
            description="Drag and drop or click to browse"
            accept=".csv"
            fileName={csvFile?.name}
            onFile={onCSVUpload}
          />
        </div>

        {studentCount > 0 && (
          <p className="text-sm text-muted-foreground font-data text-center mb-6">
            {studentCount} students loaded successfully.
          </p>
        )}

        {/* Process Section */}
        <div className="bg-card rounded-2xl border border-border p-10 text-center max-w-lg mx-auto shadow-sm">
          <Zap className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h2 className="font-heading font-bold text-xl sm:text-2xl text-foreground mb-2">Upload complete?</h2>
          <p className="text-muted-foreground text-base mb-8">
            Continue to the class roster workspace to begin scanning and grading.
          </p>
          <button
            disabled={!csvFile}
            onClick={onProcess}
            className={`font-heading font-semibold text-base px-12 py-4 rounded-full transition-all flex items-center justify-center mx-auto gap-3
              ${csvFile
                ? "bg-primary text-primary-foreground hover:bg-primary/90 cursor-pointer shadow-lg shadow-primary/25 hover:scale-105"
                : "bg-muted text-muted-foreground cursor-not-allowed"
              }
            `}
          >
            Go to Class Roster ➔
          </button>
        </div>

      </main>
    </div>
  );
}
