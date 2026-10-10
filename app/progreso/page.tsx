import { redirect } from "next/navigation";

export default function ProgresoPage() {
  // El dashboard ya reúne estadísticas, rendimiento y actividad reciente.
  // Mantener /progreso como entrada global evita tener dos paneles paralelos.
  redirect("/dashboard");
}
