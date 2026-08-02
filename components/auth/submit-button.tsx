"use client";

import { useFormStatus } from "react-dom";

type SubmitButtonProps = Readonly<{
  children: React.ReactNode;
  pendingLabel: string;
}>;

export function SubmitButton({ children, pendingLabel }: SubmitButtonProps) {
  const { pending } = useFormStatus();

  return (
    <button className="kh-button" type="submit" disabled={pending}>
      {pending ? pendingLabel : children}
    </button>
  );
}
