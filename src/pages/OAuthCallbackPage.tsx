import { useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'

export default function OAuthCallbackPage() {
  const navigate = useNavigate()
  // React 18 StrictMode에서 useEffect가 두 번 실행되는 것을 방지
  const processed = useRef(false)

  useEffect(() => {
    if (processed.current) return
    processed.current = true

    const params = new URLSearchParams(window.location.search)
    const token = params.get('token')

    if (token) {
      localStorage.setItem('accessToken', token)
      navigate('/projects', { replace: true })
    } else {
      navigate('/login', { replace: true })
    }
  }, [navigate])

  return (
    <div className="flex items-center justify-center min-h-screen">
      <p className="text-gray-500">로그인 처리 중...</p>
    </div>
  )
}
