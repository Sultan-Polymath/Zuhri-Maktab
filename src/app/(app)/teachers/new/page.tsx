import { PageHeader } from "@/components/layout/page-header";
import { TeacherForm } from "@/components/teachers/teacher-form";

export default function NewTeacherPage() {
  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader title="Add Teacher" />
      <TeacherForm />
    </div>
  );
}
