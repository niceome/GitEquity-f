import axiosInstance from './axiosInstance'
import type { ApiResponse, Project, ProjectDetail, ProjectMember, WeightConfig, Contribution, EquityResult, SnapshotSummary } from '../types'

export const listProjects = () =>
  axiosInstance.get<ApiResponse<Project[]>>('/projects')

export const getProject = (id: number) =>
  axiosInstance.get<ApiResponse<ProjectDetail>>(`/projects/${id}`)

export const createProject = (body: { name: string; repoOwner: string; repoName: string }) =>
  axiosInstance.post<ApiResponse<Project>>('/projects', body)

export const getMembers = (projectId: number) =>
  axiosInstance.get<ApiResponse<ProjectMember[]>>(`/projects/${projectId}/members`)

export const inviteMember = (projectId: number, username: string) =>
  axiosInstance.post<ApiResponse<ProjectMember>>(`/projects/${projectId}/members`, { username })

export const removeMember = (projectId: number, userId: number) =>
  axiosInstance.delete(`/projects/${projectId}/members/${userId}`)

export const updateWeightConfig = (projectId: number, weightConfig: WeightConfig) =>
  axiosInstance.put<ApiResponse<ProjectDetail>>(`/projects/${projectId}/weight-config`, { weightConfig })

export const listContributions = (projectId: number) =>
  axiosInstance.get<ApiResponse<Contribution[]>>(`/projects/${projectId}/contributions`)

export const getEquity = (projectId: number) =>
  axiosInstance.get<ApiResponse<EquityResult>>(`/projects/${projectId}/equity`)

export const createSnapshot = (projectId: number) =>
  axiosInstance.post<ApiResponse<SnapshotSummary>>(`/projects/${projectId}/equity/snapshot`)

export const getLatestSnapshot = (projectId: number) =>
  axiosInstance.get<ApiResponse<SnapshotSummary>>(`/projects/${projectId}/equity/snapshots/latest`)

export const deleteProject = (projectId: number) =>
  axiosInstance.delete(`/projects/${projectId}`)

export const triggerCollection = (projectId: number) =>
  axiosInstance.post(`/projects/${projectId}/collect`)
