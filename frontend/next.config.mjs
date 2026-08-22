/** @type {import('next').NextConfig} */
const nextConfig = {
  typedRoutes: false,
  output: "standalone",
  typescript: {
    ignoreBuildErrors: true,
  },
};

export default nextConfig;