import React from "react";

export default function LoadingSpinner({ text = "Loading..." }: { text?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16">
      <div className="w-10 h-10 border-4 border-primary-200 border-t-primary-600
                      rounded-full animate-spin mb-3" />
      <p className="text-gray-500 text-sm">{text}</p>
    </div>
  );
}