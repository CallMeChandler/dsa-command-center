import { NextResponse } from "next/server";
import { readProgress, writeProgress } from "@/lib/githubStore";
import type { Progress } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function GET(){
  try { const result=await readProgress(); return NextResponse.json(result); }
  catch(error){ return NextResponse.json({error:error instanceof Error?error.message:"Unable to load progress"},{status:500}); }
}

export async function PUT(request:Request){
  try {
    const progress=(await request.json()) as Progress;
    if(!progress || typeof progress.completed!=="object") return NextResponse.json({error:"Invalid progress payload"},{status:400});
    progress.updatedAt=new Date().toISOString();
    await writeProgress(progress);
    return NextResponse.json({ok:true,updatedAt:progress.updatedAt});
  } catch(error){ return NextResponse.json({error:error instanceof Error?error.message:"Unable to save progress"},{status:500}); }
}
