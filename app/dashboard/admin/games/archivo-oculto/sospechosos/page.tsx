import { requireAdmin } from "@/lib/auth/admin";
import ArchivoOcultoSuspectsStudio from "@/components/games/ArchivoOcultoSuspectsStudio";
export const dynamic="force-dynamic";
type Props={searchParams:Promise<{passageId?:string}>};
export default async function Page({searchParams}:Props){await requireAdmin();const params=await searchParams;return <ArchivoOcultoSuspectsStudio initialPassageId={params.passageId??""}/>;}
