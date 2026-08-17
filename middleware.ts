import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const LOCALES = ["ru", "kk"];
const DEFAULT_LOCALE = "ru";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  const doubleLocaleRegex = /^\/(ru|kk)\/(ru|kk)(\/.*)?$/;
  const match = pathname.match(doubleLocaleRegex);

  if (match) {
    const correctLocale = match[2];
    const restPath = match[3] || "";
    return NextResponse.redirect(new URL(`/${correctLocale}${restPath}`, request.url));
  }

  const hasLocale = LOCALES.some(
    (locale) => pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`
  );

  if (hasLocale) {
    return NextResponse.next();
  }

  return NextResponse.redirect(new URL(`/${DEFAULT_LOCALE}${pathname}`, request.url));
}

export const config = {
  matcher: ["/((?!_next|api|favicon.ico).*)"],
};