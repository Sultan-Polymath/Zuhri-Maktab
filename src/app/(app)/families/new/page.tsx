import { PageHeader } from "@/components/layout/page-header";
import { FamilyNewForm } from "./family-new-form";

export default function NewFamilyPage() {
  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader
        title="Add Family"
        description="Create a household record. You can add children to it afterwards."
      />
      <FamilyNewForm />
    </div>
  );
}
