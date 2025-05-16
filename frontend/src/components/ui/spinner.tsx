import type React from "react";

interface SpinnerProps {
  text?: string;
}

export const LoadingSpinner: React.FC<SpinnerProps> = ({
  text = "Loading...",
}) => {
  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <div className="relative flex flex-col items-center">
        <div className="relative h-16 w-16">
          <div className="absolute h-full w-full rounded-full border-4 border-t-black border-r-black border-b-transparent border-l-transparent animate-spin"></div>
          <div className="absolute h-8 w-8 rounded-full border-4 border-t-white border-r-white border-b-transparent border-l-transparent animate-spin-reverse top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"></div>
        </div>
        {text && (
          <p className="mt-4 text-sm font-medium text-foreground">{text}</p>
        )}
      </div>
    </div>
  );
};
