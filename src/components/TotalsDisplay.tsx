interface TotalsDisplayProps {
  partATotal: number;
  partBTotal: number;
  partCTotal: number;
  grandTotal: number;
}

export function TotalsDisplay({ partATotal, partBTotal, partCTotal, grandTotal }: TotalsDisplayProps) {
  return (
    <div className="flex gap-6 font-data text-sm">
      <div className="flex flex-col items-center">
        <span className="text-[10px] text-muted-foreground font-heading">PART A</span>
        <span className="text-foreground">{partATotal}/10</span>
      </div>
      <div className="flex flex-col items-center">
        <span className="text-[10px] text-muted-foreground font-heading">PART B</span>
        <span className="text-foreground">{partBTotal}/20</span>
      </div>
      <div className="flex flex-col items-center">
        <span className="text-[10px] text-muted-foreground font-heading">PART C</span>
        <span className="text-foreground">{partCTotal}/35</span>
      </div>
      <div className="flex flex-col items-center border-l border-border pl-6">
        <span className="text-[10px] text-muted-foreground font-heading">GRAND TOTAL</span>
        <span className="text-primary font-semibold text-base">{grandTotal}/65</span>
      </div>
    </div>
  );
}
