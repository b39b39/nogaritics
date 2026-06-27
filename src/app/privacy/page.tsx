import type { Metadata } from "next";

export const metadata: Metadata = { title: "개인정보처리방침" };

export default function PrivacyPage() {
  return (
    <div className="max-w-2xl mx-auto py-8 space-y-8 text-sm text-gray-700 leading-relaxed">
      <h1 className="text-2xl font-bold text-gray-900">개인정보처리방침</h1>
      <p className="text-gray-500 text-xs">최종 수정일: 2026년 6월 28일</p>

      <section className="space-y-2">
        <h2 className="text-base font-semibold text-gray-900">1. 수집하는 개인정보 항목</h2>
        <p>Nogaritics는 Discord OAuth 로그인 시 아래 정보를 수집합니다.</p>
        <ul className="list-disc list-inside space-y-1 pl-2">
          <li>Discord 계정 ID</li>
          <li>이메일 주소</li>
          <li>닉네임(사용자명)</li>
          <li>프로필 이미지 URL</li>
          <li>배너 이미지 URL</li>
        </ul>
        <p>서비스 이용 과정에서 작성한 평점, 코멘트, 즐겨찾기 정보도 저장됩니다.</p>
      </section>

      <section className="space-y-2">
        <h2 className="text-base font-semibold text-gray-900">2. 수집 목적</h2>
        <ul className="list-disc list-inside space-y-1 pl-2">
          <li>로그인 및 회원 식별</li>
          <li>평점·코멘트 등 서비스 기능 제공</li>
          <li>프로필 페이지 표시</li>
        </ul>
      </section>

      <section className="space-y-2">
        <h2 className="text-base font-semibold text-gray-900">3. 보유 및 이용 기간</h2>
        <p>
          회원 탈퇴 또는 삭제 요청 시까지 보유합니다. 탈퇴 요청은 아래 연락처로
          문의하시면 처리해드립니다.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-base font-semibold text-gray-900">4. 제3자 제공 및 위탁</h2>
        <p>수집한 개인정보를 제3자에게 제공하지 않습니다. 다만 서비스 운영을 위해 아래 업체에 처리를 위탁합니다.</p>
        <ul className="list-disc list-inside space-y-1 pl-2">
          <li><span className="font-medium">Cloudflare</span> — 서버 호스팅 및 CDN</li>
          <li><span className="font-medium">Neon</span> — 데이터베이스 저장</li>
          <li><span className="font-medium">Cloudflare R2</span> — 이미지 파일 저장</li>
          <li><span className="font-medium">Discord</span> — OAuth 인증 제공</li>
        </ul>
      </section>

      <section className="space-y-2">
        <h2 className="text-base font-semibold text-gray-900">5. 이용자의 권리</h2>
        <p>이용자는 언제든지 아래 권리를 행사할 수 있습니다.</p>
        <ul className="list-disc list-inside space-y-1 pl-2">
          <li>개인정보 열람 요청</li>
          <li>개인정보 수정 요청</li>
          <li>개인정보 삭제(탈퇴) 요청</li>
        </ul>
        <p>
          요청은 아래 이메일로 문의해 주세요. 접수 후 5영업일 이내에 처리합니다.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-base font-semibold text-gray-900">6. 쿠키 사용</h2>
        <p>
          로그인 상태 유지를 위해 세션 쿠키를 사용합니다. 이 쿠키는 서비스 필수
          기능에 해당하며, 별도 동의 없이 사용됩니다. 브라우저 설정에서 쿠키를
          비활성화하면 로그인 기능을 이용할 수 없습니다.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-base font-semibold text-gray-900">7. 개인정보 보호책임자</h2>
        <p>
          개인정보 관련 문의, 열람·정정·삭제 요청은 아래로 연락해 주세요.
        </p>
        <p className="font-medium">이메일: wkdska311@naver.com</p>
      </section>

      <p className="text-gray-400 text-xs border-t border-gray-100 pt-4">
        본 방침은 관련 법령 변경 또는 서비스 정책 변경 시 사전 공지 없이 수정될 수 있습니다.
      </p>
    </div>
  );
}
