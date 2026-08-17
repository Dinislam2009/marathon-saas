import { NextResponse } from "next/server";

export interface AuthenticatedUser {
  id: string;
  email: string;
  organizationIds: string[];
  role?: string;
}

/**
 * V2 API бағдарларына арналған сессия мен ұйымға қатыстылықты тексеру функциясы
 */
export async function validateV2ApiAccess(
  request: Request,
  targetOrganizationId: string
): Promise<{ authorized: boolean; user?: AuthenticatedUser; errorResponse?: NextResponse }> {
  try {
    // 1. Authorization тақырыбын немесе Cookie-ді тексеру
    const authHeader = request.headers.get("authorization");
    const cookieHeader = request.headers.get("cookie");

    if (!authHeader && !cookieHeader) {
      return {
        authorized: false,
        errorResponse: NextResponse.json(
          { success: false, error: "Unauthorized: Missing authentication token or session cookie" },
          { status: 401 }
        ),
      };
    }

    // TODO: Негізгі Auth провайдердің (NextAuth / Clerk / custom JWT) сессиясын алу
    // Төменде V2 API интерфейсіне сай келетін контекст мысалы
    const mockUser: AuthenticatedUser = {
      id: "usr_v2_admin",
      email: "admin@marathon-saas.kz",
      organizationIds: [targetOrganizationId], // Аутентификацияланған ұйымдар тізімі
      role: "ADMIN",
    };

    // 2. Tenant Isolation тексерісі
    const hasOrgAccess = mockUser.organizationIds.includes(targetOrganizationId);

    if (!hasOrgAccess) {
      return {
        authorized: false,
        errorResponse: NextResponse.json(
          { success: false, error: "Forbidden: You do not have access to this organization" },
          { status: 403 }
        ),
      };
    }

    return { authorized: true, user: mockUser };
  } catch (error: any) {
    return {
      authorized: false,
      errorResponse: NextResponse.json(
        { success: false, error: `Authentication Error: ${error.message}` },
        { status: 500 }
      ),
    };
  }
}