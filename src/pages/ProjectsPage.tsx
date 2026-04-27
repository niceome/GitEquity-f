import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import Layout from '../components/Layout'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'
import Modal from '../components/ui/Modal'
import LoadingSpinner from '../components/ui/LoadingSpinner'
import { listProjects, createProject } from '../api/projects'
import type { Project } from '../types'

function ProjectCard({ project, onClick }: { project: Project; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="group w-full rounded-xl border border-gray-200 bg-white p-5 text-left shadow-sm transition-all hover:border-indigo-300 hover:shadow-md"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <h3 className="truncate text-base font-semibold text-gray-900 group-hover:text-indigo-600">
            {project.name}
          </h3>
          <p className="mt-0.5 truncate text-xs text-gray-500">
            {project.repoOwner}/{project.repoName}
          </p>
        </div>
        <svg className="h-4 w-4 shrink-0 text-gray-300 group-hover:text-indigo-400 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </div>

      <div className="mt-4 flex items-center gap-4 text-xs text-gray-500">
        <span className="flex items-center gap-1">
          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          {project.memberCount}명
        </span>
        <span className="flex items-center gap-1">
          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          {new Date(project.createdAt).toLocaleDateString('ko-KR')}
        </span>
      </div>
    </button>
  )
}

function CreateProjectModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [form, setForm] = useState({ name: '', repoOwner: '', repoName: '' })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const queryClient = useQueryClient()
  const navigate = useNavigate()

  const mutation = useMutation({
    mutationFn: createProject,
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['projects'] })
      toast.success('프로젝트가 생성되었습니다.')
      onClose()
      navigate(`/projects/${res.data.data.id}`)
    },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { message?: string } } })
        ?.response?.data?.message
      toast.error(msg ?? '프로젝트 생성에 실패했습니다.')
    },
  })

  const validate = () => {
    const e: Record<string, string> = {}
    if (!form.name.trim()) e.name = '프로젝트 이름을 입력하세요.'
    if (!form.repoOwner.trim()) e.repoOwner = 'GitHub 계정/조직명을 입력하세요.'
    if (!form.repoName.trim()) e.repoName = '저장소 이름을 입력하세요.'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (validate()) mutation.mutate(form)
  }

  return (
    <Modal open={open} onClose={onClose} title="새 프로젝트 만들기">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Input
          label="프로젝트 이름"
          placeholder="My Awesome Project"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          error={errors.name}
        />
        <div className="flex gap-2">
          <Input
            label="GitHub Owner"
            placeholder="octocat"
            value={form.repoOwner}
            onChange={(e) => setForm({ ...form, repoOwner: e.target.value })}
            error={errors.repoOwner}
            className="flex-1"
          />
          <Input
            label="Repository"
            placeholder="my-repo"
            value={form.repoName}
            onChange={(e) => setForm({ ...form, repoName: e.target.value })}
            error={errors.repoName}
            className="flex-1"
          />
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>취소</Button>
          <Button type="submit" loading={mutation.isPending}>프로젝트 생성</Button>
        </div>
      </form>
    </Modal>
  )
}

export default function ProjectsPage() {
  const [createOpen, setCreateOpen] = useState(false)
  const navigate = useNavigate()

  const { data, isLoading, isError } = useQuery({
    queryKey: ['projects'],
    queryFn: () => listProjects().then((r) => r.data.data),
  })

  return (
    <Layout>
      <div className="p-8">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">프로젝트</h1>
            <p className="mt-0.5 text-sm text-gray-500">GitHub 저장소와 연결된 지분 계약 프로젝트</p>
          </div>
          <Button onClick={() => setCreateOpen(true)}>
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            새 프로젝트
          </Button>
        </div>

        {isLoading && <LoadingSpinner className="mt-20" />}

        {isError && (
          <div className="mt-10 text-center text-sm text-red-500">프로젝트를 불러오는 데 실패했습니다.</div>
        )}

        {data && data.length === 0 && (
          <div className="mt-20 flex flex-col items-center gap-3 text-center">
            <div className="rounded-full bg-gray-100 p-5">
              <svg className="h-8 w-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </div>
            <p className="text-gray-500">아직 프로젝트가 없습니다.</p>
            <Button size="sm" onClick={() => setCreateOpen(true)}>첫 프로젝트 만들기</Button>
          </div>
        )}

        {data && data.length > 0 && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {data.map((p) => (
              <ProjectCard key={p.id} project={p} onClick={() => navigate(`/projects/${p.id}`)} />
            ))}
          </div>
        )}
      </div>

      <CreateProjectModal open={createOpen} onClose={() => setCreateOpen(false)} />
    </Layout>
  )
}
