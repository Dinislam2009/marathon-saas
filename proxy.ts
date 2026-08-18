import { NextResponse } from "next/server";

const LOCALES = ["ru", "kk"];
const DEFAULT_LOCALE = "ru";

export function middleware(request) {
  const { pathname } = request.nextUrl;

  // 1. Статикалық файлдарды, суреттерді және API жолдарын өткізіп жіберу[cite: 52]
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname.includes(".")
  ) {
    return;
  }

  // 2. Қабаттасқан URL-дерді тазалау және ішкі жолды (path) сақтап қалу
  const doubleLocaleRegex = /^\/(ru|kk)\/(ru|kk)(\/.*)?$/;
  const match = pathname.match(doubleLocaleRegex);

  if (match) {
    const correctLocale = match[2]; // Екінші көрсетілген тілді негізгі қылып аламыз
    const restPath = match[3] || "";
    return NextResponse.redirect(new URL(`/${correctLocale}${restPath}`, request.url));
  }

  // 3. Егер URL ішінде /ru немесе /kk бар болса, редирект жасамаймыз[cite: 52]
  const hasLocale = LOCALES.some(
    (locale) => pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`
  );

  if (hasLocale) return;

  // 4. Тіл көрсетілмесе ғана, автоматты түрде /ru/ қосып қайта бағыттаймыз[cite: 52]
  request.nextUrl.pathname = `/${DEFAULT_LOCALE}${pathname}`;
  return NextResponse.redirect(request.nextUrl);
}

export const config = {
  matcher: ["/((?!_next|api|favicon.ico).*)"],
};