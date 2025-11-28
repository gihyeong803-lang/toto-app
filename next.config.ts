import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 1. React Strict Mode 해제 (선택사항)
  reactStrictMode: false,

  // 2. 외부 이미지 허용 설정 (팀 로고용)
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'resources.premierleague.com',
      },
      {
        protocol: 'https',
        hostname: 'www.premierleague.com',
      },
      {
        protocol: 'https',
        hostname: 'assets.codepen.io',
      },
    ],
  },

  // 3. API 대리 전달 (Proxy 설정) - 회원가입 중복확인 해결용
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        // ★ 여기에 Render 서버 주소를 넣으세요!
        destination: 'https://toto-server-f4j2.onrender.com/api/:path*', 
      },
    ];
  },
};

export default nextConfig;