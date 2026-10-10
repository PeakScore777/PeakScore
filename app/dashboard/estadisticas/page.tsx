import { redirect } from "next/navigation";

export default function LegacyStatisticsPage() {
  // El acceso oficial al progreso y las estadísticas está en /progreso.
  redirect("/progreso");
}
