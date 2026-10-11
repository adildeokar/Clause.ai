import { withAuth } from "next-auth/middleware";

// Redirect unauthenticated visitors of dashboard pages to the login page.
// API routes enforce auth themselves and return 401 JSON instead.
export default withAuth({
  pages: {
    signIn: "/login",
  },
});

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/contracts/:path*",
    "/analysis/:path*",
    "/analytics/:path*",
    "/drafting/:path*",
    "/templates/:path*",
    "/settings/:path*",
  ],
};
