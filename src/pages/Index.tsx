import { useState, useCallback } from "react";
import { UploadDashboard } from "@/components/UploadDashboard";
import { VerificationWorkspace } from "@/components/VerificationWorkspace";
import { SpreadsheetDashboard } from "@/components/SpreadsheetDashboard";
import { parseCSV, type CSVState } from "@/lib/csv-utils";
import { MarkData } from "@/lib/types";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth-context";
import { auth } from "@/lib/firebase";

type View = "upload" | "dashboard" | "workspace";

const Index = () => {
  const { credits } = useAuth();
  const [view, setView] = useState<View>("upload");
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [csvState, setCsvState] = useState<CSVState | null>(null);
  const [answerSheetFile, setAnswerSheetFile] = useState<File | null>(null);
  const [answerSheetUrl, setAnswerSheetUrl] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [extractedData, setExtractedData] = useState<MarkData | null>(null);

  const handleCSVUpload = useCallback(async (file: File) => {
    setCsvFile(file);
    const text = await file.text();
    setCsvState(parseCSV(text));
  }, []);

  const handleImageUploadAndExtract = useCallback(async (file: File) => {
    if (credits <= 0) {
      toast.error("You have 0 credits remaining. Please contact the administrator.");
      return;
    }
    
    if (answerSheetUrl) URL.revokeObjectURL(answerSheetUrl);
    setAnswerSheetFile(file);
    setAnswerSheetUrl(URL.createObjectURL(file));
    
    setIsProcessing(true);
    let rawData;
    
    try {
      const formData = new FormData();
      formData.append("image", file);
      
      const maxRetries = 3;
      let attempt = 0;
      let success = false;
      let lastErrorMsg = "";

      while (attempt < maxRetries && !success) {
        attempt++;
        try {
          const token = await auth.currentUser?.getIdToken();
          const backendUrl = import.meta.env.VITE_BACKEND_URL || "http://localhost:8000";
          const res = await fetch(`${backendUrl}/api/extract-marks`, {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${token}`
            },
            body: formData,
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
          
          rawData = await res.json();
          success = true;
        } catch (error: any) {
          lastErrorMsg = error.message;
          if (attempt < maxRetries) {
             toast(`AI busy, Retrying... (${attempt}/${maxRetries} attempts)`);
             // Wait 2000 ms before retrying
             await new Promise(resolve => setTimeout(resolve, 2000));
          } else {
             throw error;
          }
        }
      }
      toast.success("Marks extracted successfully from AI!");
      
      const markData: MarkData = {
        regNo: rawData["Reg No"] || "",
        partA: [
          Number(rawData["1a"] || 0) + Number(rawData["1b"] || 0),
          Number(rawData["2a"] || 0) + Number(rawData["2b"] || 0),
          Number(rawData["3a"] || 0) + Number(rawData["3b"] || 0),
          Number(rawData["4a"] || 0) + Number(rawData["4b"] || 0),
          Number(rawData["5a"] || 0) + Number(rawData["5b"] || 0)
        ],
        partB: Array.from({ length: 5 }, (_, i) => ({
          a: Number(rawData[`${i + 6}a`] || 0),
          b: Number(rawData[`${i + 6}b`] || 0)
        })),
        partC: Array.from({ length: 5 }, (_, i) => ({
          a: Number(rawData[`${i + 11}a`] || 0),
          b: Number(rawData[`${i + 11}b`] || 0)
        }))
      };

      setExtractedData(markData);
      setView("workspace");
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to extract marks from image. Ensure Python API is running.");
      // Fallback: switch to workspace even if it fails, so they can manually enter data
      setExtractedData(null);
      setView("workspace");
    } finally {
      setIsProcessing(false);
    }
  }, [answerSheetUrl, credits]);

  const handleStartDashboard = useCallback(() => {
    if (csvState) setView("dashboard");
  }, [csvState]);

  const handleBackToDashboard = useCallback(() => setView("dashboard"), []);
  const handleBackToUpload = useCallback(() => {
    setCsvFile(null);
    setCsvState(null);
    setView("upload");
  }, []);

  const handleCsvUpdate = useCallback((csv: CSVState) => setCsvState(csv), []);

  if (view === "workspace" && csvState && answerSheetUrl) {
    return (
      <VerificationWorkspace
        csvState={csvState}
        csvFileName={csvFile?.name ?? "Answer Sheet"}
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
        csvFileName={csvFile?.name ?? "Answer Sheet"}
        isProcessing={isProcessing}
        onImageUpload={handleImageUploadAndExtract}
        onBack={handleBackToUpload}
      />
    );
  }

  return (
    <UploadDashboard
      csvFile={csvFile}
      answerSheetFile={null}
      onCSVUpload={handleCSVUpload}
      onImageUpload={() => {}}
      onProcess={handleStartDashboard}
      studentCount={csvState?.dataRows.length ?? 0}
      isProcessing={false}
    />
  );
};

export default Index;
