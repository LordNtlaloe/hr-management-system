
import React from "react";

interface StepIndicatorProps {
  currentStep: number;
  totalSteps: number;
}

export function StepIndicator({ currentStep, totalSteps }: StepIndicatorProps) {
  return (
    <div className="flex items-center justify-center mb-8">
      {Array.from({ length: totalSteps }, (_, i) => i + 1).map((step) => (
        <React.Fragment key={step}>
          <Step number={step} active={currentStep === step} />
          {step < totalSteps && (
            <div className="w-16 h-0.5 bg-muted mx-4"></div>
          )}
        </React.Fragment>
      ))}
    </div>
  );
}

function Step({ number, active }: { number: number; active: boolean }) {
  return (
    <div
      className={`flex items-center ${active ? "text-primary" : "text-muted-foreground"}`}
    >
      <div
        className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${
          active
            ? "border-primary bg-primary text-white"
            : "border-muted-foreground"
        }`}
      >
        {number}
      </div>
    </div>
  );
}
