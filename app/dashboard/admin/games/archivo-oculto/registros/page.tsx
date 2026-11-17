import {requireAdmin} from "@/lib/auth/admin";
import ArchivoOcultoRecordsStudio from "@/components/games/ArchivoOcultoRecordsStudio";
export const dynamic="force-dynamic";
export default async function Page(){await requireAdmin();return <ArchivoOcultoRecordsStudio/>;}
