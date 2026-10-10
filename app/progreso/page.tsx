import { redirect } from "next/navigation";

export default function ProgresoPage() {
  // El acceso global Progreso reúne rendimiento, simulacros y estadísticas.
  redirect("/dashboard/estadisticas");
}
