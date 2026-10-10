"use client";

import type { ReactNode } from "react";
import { useFormStatus } from "react-dom";

interface ConfirmSubmitButtonProps {
  confirmMessage: string;
  className: string;
  children: ReactNode;
}

export function ConfirmSubmitButton({ confirmMessage, className, children }: ConfirmSubmitButtonProps) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className={`${className} disabled:cursor-wait disabled:opacity-50`}
      onClick={(event) => {
        if (!window.confirm(confirmMessage)) event.preventDefault();
      }}>
      {pending ? "Working…" : children}
    </button>
  );
}
