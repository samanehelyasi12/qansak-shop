import { useId } from "react";
import type { InputHTMLAttributes } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export default function Input({
  label,
  error,
  className = "",
  id,
  ...props
}: InputProps) {
  const autoId = useId();
  const inputId = id || autoId;
  const errorId = `${inputId}-error`;

  return (
    <div className="w-full">
      {label && (
        <label htmlFor={inputId} className="block mb-2 text-sm font-medium text-cocoa">
          {label}
        </label>
      )}
      <input
        id={inputId}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? errorId : undefined}
        className={`w-full px-4 py-2 border rounded-lg text-cocoa bg-white focus:outline-none focus:ring-2 focus:ring-caramel ${
          error ? "border-berry" : "border-gray-300"
        } ${className}`}
        {...props}
      />
      {error && (
        <p id={errorId} className="mt-1 text-sm text-berry">
          {error}
        </p>
      )}
    </div>
  );
}
