'use server'

import * as api from '@/lib/api'
import { ServerYearStats, UserYearStats } from '@/types/api'

export async function getUserYearStats(year: number): Promise<UserYearStats> {
  return api.getUserYearStats(year)
}

export async function getServerYearStats(year: number): Promise<ServerYearStats> {
  return api.getServerYearStats(year)
}
