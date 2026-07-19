/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    // Turbopack пен Server Actions Prisma клиентін ішкі chunk-тарға бөлмей, 
    // тікелей node_modules ішінен таза оқуы үшін міндетті баптау
    serverComponentsExternalPackages: ['@prisma/client'],
  },
};

export default nextConfig;