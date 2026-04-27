import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import Layout from '../components/Layout'
import LoadingSpinner from '../components/ui/LoadingSpinner'
import { listContributions } from '../api/projects'
import type { Contribution, ContributionType } from '../types'

const TYPE_META: Record<ContributionType, { label: string; color: string; bg: string; icon: string }> = {
  COMMIT: { label: '커밋', color: 'text-indigo-700', bg: 'bg-indigo-100', icon: '●' },
  PR:     { label: 'PR',   color: 'text-violet-700', bg: 'bg-violet-100', icon: '↑' },
  REVIEW: { label: '리뷰', color: 'text-green-700',  bg: 'bg-green-100',  icon: '✓' },
  ISSUE:  { label: '이슈', color: 'text-amber-700',  bg: 'bg-amber-100',  icon: '!' },
}

const ALL = 'ALL'

function groupByDate(contributions: Contribution[]) {
  const map = new Map<string, Contribution[]>()
  for (const c of contributions) {
    const date = c.occurredAt.slice(0, 10)
    if (!map.has(date)) map.set(date, [])
    map.get(date)!.push(c)
  }
  return Array.from(map.entries()).sort((a, b) => b[0].localeCompare(a[0]))
}

export default function ContributionsPage() {
  const { id } = useParams<{ id: string }>()
  const projectId = Number(id)
  const [typeFilter, setTypeFilter] = useState<ContributionType | 'ALL'>(ALL)
  const [userFilter, setUserFilter] = useState<string>(ALL)

  const { data, isLoading, isError } = useQuery({
    queryKey: ['contributions', projectId],
    queryFn: () => listContributions(projectId).then((r) => r.data.data),
  })

  const users = Array.from(new Set(data?.map((c) => c.username) ?? []))

  const filtered = (data ?? []).filter(
    (c) =>
      (typeFilter === ALL || c.type === typeFilter) &&
      (userFilter === ALL || c.username === userFilter),
  )

  const grouped = groupByDate(filtered)

  const types: Array<ContributionType | 'ALL'> = [ALL, 'COMMIT', 'PR', 'REVIEW', 'ISSUE']

  return (
    <Layout>
      <div className="p-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">기여 이력</h1>
          <p className="mt-0.5 text-sm text-gray-500">날짜별 기여 타임라인</p>
        </div>

        {/* Filters */}
        <div className="mb-6 flex flex-wrap gap-3">
          <div className="flex gap-1 rounded-lg border border-gray-200 bg-white p-1 shadow-sm">
            {types.map((t) => (
              <button
                key={t}
                onClick={() => setTypeFilter(t)}
                className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                  typeFilter === t
                    ? 'bg-indigo-600 text-white'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                {t === ALL ? '전체' : TYPE_META[t as ContributionType].label}
              </button>
            ))}
          </div>

          <select
            value={userFilter}
            onChange={(e) => setUserFilter(e.target.value)}
            className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs text-gray-600 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value={ALL}>전체 멤버</option>
            {users.map((u) => (
              <option key={u} value={u}>{u}</option>
            ))}
          </select>

          <span className="flex items-center text-xs text-gray-400">
            {filtered.length}건
          </span>
        </div>

        {isLoading && <LoadingSpinner className="mt-20" />}
        {isError && <p className="text-sm text-red-500">데이터를 불러오는 데 실패했습니다.</p>}

        {!isLoading && !isError && filtered.length === 0 && (
          <div className="mt-20 text-center text-sm text-gray-400">해당하는 기여 이력이 없습니다.</div>
        )}

        {/* Timeline */}
        <div className="space-y-8">
          {grouped.map(([date, items]) => (
            <div key={date}>
              <div className="mb-3 flex items-center gap-2">
                <span className="text-sm font-semibold text-gray-700">
                  {new Date(date).toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'short' })}
                </span>
                <span className="text-xs text-gray-400">{items.length}건</span>
              </div>

              <div className="relative border-l-2 border-gray-200 pl-5 space-y-3">
                {items.map((c) => {
                  const meta = TYPE_META[c.type]
                  return (
                    <div key={c.id} className="relative flex items-start gap-3">
                      <div className={`absolute -left-[1.35rem] flex h-5 w-5 items-center justify-center rounded-full text-xs font-bold ${meta.bg} ${meta.color}`}>
                        {meta.icon}
                      </div>

                      <div className="flex-1 rounded-lg border border-gray-100 bg-white px-4 py-2.5 shadow-sm">
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${meta.bg} ${meta.color}`}>
                              {meta.label}
                            </span>
                            <span className="text-xs font-medium text-gray-700">{c.username}</span>
                          </div>
                          <span className="text-xs text-gray-400">
                            {new Date(c.occurredAt).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <div className="mt-1 flex gap-3 text-xs text-gray-500">
                          <span>횟수 {c.count}건</span>
                          <span>점수 {c.rawScore.toFixed(1)}</span>
                        </div>
                        <p className="mt-0.5 text-xs text-gray-400 font-mono">{c.githubId}</p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </Layout>
  )
}
