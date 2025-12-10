
// app/api/login/route.js
import { NextResponse } from "next/server";

export async function POST(request) {
  const { user, password } = await request.json();

  const allowedUsers = (process.env.ALLOWED_USERS || "")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);

  const okPassword = process.env.LOGIN_PASSWORD;

  if (!user || !password) {
    return NextResponse.json({ message: "Usuário e senha são obrigatórios" }, { status: 400 });
  }

  if (!allowedUsers.includes(String(user).toLowerCase())) {
    return NextResponse.json({ message: "Usuário não autorizado" }, { status: 401 });
  }

  if (password !== okPassword) {
    return NextResponse.json({ message: "Senha inválida" }, { status: 401 });
  }

  // Cookie de sessão simples
  const res = NextResponse.json({ ok: true });
  res.cookies.set("session", user, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 8, // 8h
  });

  return res;
}
