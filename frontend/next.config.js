/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  rewrites: [
    {
      source: '/orgs',
      destination: '/orgs/Index',
    },
    {
      source: '/actions',
      destination: '/actions/Index',
    }
  ]
}

module.exports = nextConfig
