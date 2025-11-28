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
      // ★ [추가됨] 위키피디아 로고 허용
      {
        protocol: 'https',
        hostname: 'upload.wikimedia.org',
      },
      // ★ [추가됨] ESPN 로고 허용 (선덜랜드 등 해결용)
      {
        protocol: 'https',
        hostname: 'a.espncdn.com',
      },
    ],
  },

  // 3. API 대리 전달 (Proxy 설정) - 회원가입 중복확인 해결용
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        // ★ Render 서버 주소 (유지)
        destination: 'https://toto-server-f4j2.onrender.com/api/:path*', 
      },
    ];
  },
};

export default nextConfig;