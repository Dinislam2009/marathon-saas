import { NextResponse } from "next/server";

const LOCALES = ["ru", "kk"];
const DEFAULT_LOCALE = "ru";

export function middleware(request) {
  const { pathname } = request.nextUrl;

  // 1. Статикалық файлдар, суреттер мен API-ды өткізіп жіберу
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname.includes(".")
  ) {
    return;
  }

  // 2. Қабаттасқан URL-дерді тазалау (/ru/kk немесе /kk/ru)
  if (pathname.startsWith("/ru/kk") || pathname.startsWith("/kk/kk")) {
    return NextResponse.redirect(new URL("/kk", request.url));
  }
  if (pathname.startsWith("/kk/ru") || pathname.startsWith("/ru/ru")) {
    return NextResponse.redirect(new URL("/ru", request.url));
  }

  // 3. Егер URL ішінде /ru немесе /kk бар болса, редирект жасамайды
  const hasLocale = LOCALES.some(
    (locale) => pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`
  );

  if (hasLocale) return;

  // 4. Тіл көрсетілмесе ғана, автоматты түрде /ru/ қосып қайта бағыттайды
  request.nextUrl.pathname = `/${DEFAULT_LOCALE}${pathname}`;
  return NextResponse.redirect(request.nextUrl);
}

export const config = {
  matcher: ["/((?!_next|api|favicon.ico).*)"],
};