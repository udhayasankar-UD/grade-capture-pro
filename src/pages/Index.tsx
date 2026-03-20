import { useState, useCallback, useEffect, useRef } from "react";
import { UploadDashboard } from "@/components/UploadDashboard";
import { VerificationWorkspace } from "@/components/VerificationWorkspace";
import { SpreadsheetDashboard } from "@/components/SpreadsheetDashboard";
import { CSVState, createEmptySpreadsheet } from "@/lib/csv-utils";
import { MarkData } from "@/lib/types";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth-context";
import { auth } from "@/lib/firebase";
import { useSettings } from "@/lib/settings-context";
import { loadSubjectData, saveSubjectData } from "@/lib/firestore-service";

type View = "upload" | "dashboard" | "workspace";

const Index = () => {
  const { credits } = useAuth();
  const { settings, updateSettings } = useSettings();
  const [view, setView] = useState<View>("upload");
  const [csvState, setCsvState] = useState<CSVState | null>(null);
  const [answerSheetFile, setAnswerSheetFile] = useState<File | null>(null);
  const [answerSheetUrl, setAnswerSheetUrl] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingMessage, setProcessingMessage] = useState("");
  const [abortController, setAbortController] = useState<AbortController | null>(null);
  const [extractedData, setExtractedData] = useState<MarkData | null>(null);

  // Subject tracking
  const [currentSubjectId, setCurrentSubjectId] = useState<string | null>(null);
  const [currentSubjectName, setCurrentSubjectName] = useState("");
  const [currentSubjectCode, setCurrentSubjectCode] = useState("");

  // Auto-save ref
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Auto-save to Firestore whenever csvState changes
  useEffect(() => {
    if (!currentSubjectId || !csvState) return;

    // Debounce save — wait 2 seconds after last change
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(() => {
      const gradedCount = csvState.dataRows.filter(r => !!r.markData).length;
      saveSubjectData(currentSubjectId, csvState, gradedCount).catch(err => {
        console.error("Auto-save failed:", err);
      });
    }, 2000);

    return () => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    };
  }, [csvState, currentSubjectId]);

  const handleOpenSubject = useCallback(async (subjectId: string, subjectName: string, subjectCode: string) => {
    setCurrentSubjectId(subjectId);
    setCurrentSubjectName(subjectName);
    setCurrentSubjectCode(subjectCode);

    // Load existing data from Firestore
    try {
      const data = await loadSubjectData(subjectId);
      if (data) {
        if (data.settings) {
          updateSettings(data.settings);
        }
        if (data.spreadsheetData && data.spreadsheetData.dataRows.length > 0) {
          setCsvState(data.spreadsheetData);
        } else {
          setCsvState(createEmptySpreadsheet());
        }
      } else {
        setCsvState(createEmptySpreadsheet());
      }
    } catch (err) {
      console.error("Failed to load subject data:", err);
      setCsvState(createEmptySpreadsheet());
    }
    setView("dashboard");
  }, []);

  const handleCancelProcessing = useCallback(() => {
    if (abortController) {
      abortController.abort();
      setAbortController(null);
      setIsProcessing(false);
      toast.info("Extraction cancelled");
    }
  }, [abortController]);

  const handleImageUploadAndExtract = useCallback(async (file: File) => {
    if (credits <= 0) {
      toast.error("You have 0 credits remaining. Credits reset daily.");
      return;
    }
    
    if (answerSheetUrl) URL.revokeObjectURL(answerSheetUrl);
    setAnswerSheetFile(file);
    setAnswerSheetUrl(URL.createObjectURL(file));
    
    const controller = new AbortController();
    setAbortController(controller);
    setIsProcessing(true);
    setProcessingMessage("Initializing AI Scanner...");

    let rawData;
    
    try {
      const formData = new FormData();
      formData.append("image", file);
      
      const maxRetries = 3;
      let attempt = 0;
      let success = false;

      while (attempt < maxRetries && !success) {
        attempt++;
        setProcessingMessage(attempt > 1 ? `Retrying... (Attempt ${attempt}/3)` : "Scanning Answer Sheet...");
        
        try {
          const token = await auth.currentUser?.getIdToken();
          // In dev, use relative URL so Vite proxy handles CORS
          // In production (built), use the full backend URL
          const backendUrl = import.meta.env.DEV ? '' : (import.meta.env.VITE_BACKEND_URL || 'https://thaal.onrender.com');
          const res = await fetch(`${backendUrl}/api/extract-marks`, {
            method: "POST",
            headers: {
              ...(token ? { "Authorization": `Bearer ${token}` } : {}),
            },
            body: formData,
            signal: controller.signal
          });
          
          if (!res.ok) {
            let errorMsg = `Server returned ${res.status}`;
            try {
                const errData = await res.json();
                if (errData.detail) errorMsg = errData.detail;
                else if (errData.error) errorMsg = errData.error;
            } catch(e) {}
            throw new Error(errorMsg);
          }
          
          setProcessingMessage("Finalizing Output...");
          rawData = await res.json();
          success = true;
        } catch (error: any) {
          if (error.name === 'AbortError') throw error;
          
          if (attempt < maxRetries) {
             toast(`AI busy, Retrying... (${attempt}/${maxRetries} attempts)`);
             await new Promise((resolve, reject) => {
               const timeout = setTimeout(resolve, 2000);
               controller.signal.addEventListener('abort', () => {
                 clearTimeout(timeout);
                 reject(new DOMException('Aborted', 'AbortError'));
               });
             });
          } else {
             throw error;
          }
        }
      }
      toast.success("Marks extracted successfully from AI!");
      
      const markData: MarkData = {
        regNo: String(rawData["Reg No"] || ""),
        parts: {}
      };

      let qNum = 1;
      settings.parts.filter(p => p.enabled).forEach(part => {
        if (part.type === "single") {
          const values: number[] = [];
          for (let i = 0; i < part.questionCount; i++) {
            values.push(Number(rawData[`${qNum}a`] || 0) + Number(rawData[`${qNum}b`] || 0));
            qNum++;
          }
          markData.parts[part.id] = values;
        } else {
          const pairs: { a: number, b: number }[] = [];
          for (let i = 0; i < part.questionCount; i++) {
            pairs.push({
              a: Number(rawData[`${qNum}a`] || 0),
              b: Number(rawData[`${qNum}b`] || 0)
            });
            qNum++;
          }
          markData.parts[part.id] = pairs;
        }
      });

      setProcessingMessage("Complete");
      await new Promise(resolve => setTimeout(resolve, 800));

      setExtractedData(markData);
      setView("workspace");
    } catch (err: any) {
      if (err.name === 'AbortError') return;
      console.error(err);
      toast.error(err.message || "Failed to extract marks from image. Ensure Python API is running.");
      setExtractedData(null);
      setView("workspace");
    } finally {
      setIsProcessing(false);
      setAbortController(null);
      setProcessingMessage("");
    }
  }, [answerSheetUrl, credits, settings]);

  const handleBackToDashboard = useCallback(() => setView("dashboard"), []);
  const handleBackToUpload = useCallback(() => {
    // Force save before exiting
    if (currentSubjectId && csvState) {
      const gradedCount = csvState.dataRows.filter(r => !!r.markData).length;
      saveSubjectData(currentSubjectId, csvState, gradedCount).catch(console.error);
    }
    setCurrentSubjectId(null);
    setCurrentSubjectName("");
    setCurrentSubjectCode("");
    setCsvState(null);
    setView("upload");
  }, [currentSubjectId, csvState]);

  const handleCsvUpdate = useCallback((csv: CSVState) => setCsvState(csv), []);

  if (view === "workspace" && csvState && answerSheetUrl) {
    return (
      <VerificationWorkspace
        csvState={csvState}
        csvFileName={`${currentSubjectName} (${currentSubjectCode})`}
        answerSheetUrl={answerSheetUrl}
        initialData={extractedData}
        onBack={handleBackToDashboard}
        onCsvUpdate={handleCsvUpdate}
      />
    );
  }

  if (view === "dashboard" && csvState) {
    return (
      <SpreadsheetDashboard
        csvState={csvState}
        csvFileName={`${currentSubjectName} - ${currentSubjectCode}`}
        isProcessing={isProcessing}
        processingMessage={processingMessage}
        onImageUpload={handleImageUploadAndExtract}
        onCancel={handleCancelProcessing}
        onBack={handleBackToUpload}
        onCsvUpdate={handleCsvUpdate}
      />
    );
  }

  return (
    <UploadDashboard
      onProcess={handleOpenSubject}
    />
  );
};

export default Index;
