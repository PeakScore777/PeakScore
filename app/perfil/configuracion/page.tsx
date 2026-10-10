import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import ConfiguracionPanel from "@/components/perfil/ConfiguracionPanel";

export default async function ConfiguracionPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, role")
    .eq("id", user.id)
    .maybeSingle();

  return (
    <main className="min-h-screen bg-[#070510] px-3 pb-28 pt-5 text-white sm:px-6 sm:pt-7 lg:px-8">
      <div className="mx-auto w-full max-w-5xl">
        <ConfiguracionPanel
          initialEmail={user.email ?? ""}
          initialFullName={profile?.full_name ?? user.user_metadata?.full_name ?? ""}
          initialPhone={user.phone_confirmed_at ? user.phone ?? "" : ""}
          isAdmin={profile?.role === "admin"}
        />
      </div>
    </main>
  );
}
