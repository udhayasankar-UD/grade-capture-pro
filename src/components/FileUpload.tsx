import { useRef } from "react";

interface FileUploadProps {
  label: string;
  accept: string;
  onFile: (file: File) => void;
  fileName?: string;
}

export function FileUpload({ label, accept, onFile, fileName }: FileUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="flex items-center gap-4">
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className="bg-secondary text-secondary-foreground font-heading text-sm px-4 py-2 rounded-sm border border-border hover:bg-accent transition-colors"
      >
        {label}
      </button>
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
      {fileName && (
        <span className="text-muted-foreground text-sm font-heading truncate max-w-[300px]">
          {fileName}
        </span>
      )}
    </div>
  );
}
