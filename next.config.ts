/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,

  // ★ [추가됨] 외부 이미지 주소 허용 설정
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'resources.premierleague.com', // 프리미어리그 로고 서버 1
      },
      {
        protocol: 'https',
        hostname: 'www.premierleague.com',       // 프리미어리그 로고 서버 2
      },
      {
        protocol: 'https',
        hostname: 'assets.codepen.io',           // 혹시 모를 기본 이미지용
      },
    ],
  },

  // 아까 설정한 API 대리 전달 (유지)
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://localhost:4000/api/:path*',
      },
    ];
  },
};

export default nextConfig;