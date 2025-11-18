// vite.config.js
import { defineConfig } from 'vite';

export default defineConfig(({ command }) => {
  const isProd = command === 'build'; // 빌드 명령일 때만 true

  return {
    // 개발 서버(로컬)일 때는 base 경로를 '/' (루트)로 설정합니다.
    // 빌드할 때만 GitHub Pages 경로 '/Intothe-Forest/'를 적용합니다.
    base: isProd ? '/Intothe-Forest/' : '/',
    // 그 외 설정...
    
    // (만약 다른 설정이 있다면 여기에 포함)
    // plugins: [
    //   ...
    // ],
  };
});