import { useParams } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import toast from 'react-hot-toast'
import Layout from '../components/Layout'
import Button from '../components/ui/Button'
import LoadingSpinner from '../components/ui/LoadingSpinner'
import { getEquity, createSnapshot, getLatestSnapshot, triggerCollection } from '../api/projects'
import { listContracts, createContract, sendContract } from '../api/contracts'
import type { UserEquity, ContractResponse } from '../types'
import { useAuth } from '../hooks/useAuth'
import { useNavigate } from 'react-router-dom'

const COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#3b82f6', '#ef4444', '#14b8a6']

function EquityPieChart({ equities }: { equities: UserEquity[] }) {
  const data = equities.map((e) => ({ name: e.username, value: e.percentage }))

  return (
    <ResponsiveContainer width="100%" height={260}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          innerRadius={60}
          outerRadius={100}
          paddingAngle={2}
          dataKey="value"
        >
          {data.map((_, i) => (
            <Cell key={i} fill={COLORS[i % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip formatter={(v) => [`${Number(v).toFixed(2)}%`]} />
        <Legend
          formatter={(value) => <span className="text-xs text-gray-600">{value}</span>}
        />
      </PieChart>
    </ResponsiveContainer>
  )
}

function MemberEquityCard({ equity, color }: { equity: UserEquity; color: string }) {
  const types = [
    { label: '커밋', key: 'COMMIT' as const, icon: '●' },
    { label: 'PR',   key: 'PR'     as const, icon: '↑' },
    { label: '리뷰', key: 'REVIEW' as const, icon: '✓' },
    { label: '이슈', key: 'ISSUE'  as const, icon: '!' },
  ]

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full text-white text-sm font-bold" style={{ backgroundColor: color }}>
            {equity.username[0].toUpperCase()}
          </div>
          <div>
            <p className="font-semibold text-gray-900">{equity.username}</p>
            <p className="text-xs text-gray-500">Raw score: {equity.rawScore.toFixed(1)}</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold text-indigo-600">{equity.percentage.toFixed(1)}%</p>
        </div>
      </div>

      <div className="mt-3 grid grid-cols-4 gap-2">
        {types.map(({ label, key }) => (
          <div key={key} className="rounded-lg bg-gray-50 p-2 text-center">
            <p className="text-lg font-semibold text-gray-800">{equity.byType[key] ?? 0}</p>
            <p className="text-xs text-gray-500">{label}</p>
          </div>
        ))}
      </div>

      <div className="mt-3 h-1.5 w-full rounded-full bg-gray-100">
        <div
          className="h-1.5 rounded-full transition-all"
          style={{ width: `${equity.percentage}%`, backgroundColor: color }}
        />
      </div>
    </div>
  )
}

function ContractStatusBadge({ status }: { status: string }) {
  const cfg: Record<string, { label: string; className: string }> = {
    DRAFT: { label: '초안', className: 'bg-gray-100 text-gray-600' },
    PENDING: { label: '서명 대기', className: 'bg-amber-100 text-amber-700' },
    COMPLETED: { label: '완료', className: 'bg-green-100 text-green-700' },
  }
  const { label, className } = cfg[status] ?? cfg.DRAFT
  return <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${className}`}>{label}</span>
}

function ContractCard({ contract, projectId }: { contract: ContractResponse; projectId: number }) {
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const sendMutation = useMutation({
    mutationFn: () => sendContract(contract.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contracts', projectId] })
      toast.success('서명 요청 이메일이 발송되었습니다.')
    },
    onError: () => toast.error('발송에 실패했습니다.'),
  })

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-gray-700">계약 #{contract.id}</p>
        <ContractStatusBadge status={contract.status} />
      </div>
      <p className="mt-1 text-xs text-gray-400">{new Date(contract.createdAt).toLocaleDateString('ko-KR')}</p>

      <div className="mt-3 flex gap-2">
        <Button size="sm" variant="secondary" className="flex-1" onClick={() => navigate(`/projects/${projectId}/contracts/${contract.id}`)}>
          상세보기
        </Button>
        {contract.status === 'DRAFT' && (
          <Button size="sm" className="flex-1" loading={sendMutation.isPending} onClick={() => sendMutation.mutate()}>
            서명 요청
          </Button>
        )}
      </div>
    </div>
  )
}

export default function DashboardPage() {
  const { id } = useParams<{ id: string }>()
  const projectId = Number(id)
  const { user } = useAuth()
  const queryClient = useQueryClient()

  const equityQuery = useQuery({
    queryKey: ['equity', projectId],
    queryFn: () => getEquity(projectId).then((r) => r.data.data),
  })

  const snapshotQuery = useQuery({
    queryKey: ['snapshot-latest', projectId],
    queryFn: () => getLatestSnapshot(projectId).then((r) => r.data.data).catch(() => null),
  })

  const contractsQuery = useQuery({
    queryKey: ['contracts', projectId],
    queryFn: () => listContracts(projectId).then((r) => r.data.data),
  })

  const collectMutation = useMutation({
    mutationFn: () => triggerCollection(projectId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['equity', projectId] })
      toast.success('데이터 수집이 시작되었습니다.')
    },
    onError: () => toast.error('수집 시작에 실패했습니다.'),
  })

  const snapshotMutation = useMutation({
    mutationFn: () => createSnapshot(projectId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['snapshot-latest', projectId] })
      toast.success('스냅샷이 생성되었습니다.')
    },
    onError: () => toast.error('스냅샷 생성에 실패했습니다.'),
  })

  const createContractMutation = useMutation({
    mutationFn: () => createContract(projectId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contracts', projectId] })
      toast.success('계약 초안이 생성되었습니다.')
    },
    onError: () => toast.error('계약 생성에 실패했습니다.'),
  })

  const equities = equityQuery.data?.equities ?? []

  const isOwner = snapshotQuery.data?.users.some(
    (u) => u.userId === user?.id
  ) ?? true // 일단 허용, 실제론 ProjectMember 역할 확인 필요

  if (equityQuery.isLoading) return <Layout><LoadingSpinner className="mt-40" /></Layout>

  return (
    <Layout>
      <div className="p-8">
        {/* Header */}
        <div className="mb-6 flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">대시보드</h1>
            {snapshotQuery.data && (
              <p className="mt-0.5 text-sm text-gray-500">
                스냅샷: {new Date(snapshotQuery.data.snapshotAt).toLocaleString('ko-KR')} ·
                참여자 {snapshotQuery.data.participantCount}명
              </p>
            )}
          </div>
          <div className="flex gap-2">
            <Button size="sm" variant="secondary" loading={collectMutation.isPending} onClick={() => collectMutation.mutate()}>
              데이터 수집
            </Button>
            <Button size="sm" variant="secondary" loading={snapshotMutation.isPending} onClick={() => snapshotMutation.mutate()}>
              스냅샷 생성
            </Button>
            {isOwner && (
              <Button size="sm" loading={createContractMutation.isPending} onClick={() => createContractMutation.mutate()}>
                계약 생성
              </Button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* 파이차트 */}
          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <h2 className="mb-2 text-sm font-semibold text-gray-700">지분 분포</h2>
            {equities.length > 0 ? (
              <EquityPieChart equities={equities} />
            ) : (
              <div className="flex h-64 items-center justify-center text-sm text-gray-400">
                데이터가 없습니다.
              </div>
            )}
            {equityQuery.data && (
              <p className="mt-1 text-center text-xs text-gray-400">
                계산 시각: {new Date(equityQuery.data.calculatedAt).toLocaleString('ko-KR')}
              </p>
            )}
          </div>

          {/* 멤버 카드 */}
          <div className="flex flex-col gap-4 lg:col-span-2">
            <h2 className="text-sm font-semibold text-gray-700">멤버 기여 현황</h2>
            {equities.length === 0 && (
              <div className="rounded-xl border border-dashed border-gray-300 p-8 text-center text-sm text-gray-400">
                기여 데이터가 없습니다. "데이터 수집"을 먼저 실행하세요.
              </div>
            )}
            {equities.map((eq, i) => (
              <MemberEquityCard key={eq.userId} equity={eq} color={COLORS[i % COLORS.length]} />
            ))}
          </div>
        </div>

        {/* 계약 섹션 */}
        <div className="mt-8">
          <h2 className="mb-3 text-sm font-semibold text-gray-700">계약 현황</h2>
          {contractsQuery.isLoading && <LoadingSpinner />}
          {contractsQuery.data?.length === 0 && (
            <p className="text-sm text-gray-400">아직 계약이 없습니다.</p>
          )}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {contractsQuery.data?.map((c) => (
              <ContractCard key={c.id} contract={c} projectId={projectId} />
            ))}
          </div>
        </div>
      </div>
    </Layout>
  )
}
