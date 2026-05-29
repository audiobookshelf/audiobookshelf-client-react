'use server'

import { apiRequest, updateAuthSettings } from '@/lib/api'
import { AuthenticationSettingsPatch, OpenIdIssuerConfig } from '@/types/api'
import { revalidatePath } from 'next/cache'

export async function updateAuthenticationSettings(payload: AuthenticationSettingsPatch) {
  const result = await updateAuthSettings(payload)
  revalidatePath('/settings/authentication')
  return result
}

export async function getOpenIdIssuerConfig(issuer: string): Promise<OpenIdIssuerConfig> {
  return apiRequest<OpenIdIssuerConfig>(`/auth/openid/config?issuer=${encodeURIComponent(issuer)}`, {})
}
