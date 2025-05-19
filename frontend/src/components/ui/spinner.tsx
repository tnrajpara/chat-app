import type React from "react";

interface SpinnerProps {
  text?: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export const LoadingSpinner: React.FC<SpinnerProps> = ({
  text = "Loading...",
  size = "md",
  className = "",
}) => {
  const sizeClasses = {
    sm: "h-4 w-4 border-2",
    md: "h-6 w-6 border-3",
    lg: "h-8 w-8 border-4",
  };

  const textSizeClasses = {
    sm: "text-xs",
    md: "text-sm",
    lg: "text-base",
  };

  return (
    <div className={`inline-flex items-center gap-2 ${className}`}>
      <div className="relative flex-shrink-0">
        <div
          className={`rounded-full border-t-current border-r-current border-b-transparent border-l-transparent animate-spin ${sizeClasses[size]}`}
        ></div>
      </div>
      {text && (
        <span className={`text-current ${textSizeClasses[size]}`}>{text}</span>
      )}
    </div>
  );
};
