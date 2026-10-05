import { apiClient } from './index'

export const googleCalendarApi = {
  async getAuthUrl(): Promise<string> {
    const { url } = await apiClient.get<{ url: string }>('/calendar/google/auth-url')
    return url
  },

  /** available = false : la synchronisation n'est pas configurée sur le serveur, le bouton est masqué. */
  async getStatus(): Promise<{ available: boolean; connected: boolean }> {
    return apiClient.get<{ available: boolean; connected: boolean }>('/calendar/google/status')
  },

  async disconnect(): Promise<void> {
    await apiClient.delete<{ success: boolean }>('/calendar/google/disconnect')
  },
}
