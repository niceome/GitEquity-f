import { Navigate } from 'react-router-dom'

const GITHUB_LOGIN_URL = '/oauth2/authorization/github'

export default function LoginPage() {
  if (localStorage.getItem('accessToken')) return <Navigate to="/projects" replace />

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-indigo-900">
      <div className="w-full max-w-sm rounded-2xl bg-white/5 p-10 backdrop-blur-sm border border-white/10 shadow-2xl text-center">
        {/* Logo */}
        <div className="mb-6 flex justify-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-600 shadow-lg">
            <svg className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
        </div>

        <h1 className="text-3xl font-bold text-white tracking-tight">GitEquity</h1>
        <p className="mt-2 text-sm text-gray-400">
          GitHub 기여도 기반 지분 계약 자동화 플랫폼
        </p>

        <div className="mt-8 flex flex-col gap-3">
          <a
            href={GITHUB_LOGIN_URL}
            className="flex items-center justify-center gap-3 rounded-xl bg-white px-5 py-3 text-sm font-semibold text-gray-900 shadow hover:bg-gray-100 transition-colors"
          >
            <svg className="h-5 w-5 fill-gray-900" viewBox="0 0 24 24">
              <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z" />
            </svg>
            GitHub으로 로그인
          </a>
        </div>

        <p className="mt-6 text-xs text-gray-500">
          로그인하면 GitHub 저장소 기여 데이터를 분석하여<br />팀 지분 계약서를 자동으로 생성합니다.
        </p>
      </div>
    </div>
  )
}
