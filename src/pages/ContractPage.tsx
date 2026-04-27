import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import Layout from '../components/Layout'
import Button from '../components/ui/Button'
import Modal from '../components/ui/Modal'
import LoadingSpinner from '../components/ui/LoadingSpinner'
import { getContract, signContract, downloadPdf, deleteContract } from '../api/contracts'
import type { MemberSignatureStatus } from '../types'
import { useAuth } from '../hooks/useAuth'
import { useNavigate } from 'react-router-dom'

function StatusBadge({ status }: { status: string }) {
  const cfg: Record<string, { label: string; className: string }> = {
    DRAFT: { label: '초안', className: 'bg-gray-100 text-gray-600' },
    PENDING: { label: '서명 대기 중', className: 'bg-amber-100 text-amber-700' },
    COMPLETED: { label: '계약 완료', className: 'bg-green-100 text-green-700' },
  }
  const { label, className } = cfg[status] ?? cfg.DRAFT
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-medium ${className}`}>
      {status === 'COMPLETED' && (
        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
        </svg>
      )}
      {label}
    </span>
  )
}

function SignatureRow({ member, highlight }: { member: MemberSignatureStatus; highlight: boolean }) {
  return (
    <div className={`flex items-center justify-between rounded-xl border p-3 transition-colors ${
      highlight ? 'border-indigo-200 bg-indigo-50' : 'border-gray-200 bg-white'
    }`}>
      <div className="flex items-center gap-3">
        <div className={`flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold ${
          highlight ? 'bg-indigo-200 text-indigo-700' : 'bg-gray-100 text-gray-500'
        }`}>
          {member.username[0].toUpperCase()}
        </div>
        <div>
          <p className="text-sm font-medium text-gray-800">{member.username}</p>
          <p className="text-xs text-gray-400">{member.percentage.toFixed(2)}%</p>
        </div>
      </div>
      <div className="flex items-center gap-2 text-right">
        {member.signed ? (
          <>
            <div>
              <p className="text-xs text-green-600 font-medium">서명 완료</p>
              {member.signedAt && (
                <p className="text-xs text-gray-400">
                  {new Date(member.signedAt).toLocaleString('ko-KR')}
                </p>
              )}
            </div>
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-green-100">
              <svg className="h-4 w-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
              </svg>
            </div>
          </>
        ) : (
          <>
            <p className="text-xs text-gray-400">미서명</p>
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gray-100">
              <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

function ProgressBar({ signed, total }: { signed: number; total: number }) {
  const pct = total > 0 ? (signed / total) * 100 : 0
  return (
    <div>
      <div className="mb-1 flex justify-between text-xs text-gray-500">
        <span>서명 진행률</span>
        <span>{signed} / {total}</span>
      </div>
      <div className="h-2 w-full rounded-full bg-gray-200">
        <div
          className="h-2 rounded-full bg-indigo-600 transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}

export default function ContractPage() {
  const { id, contractId } = useParams<{ id: string; contractId: string }>()
  const cid = Number(contractId)
  const projectId = Number(id)
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)

  const [pdfLoading, setPdfLoading] = useState(false)

  const openPdf = async () => {
    setPdfLoading(true)
    try {
      const res = await downloadPdf(cid)
      const blob = new Blob([res.data], { type: 'application/pdf' })
      const url = URL.createObjectURL(blob)
      window.open(url, '_blank')
    } catch {
      toast.error('PDF를 불러오는 데 실패했습니다.')
    } finally {
      setPdfLoading(false)
    }
  }

  const { data: contract, isLoading } = useQuery({
    queryKey: ['contract', cid],
    queryFn: () => getContract(cid).then((r) => r.data.data),
    refetchInterval: (query) => query.state.data?.status === 'PENDING' ? 10000 : false,
  })

  const deleteMutation = useMutation({
    mutationFn: () => deleteContract(cid),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contracts', projectId] })
      toast.success('계약이 삭제되었습니다.')
      navigate(`/projects/${projectId}`)
    },
    onError: () => toast.error('계약 삭제에 실패했습니다.'),
  })

  const signMutation = useMutation({
    mutationFn: () => signContract(cid),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contract', cid] })
      setConfirmOpen(false)
      toast.success('서명이 완료되었습니다.')
    },
    onError: () => toast.error('서명에 실패했습니다.'),
  })

  if (isLoading) return <Layout><LoadingSpinner className="mt-40" /></Layout>
  if (!contract) return <Layout><p className="p-8 text-sm text-red-500">계약을 찾을 수 없습니다.</p></Layout>

  const myStatus = contract.members.find((m) => m.userId === user?.id)
  const canSign = contract.status === 'PENDING' && myStatus && !myStatus.signed

  return (
    <Layout>
      <div className="p-8 max-w-2xl">
        {/* Header */}
        <div className="mb-6 flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">계약 #{contract.id}</h1>
            <p className="mt-0.5 text-sm text-gray-500">{contract.projectName}</p>
          </div>
          <StatusBadge status={contract.status} />
        </div>

        {/* 계약 정보 */}
        <div className="mb-6 rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <h2 className="mb-3 text-sm font-semibold text-gray-700">계약 정보</h2>
          <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
            <dt className="text-gray-500">생성일</dt>
            <dd className="text-gray-800">{new Date(contract.createdAt).toLocaleString('ko-KR')}</dd>
            {contract.completedAt && (
              <>
                <dt className="text-gray-500">완료일</dt>
                <dd className="text-gray-800">{new Date(contract.completedAt).toLocaleString('ko-KR')}</dd>
              </>
            )}
            <dt className="text-gray-500">상태</dt>
            <dd><StatusBadge status={contract.status} /></dd>
          </dl>
        </div>

        {/* 서명 진행 */}
        <div className="mb-6 rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <h2 className="mb-4 text-sm font-semibold text-gray-700">서명 현황</h2>
          <ProgressBar signed={contract.signedCount} total={contract.totalMembers} />
          <div className="mt-4 space-y-2">
            {contract.members.map((m) => (
              <SignatureRow
                key={m.userId}
                member={m}
                highlight={m.userId === user?.id}
              />
            ))}
          </div>
        </div>

        {/* 액션 버튼 */}
        <div className="flex gap-3 flex-wrap">
          {canSign && (
            <Button className="flex-1" onClick={() => setConfirmOpen(true)}>
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
              서명하기
            </Button>
          )}
          {contract.status === 'COMPLETED' && (
            <button
              onClick={openPdf}
              disabled={pdfLoading}
              className="flex-1 inline-flex items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              {pdfLoading ? '로딩 중...' : 'PDF 다운로드'}
            </button>
          )}
          {(contract.status === 'DRAFT' || contract.status === 'PENDING') && (
            <button
              onClick={openPdf}
              disabled={pdfLoading}
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
              {pdfLoading ? '로딩 중...' : '미리보기'}
            </button>
          )}
          {contract.status !== 'COMPLETED' && (
            <button
              onClick={() => setDeleteOpen(true)}
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-red-200 bg-white px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 transition-colors ml-auto"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              삭제
            </button>
          )}
        </div>
      </div>

      {/* 삭제 확인 모달 */}
      <Modal open={deleteOpen} onClose={() => setDeleteOpen(false)} title="계약 삭제">
        <div className="flex flex-col gap-4">
          <p className="text-sm text-gray-600">
            계약 <span className="font-semibold">#{contract.id}</span>을 삭제합니다. 이 작업은 되돌릴 수 없습니다.
          </p>
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setDeleteOpen(false)}>취소</Button>
            <Button
              className="bg-red-600 hover:bg-red-700"
              loading={deleteMutation.isPending}
              onClick={() => deleteMutation.mutate()}
            >
              삭제
            </Button>
          </div>
        </div>
      </Modal>

      {/* 서명 확인 모달 */}
      <Modal open={confirmOpen} onClose={() => setConfirmOpen(false)} title="서명 확인">
        <div className="flex flex-col gap-4">
          <p className="text-sm text-gray-600">
            지분 계약서에 전자서명합니다. 서명 후에는 취소할 수 없습니다.
          </p>
          {myStatus && (
            <div className="rounded-lg bg-indigo-50 p-3 text-sm">
              <p className="font-medium text-indigo-800">{myStatus.username}</p>
              <p className="text-indigo-600">지분 {myStatus.percentage.toFixed(2)}%</p>
            </div>
          )}
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setConfirmOpen(false)}>취소</Button>
            <Button loading={signMutation.isPending} onClick={() => signMutation.mutate()}>
              서명 완료
            </Button>
          </div>
        </div>
      </Modal>
    </Layout>
  )
}
