/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "export",
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
  // basePath will be set dynamically by build script
  basePath: process.env.NEXT_PUBLIC_BASE_PATH || "",
}

export default nextConfig
