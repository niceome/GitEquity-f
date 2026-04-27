import axiosInstance from './axiosInstance'
import type { ApiResponse, ContractResponse, ContractDetail } from '../types'

export const listContracts = (projectId: number) =>
  axiosInstance.get<ApiResponse<ContractResponse[]>>(`/projects/${projectId}/contracts`)

export const createContract = (projectId: number) =>
  axiosInstance.post<ApiResponse<ContractResponse>>(`/projects/${projectId}/contracts`)

export const getContract = (contractId: number) =>
  axiosInstance.get<ApiResponse<ContractDetail>>(`/contracts/${contractId}`)

export const sendContract = (contractId: number) =>
  axiosInstance.post<ApiResponse<ContractResponse>>(`/contracts/${contractId}/send`)

export const signContract = (contractId: number) =>
  axiosInstance.post<ApiResponse<ContractDetail>>(`/contracts/${contractId}/sign`)

export const downloadPdf = (contractId: number) =>
  axiosInstance.get(`/contracts/${contractId}/pdf`, { responseType: 'blob' })
