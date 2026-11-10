import { NextRequest, NextResponse } from "next/server";
import { createSession, sessionCookieOptions } from "@/lib/auth";
export async function POST(req:NextRequest) { const body=await req.json().catch(()=>({})); const expected=process.env.ADMIN_PASSWORD; if(!expected||!body||body.password!==expected)return NextResponse.json({error:"Invalid password."},{status:401}); const res=NextResponse.json({ok:true}); res.cookies.set({...sessionCookieOptions(),value:createSession()}); return res; }
