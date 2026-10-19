import React from 'react';
import { AlertTriangle, Info } from 'lucide-react';

interface DisclaimerBannerProps {
  compact?: boolean;
}

export const DisclaimerBanner: React.FC<DisclaimerBannerProps> = ({ compact = false }) => {
  if (compact) {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 text-xs text-amber-300 bg-amber-950/30 border border-amber-800/40 rounded-lg">
        <Info className="w-3.5 h-3.5 shrink-0" />
        <span>Decision support only: ConstructGuard detects indicators of potentially unauthorized construction and prioritizes sites for human inspection.</span>
      </div>
    );
  }

  return (
    <div className="flex items-start gap-3 p-3.5 rounded-xl bg-amber-950/20 border border-amber-700/30 text-amber-200/90 text-sm">
      <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
      <div>
        <p className="font-semibold text-amber-300">Decision Support System Notice</p>
        <p className="text-xs text-amber-200/80 mt-0.5">
          ConstructGuard detects indicators of potentially unauthorized construction and prioritizes sites for human inspection. The system provides decision support, not legal enforcement.
        </p>
      </div>
    </div>
  );
};
