
// middleware.js
import { NextResponse } from "next/server";

const PUBLIC_PATHS = [
  "/login",
  "/api/login",

  "/_next",
  "/favicon.ico",
];

export function middleware(req) {
  const { pathname } = req.nextUrl;

  // Permite assets e rotas públicas
  if (PUBLIC_PATHS.some((p) => pathname.startsWith(p))) {
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
