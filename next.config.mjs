/** @type {import('next').NextConfig} */
const nextConfig = {
  // Баптау experimental ішінен сыртқа, негізгі деңгейге көшірілді
  serverExternalPackages: ['@prisma/client'],
};

export default nextConfig;