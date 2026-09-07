"use client";

import { useActionState, useEffect, useRef } from "react";
import { createPaymentMethod } from "@/lib/actions/payment-methods";
import { FormError } from "@/components/forms/field";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export function AddPaymentMethodForm() {
  const [state, formAction, isPending] = useActionState(createPaymentMethod, undefined);
  const formRef = useRef<HTMLFormElement>(null);
  const prevPending = useRef(isPending);

  useEffect(() => {
    if (prevPending.current && !isPending && !state?.error) {
      formRef.current?.reset();
    }
    prevPending.current = isPending;
  }, [isPending, state]);

  return (
    <form ref={formRef} action={formAction} className="space-y-2">
      <FormError message={state?.error} />
      <div className="flex items-end gap-2">
        <div className="flex-1 space-y-2">
          <label className="text-sm font-medium" htmlFor="name">
            New payment method
          </label>
          <Input id="name" name="name" placeholder="e.g. Standing Order" required />
        </div>
        <Button type="submit" disabled={isPending}>
          {isPending ? "Adding…" : "Add"}
        </Button>
      </div>
    </form>
  );
}
