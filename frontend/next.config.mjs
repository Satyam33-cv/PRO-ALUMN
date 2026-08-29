/** @type {import('next').NextConfig} */
const nextConfig = {
  typedRoutes: false,
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**" },
    ],
  },
};

export default nextConfig;