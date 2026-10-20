import { requireAdmin } from "@/lib/auth/admin";
import LessonQuestionsEditor from "@/components/admin/LessonQuestionsEditor";
export const dynamic = "force-dynamic";
export default async function LessonQuestionsPage() { await requireAdmin(); return <LessonQuestionsEditor />; }
