import { CLIENT_ID } from '@/lib/clientIdentity'
import type { ClientSettings, ClientSettingsStore } from '@/types/api'

/** Reads this clients settings out of the users store */
export function getClientSettings(store: ClientSettingsStore | undefined): ClientSettings {
  return store?.[CLIENT_ID] ?? {}
}

/** Returns the users store with this clients settings replaced, leaving other clients untouched */
export function withClientSettings(store: ClientSettingsStore | undefined, settings: ClientSettings): ClientSettingsStore {
  return { ...store, [CLIENT_ID]: settings }
}
