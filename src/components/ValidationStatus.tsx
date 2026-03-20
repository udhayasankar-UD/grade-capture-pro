import { ValidationError } from "@/lib/types";

interface ValidationStatusProps {
  errors: ValidationError[];
  successMessage?: string;
}

export function ValidationStatus({ errors, successMessage }: ValidationStatusProps) {
  if (successMessage) {
    return (
      <div className="bg-success/10 border border-success/30 rounded-sm px-4 py-3">
        <p className="text-success font-heading text-sm">{successMessage}</p>
      </div>
    );
  }

  if (errors.length === 0) return null;

  return (
    <div className="bg-destructive/10 border border-destructive/30 rounded-sm px-4 py-3">
      <ul className="space-y-1">
        {errors.map((err, i) => (
          <li key={i} className="text-destructive font-heading text-sm">
            {err.message}
          </li>
        ))}
      </ul>
    </div>
  );
}
