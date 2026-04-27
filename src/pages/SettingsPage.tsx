import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import Layout from '../components/Layout'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'
import Modal from '../components/ui/Modal'
import LoadingSpinner from '../components/ui/LoadingSpinner'
import { getProject, getMembers, updateWeightConfig, inviteMember, removeMember, deleteProject } from '../api/projects'
import type { WeightConfig, ProjectMember } from '../types'
import { useAuth } from '../hooks/useAuth'

const WEIGHT_META: Array<{ key: keyof WeightConfig; label: string; description: string }> = [
  { key: 'COMMIT', label: '커밋 가중치', description: '코드 커밋 활동' },
  { key: 'PULL_REQUEST', label: 'PR 가중치', description: '풀 리퀘스트 제출' },
  { key: 'REVIEW', label: '리뷰 가중치', description: '코드 리뷰 참여' },
  { key: 'ISSUE', label: '이슈 가중치', description: '이슈 등록 및 관리' },
]

function WeightSlider({
  label,
  description,
  value,
  onChange,
}: {
  label: string
  description: string
  value: number
  onChange: (v: number) => void
}) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4">
      <div className="flex items-center justify-between mb-2">
        <div>
          <p className="text-sm font-medium text-gray-800">{label}</p>
          <p className="text-xs text-gray-400">{description}</p>
        </div>
        <span className="text-lg font-bold text-indigo-600 min-w-[3rem] text-right">{value.toFixed(1)}</span>
      </div>
      <input
        type="range"
        min={0}
        max={5}
        step={0.1}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="w-full accent-indigo-600"
      />
      <div className="flex justify-between text-xs text-gray-400 mt-1">
        <span>0</span>
        <span>5</span>
      </div>
    </div>
  )
}

function MemberRow({
  member,
  isOwner,
  currentUserId,
  onRemove,
}: {
  member: ProjectMember
  isOwner: boolean
  currentUserId: number
  onRemove: (userId: number) => void
}) {
  const isMe = member.userId === currentUserId
  const canRemove = isOwner && !isMe && member.role !== 'OWNER'

  return (
    <div className="flex items-center justify-between rounded-xl border border-gray-200 bg-white p-3 shadow-sm">
      <div className="flex items-center gap-3">
        <img src={member.avatarUrl} alt={member.username} className="h-9 w-9 rounded-full" />
        <div>
          <p className="text-sm font-medium text-gray-800">
            {member.username}
            {isMe && <span className="ml-1.5 text-xs text-indigo-500">(나)</span>}
          </p>
          <p className="text-xs text-gray-400">
            {new Date(member.joinedAt).toLocaleDateString('ko-KR')} 참여
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
          member.role === 'OWNER' ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-100 text-gray-600'
        }`}>
          {member.role === 'OWNER' ? '오너' : '멤버'}
        </span>
        {canRemove && (
          <Button size="sm" variant="danger" onClick={() => onRemove(member.userId)}>
            제거
          </Button>
        )}
      </div>
    </div>
  )
}

export default function SettingsPage() {
  const { id } = useParams<{ id: string }>()
  const projectId = Number(id)
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const [inviteUsername, setInviteUsername] = useState('')
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)

  const projectQuery = useQuery({
    queryKey: ['project', projectId],
    queryFn: () => getProject(projectId).then((r) => r.data.data),
  })

  const membersQuery = useQuery({
    queryKey: ['members', projectId],
    queryFn: () => getMembers(projectId).then((r) => r.data.data),
  })

  const [weights, setWeights] = useState<WeightConfig>({
    COMMIT: 1.0,
    PULL_REQUEST: 3.0,
    REVIEW: 2.0,
    ISSUE: 1.0,
  })

  // 서버에서 가중치 로드 시 동기화
  const serverWeights = projectQuery.data?.weightConfig
  useState(() => {
    if (serverWeights) setWeights(serverWeights)
  })

  const weightMutation = useMutation({
    mutationFn: () => updateWeightConfig(projectId, weights),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project', projectId] })
      queryClient.invalidateQueries({ queryKey: ['equity', projectId] })
      toast.success('가중치가 저장되었습니다.')
    },
    onError: () => toast.error('저장에 실패했습니다.'),
  })

  const inviteMutation = useMutation({
    mutationFn: () => inviteMember(projectId, inviteUsername),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['members', projectId] })
      toast.success(`${inviteUsername}님을 초대했습니다.`)
      setInviteUsername('')
    },
    onError: () => toast.error('초대에 실패했습니다.'),
  })

  const removeMutation = useMutation({
    mutationFn: (userId: number) => removeMember(projectId, userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['members', projectId] })
      toast.success('멤버가 제거되었습니다.')
    },
    onError: () => toast.error('제거에 실패했습니다.'),
  })

  const deleteMutation = useMutation({
    mutationFn: () => deleteProject(projectId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] })
      toast.success('프로젝트가 삭제되었습니다.')
      navigate('/projects')
    },
    onError: () => toast.error('삭제에 실패했습니다.'),
  })

  const isOwner = membersQuery.data?.some(
    (m) => m.userId === user?.id && m.role === 'OWNER',
  ) ?? false

  if (projectQuery.isLoading) return <Layout><LoadingSpinner className="mt-40" /></Layout>

  return (
    <Layout>
      <div className="p-8 max-w-2xl">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">프로젝트 설정</h1>
          <p className="mt-0.5 text-sm text-gray-500">가중치 및 멤버를 관리합니다.</p>
        </div>

        {/* 가중치 */}
        <section className="mb-8">
          <h2 className="mb-3 text-base font-semibold text-gray-800">기여 유형 가중치</h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {WEIGHT_META.map(({ key, label, description }) => (
              <WeightSlider
                key={key}
                label={label}
                description={description}
                value={weights[key] ?? 1.0}
                onChange={(v) => setWeights((w) => ({ ...w, [key]: v }))}
              />
            ))}
          </div>
          <div className="mt-4 flex justify-end">
            <Button
              loading={weightMutation.isPending}
              disabled={!isOwner}
              onClick={() => weightMutation.mutate()}
            >
              가중치 저장
            </Button>
          </div>
          {!isOwner && (
            <p className="mt-2 text-right text-xs text-gray-400">오너만 가중치를 변경할 수 있습니다.</p>
          )}
        </section>

        {/* 멤버 관리 */}
        <section>
          <h2 className="mb-3 text-base font-semibold text-gray-800">멤버 관리</h2>

          {isOwner && (
            <div className="mb-4 flex gap-2">
              <Input
                placeholder="GitHub 사용자명"
                value={inviteUsername}
                onChange={(e) => setInviteUsername(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && inviteUsername && inviteMutation.mutate()}
                className="flex-1"
              />
              <Button
                loading={inviteMutation.isPending}
                disabled={!inviteUsername}
                onClick={() => inviteMutation.mutate()}
              >
                초대
              </Button>
            </div>
          )}

          {membersQuery.isLoading && <LoadingSpinner />}
          <div className="space-y-2">
            {membersQuery.data?.map((m) => (
              <MemberRow
                key={m.userId}
                member={m}
                isOwner={isOwner}
                currentUserId={user?.id ?? -1}
                onRemove={(uid) => removeMutation.mutate(uid)}
              />
            ))}
          </div>
        </section>

        {/* 위험 구역 */}
        {isOwner && (
          <section className="mt-10">
            <h2 className="mb-3 text-base font-semibold text-red-600">위험 구역</h2>
            <div className="rounded-xl border border-red-200 bg-red-50 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-red-800">프로젝트 삭제</p>
                  <p className="text-xs text-red-500 mt-0.5">
                    모든 기여 데이터, 스냅샷, 계약이 영구 삭제됩니다.
                  </p>
                </div>
                <Button variant="danger" size="sm" onClick={() => setDeleteConfirmOpen(true)}>
                  프로젝트 삭제
                </Button>
              </div>
            </div>
          </section>
        )}
      </div>

      <Modal open={deleteConfirmOpen} onClose={() => setDeleteConfirmOpen(false)} title="프로젝트 삭제">
        <div className="flex flex-col gap-4">
          <p className="text-sm text-gray-600">
            정말로 이 프로젝트를 삭제하시겠습니까?<br />
            <span className="font-semibold text-red-600">모든 기여 데이터, 스냅샷, 계약이 영구적으로 삭제됩니다.</span>
          </p>
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setDeleteConfirmOpen(false)}>취소</Button>
            <Button variant="danger" loading={deleteMutation.isPending} onClick={() => deleteMutation.mutate()}>
              삭제 확인
            </Button>
          </div>
        </div>
      </Modal>
    </Layout>
  )
}
