/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  images: {
    domains: ["images.unsplash.com", "avatars.githubusercontent.com"],
  },
  webpack: (config) => {
    // Treat node:sqlite as external on server side
    config.externals.push("node:sqlite");
    return config;
  },
};

export default nextConfig;
