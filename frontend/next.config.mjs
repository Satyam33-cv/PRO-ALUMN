/** @type {import('next').NextConfig} */
const nextConfig = {
  typedRoutes: false,
  typescript: {
    ignoreBuildErrors: false,
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**" },
    ],
  },
};

export default nextConfig;