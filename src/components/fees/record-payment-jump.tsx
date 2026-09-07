"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { CreditCard } from "lucide-react";
import { NativeSelect } from "@/components/forms/native-select";
import { Button } from "@/components/ui/button";

type FamilyOption = { id: string; surnameLabel: string };

export function RecordPaymentJump({ families }: { families: FamilyOption[] }) {
  const router = useRouter();
  const [familyId, setFamilyId] = useState("");

  return (
    <div className="flex gap-2">
      <NativeSelect
        value={familyId}
        onChange={(e) => setFamilyId(e.target.value)}
        className="w-56"
      >
        <option value="">Select a family…</option>
        {families.map((f) => (
          <option key={f.id} value={f.id}>
            {f.surnameLabel}
          </option>
        ))}
      </NativeSelect>
      <Button
        variant="outline"
        disabled={!familyId}
        onClick={() => router.push(`/families/${familyId}/pay`)}
      >
        <CreditCard />
        Record Payment
      </Button>
    </div>
  );
}
