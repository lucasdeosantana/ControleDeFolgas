
// middleware.js
import { NextResponse } from "next/server";


// Rotas públicas com GET liberado
const PUBLIC_GET_ONLY = [
  "/api/colaboradores", // 👈 exemplo
  "/api/folgas",
  "/api/ferias",
];


const PUBLIC_PATHS = [
  "/login",
  "/api/login",
  "/programacao",
  "/_next",
  "/favicon.ico",
];

export function middleware(req) {
  const { pathname } = req.nextUrl;
  const method = req.method; // GET, POST, etc.

  // Permite assets e rotas públicas
  if (PUBLIC_PATHS.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }
  
// Libera APENAS GET para rotas públicas específicas
  if (method === "GET" && PUBLIC_GET_ONLY.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }


  const session = req.cookies.get("session")?.value;

  if (!session) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("redirect", pathname);
    return NextResponse.redirect(url);
  }

  // (opcional) garantir que o usuário ainda está na lista
  const allowedUsers = (process.env.ALLOWED_USERS || "")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);

  if (!allowedUsers.includes(session.toLowerCase())) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

// protege tudo, exceto assets — o restante é liberado pelo PUBLIC_PATHS acima
export const config = {
  matcher: ["/((?!_next|favicon.ico).*)"],
};
