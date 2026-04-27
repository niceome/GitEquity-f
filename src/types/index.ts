// ── 공통 ─────────────────────────────────────────────────────────────────────

export interface ApiResponse<T> {
  success: boolean
  message: string
  data: T
}

// ── 유저 ─────────────────────────────────────────────────────────────────────

export interface User {
  id: number
  username: string
  email: string | null
  avatarUrl: string
  createdAt: string
}

// ── 프로젝트 ──────────────────────────────────────────────────────────────────

export interface Project {
  id: number
  name: string
  repoOwner: string
  repoName: string
  memberCount: number
  createdAt: string
}

export interface ProjectMember {
  userId: number
  username: string
  avatarUrl: string
  role: 'OWNER' | 'MEMBER'
  joinedAt: string
}

export interface WeightConfig {
  COMMIT?: number
  PULL_REQUEST?: number
  REVIEW?: number
  ISSUE?: number
}

export interface ProjectDetail extends Project {
  members: ProjectMember[]
  weightConfig: WeightConfig
  description?: string
}

// ── 기여 ──────────────────────────────────────────────────────────────────────

export type ContributionType = 'COMMIT' | 'PR' | 'REVIEW' | 'ISSUE'

export interface Contribution {
  id: number
  userId: number
  username: string
  type: ContributionType
  githubId: string
  count: number
  rawScore: number
  occurredAt: string
}

// ── 지분 ──────────────────────────────────────────────────────────────────────

export interface UserEquity {
  userId: number
  username: string
  rawScore: number
  percentage: number
  byType: Record<ContributionType, number>
}

export interface EquityResult {
  projectId: number
  equities: UserEquity[]
  totalRawScore: number
  calculatedAt: string
}

export interface SnapshotSummary {
  projectId: number
  snapshotAt: string
  participantCount: number
  totalRawScore: number
  users: UserEquitySnapshot[]
}

export interface UserEquitySnapshot {
  snapshotId: number
  userId: number
  username: string
  percentage: number
  rawScore: number
  commits: number
  prs: number
  reviews: number
  issues: number
}

// ── 계약 ──────────────────────────────────────────────────────────────────────

export type ContractStatus = 'DRAFT' | 'PENDING' | 'COMPLETED'

export interface ContractResponse {
  id: number
  projectId: number
  status: ContractStatus
  pdfUrl: string | null
  createdAt: string
  completedAt: string | null
}

export interface MemberSignatureStatus {
  userId: number
  username: string
  percentage: number
  signed: boolean
  signedAt: string | null
}

export interface ContractDetail {
  id: number
  projectId: number
  projectName: string
  status: ContractStatus
  pdfUrl: string | null
  createdAt: string
  completedAt: string | null
  totalMembers: number
  signedCount: number
  members: MemberSignatureStatus[]
}
