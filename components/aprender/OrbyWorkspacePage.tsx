"use client";

import { useSearchParams } from "next/navigation";
import EnglishStudioPage from "@/components/aprender/EnglishStudioPage";
import StuddyClassroom from "@/components/aprender/StuddyClassroom";

export default function OrbyWorkspacePage() {
  const searchParams = useSearchParams();
  return searchParams.get("view") === "english"
    ? <EnglishStudioPage />
    : <StuddyClassroom />;
}
