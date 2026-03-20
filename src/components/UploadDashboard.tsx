import { useState, useEffect } from "react";
import { GraduationCap, AlertTriangle, Plus, BookOpen, Trash2, Loader2, Coins } from "lucide-react";
import { ProfileMenu } from "@/components/ProfileMenu";
import { useAuth } from "@/lib/auth-context";
import { getUserSubjects, createSubject, deleteSubject, Subject } from "@/lib/firestore-service";
import { useSettings, defaultSettings, PartConfig } from "@/lib/settings-context";
import { toast } from "sonner";

interface UploadDashboardProps {
  onProcess: (subjectId: string, subjectName: string, subjectCode: string) => void;
}

export function UploadDashboard({
  onProcess,
}: UploadDashboardProps) {
  const { user, credits } = useAuth();
  const { settings } = useSettings();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loadingSubjects, setLoadingSubjects] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [newName, setNewName] = useState("");
  const [newCode, setNewCode] = useState("");
  const [creating, setCreating] = useState(false);
  const [localParts, setLocalParts] = useState<PartConfig[]>(defaultSettings.parts);

  const updatePart = (index: number, updates: Partial<PartConfig>) => {
    const newParts = [...localParts];
    newParts[index] = { ...newParts[index], ...updates };
    setLocalParts(newParts);
  };

  const removePart = (index: number) => {
    setLocalParts(localParts.filter((_, i) => i !== index));
  };

  const addPart = () => {
    const usedLetters = new Set(localParts.map(p => p.id));
    const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    let nextLetter = "E";
    for (const ch of alphabet) {
      if (!usedLetters.has(ch)) { nextLetter = ch; break; }
    }
    const newPart: PartConfig = {
      id: nextLetter,
      name: `Part ${nextLetter}`,
      enabled: true,
      type: "choice",
      questionCount: 5,
      maxMarks: 5,
    };
    setLocalParts([...localParts, newPart]);
  };

  useEffect(() => {
    if (user) {
      loadSubjects();
    }
  }, [user]);

  const loadSubjects = async () => {
    if (!user) return;
    setLoadingSubjects(true);
    try {
      const subs = await getUserSubjects(user.uid);
      setSubjects(subs);
    } catch (err) {
      console.error("Failed to load subjects:", err);
      toast.error("Failed to load subjects");
    } finally {
      setLoadingSubjects(false);
    }
  };

  const handleCreate = async () => {
    if (!user) return;
    if (!newName.trim() || !newCode.trim()) {
      toast.error("Please enter both subject name and code");
      return;
    }
    setCreating(true);
    try {
      const subjectSettings = { parts: localParts };
      const id = await createSubject(user.uid, newName.trim(), newCode.trim(), subjectSettings);
      toast.success(`Created "${newName.trim()}"`);
      setNewName(""); setNewCode(""); setShowForm(false); setLocalParts(defaultSettings.parts);
      onProcess(id, newName.trim(), newCode.trim());
    } catch (err) {
      console.error(err);
      toast.error("Failed to create subject");
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (subjectId: string, name: string) => {
    if (!confirm(`Delete "${name}"? This will permanently remove all grading data.`)) return;
    try {
      await deleteSubject(subjectId);
      toast.success(`Deleted "${name}"`);
      loadSubjects();
    } catch (err) {
      console.error(err);
      toast.error("Failed to delete subject");
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="border-b border-border bg-card px-4 md:px-8 py-4 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center">
            <GraduationCap className="w-6 h-6 text-primary-foreground" />
          </div>
          <span className="font-heading font-bold text-primary text-xl">Thaal</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-[#E8F3F1] dark:bg-[#34A853]/10 px-3 py-1.5 rounded-full border border-[#34A853]/10">
            <Coins className="w-3.5 h-3.5 text-[#34A853]" />
            <span className="text-xs font-bold text-[#34A853]">{credits} Credits</span>
          </div>
          <ProfileMenu />
        </div>
      </header>

      <main className="flex-1 max-w-3xl w-full mx-auto px-6 py-10">
        <h1 className="font-heading font-bold text-3xl sm:text-4xl text-foreground mb-2 text-center">Your Subjects</h1>
        <p className="text-muted-foreground text-base mb-8 text-center">
          Create or select a subject to start grading answer sheets.
        </p>

        {/* Subject List */}
        <div className="space-y-3 mb-6">
          {loadingSubjects ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : subjects.length === 0 && !showForm ? (
            <div className="bg-card rounded-2xl border border-border p-10 text-center shadow-sm">
              <BookOpen className="w-12 h-12 text-muted-foreground/40 mx-auto mb-4" />
              <h2 className="font-heading font-bold text-xl text-foreground mb-2">No Subjects Yet</h2>
              <p className="text-muted-foreground text-sm mb-6">
                Create your first subject to begin digitizing answer sheets.
              </p>
              <button
                onClick={() => setShowForm(true)}
                className="font-heading font-semibold text-base px-8 py-3 rounded-full transition-all flex items-center justify-center mx-auto gap-2 bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg shadow-primary/25 hover:scale-105"
              >
                <Plus className="w-5 h-5" />
                Create Subject
              </button>
            </div>
          ) : (
            <>
              {subjects.map((sub) => (
                <div
                  key={sub.id}
                  className="bg-card rounded-xl border border-border p-4 shadow-sm hover:border-primary/30 transition-all group"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                      <BookOpen className="w-6 h-6 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <h3 className="font-heading font-bold text-base text-foreground truncate">{sub.subjectName}</h3>
                        <span className="text-xs font-data font-bold text-muted-foreground bg-muted px-2 py-0.5 rounded-full shrink-0">{sub.subjectCode}</span>
                      </div>
                      <p className="text-xs text-muted-foreground font-data">
                        {sub.gradedCount} graded · {sub.studentCount} total students
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => onProcess(sub.id, sub.subjectName, sub.subjectCode)}
                        className="font-heading font-semibold text-sm px-5 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-all shadow-sm"
                      >
                        Open
                      </button>
                      <button
                        onClick={() => handleDelete(sub.id, sub.subjectName)}
                        className="p-2 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors opacity-0 group-hover:opacity-100"
                        title="Delete subject"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </>
          )}
        </div>

        {/* New Subject Form */}
        {showForm && (
          <div className="bg-card rounded-2xl border-2 border-primary/20 p-6 shadow-md mb-6 animate-in fade-in slide-in-from-top-2">
            <h3 className="font-heading font-bold text-lg text-foreground mb-4">New Subject</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
              <label className="flex flex-col gap-1.5">
                <span className="text-xs font-heading font-bold uppercase tracking-wider text-muted-foreground">Subject Name</span>
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="e.g. Data Structures"
                  className="px-4 py-2.5 bg-background border border-border rounded-lg font-data text-sm focus:border-primary focus:ring-1 focus:ring-primary/20 outline-none transition-all"
                  autoFocus
                />
              </label>
              <label className="flex flex-col gap-1.5">
                <span className="text-xs font-heading font-bold uppercase tracking-wider text-muted-foreground">Subject Code</span>
                <input
                  type="text"
                  value={newCode}
                  onChange={(e) => setNewCode(e.target.value)}
                  placeholder="e.g. CS201"
                  className="px-4 py-2.5 bg-background border border-border rounded-lg font-data text-sm focus:border-primary focus:ring-1 focus:ring-primary/20 outline-none transition-all"
                />
              </label>
            </div>

            <div className="mb-6 space-y-4">
              <div className="flex items-center justify-between border-b border-border pb-2">
                <h4 className="font-heading font-bold text-base text-foreground">Question Sections (Grading Rules)</h4>
                <p className="text-xs text-muted-foreground">Setup your layout here before grading.</p>
              </div>

              <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2">
                {localParts.map((part, index) => (
                  <div key={`${part.id}-${index}`} className={`p-4 rounded-xl border transition-all ${part.enabled ? 'border-primary/30 bg-primary/5' : 'border-border bg-muted/20 opacity-70'}`}>
                    <div className="flex items-center gap-3 mb-4">
                      <input 
                        type="checkbox" 
                        checked={part.enabled}
                        onChange={(e) => updatePart(index, { enabled: e.target.checked })}
                        className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary"
                      />
                      <span className="font-heading font-bold text-base flex-1">{part.name}</span>
                      {localParts.length > 1 && (
                        <button 
                          onClick={() => removePart(index)}
                          className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                          title="Remove this part"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                    {part.enabled && (
                      <div className="flex flex-col sm:flex-row sm:items-center gap-4 text-sm font-heading">
                        <label className="flex flex-col gap-1.5 w-full sm:w-auto">
                          <span className="text-muted-foreground text-xs font-bold uppercase tracking-wider">Questions</span>
                          <input 
                            type="number" min="0" max="20"
                            value={part.questionCount}
                            onChange={(e) => updatePart(index, { questionCount: parseInt(e.target.value) || 0 })}
                            className="w-full sm:w-20 px-3 py-2 bg-background border border-border rounded-lg shadow-sm"
                          />
                        </label>
                        <label className="flex flex-col gap-1.5 w-full sm:w-auto">
                          <span className="text-muted-foreground text-xs font-bold uppercase tracking-wider">Max Mark</span>
                          <input 
                            type="number" min="0" max="50" step="0.5"
                            value={part.maxMarks}
                            onChange={(e) => updatePart(index, { maxMarks: parseFloat(e.target.value) || 0 })}
                            className="w-full sm:w-20 px-3 py-2 bg-background border border-border rounded-lg shadow-sm"
                          />
                        </label>
                        <label className="flex flex-col gap-1.5 w-full sm:w-auto flex-1">
                          <span className="text-muted-foreground text-xs font-bold uppercase tracking-wider">Type</span>
                          <select 
                            value={part.type}
                            onChange={(e) => updatePart(index, { type: e.target.value as any })}
                            className="w-full px-3 py-2 bg-background border border-border rounded-lg shadow-sm"
                          >
                            <option value="single">Single Field</option>
                            <option value="choice">A/B Choice</option>
                          </select>
                        </label>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <button
                onClick={addPart}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border-2 border-dashed border-border text-muted-foreground hover:border-primary hover:text-primary hover:bg-primary/5 transition-all font-heading text-sm font-semibold"
              >
                <Plus className="w-4 h-4" />
                Add Section
              </button>
            </div>

            <div className="flex items-center gap-3 justify-end pt-4 border-t border-border">
              <button
                onClick={() => { setShowForm(false); setNewName(""); setNewCode(""); setLocalParts(defaultSettings.parts); }}
                className="px-5 py-2 rounded-lg font-heading text-sm font-semibold text-muted-foreground hover:bg-muted transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCreate}
                disabled={creating}
                className="flex items-center gap-2 px-5 py-2 rounded-lg font-heading text-sm font-semibold bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-60 shadow-sm"
              >
                {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                Create & Open
              </button>
            </div>
          </div>
        )}

        {/* Add Subject button (when subjects already exist) */}
        {!showForm && subjects.length > 0 && (
          <button
            onClick={() => setShowForm(true)}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl border-2 border-dashed border-border text-muted-foreground hover:border-primary hover:text-primary hover:bg-primary/5 transition-all font-heading text-sm font-semibold mb-6"
          >
            <Plus className="w-4 h-4" />
            Add New Subject
          </button>
        )}

        {/* AI Disclaimer */}
        <div className="max-w-lg mx-auto bg-warning/10 border border-warning/30 rounded-xl p-4 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-warning shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-heading font-semibold text-warning mb-1">AI Disclaimer</p>
            <p className="text-xs text-muted-foreground leading-relaxed">
              This application uses AI to extract marks from answer sheets. AI-based extraction may not be 100% accurate. 
              Always verify and review the extracted marks before final submission.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
