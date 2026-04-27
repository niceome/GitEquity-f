import axiosInstance from './axiosInstance'
import type { ApiResponse, User } from '../types'

export const getMe = () => axiosInstance.get<ApiResponse<User>>('/users/me')
