export type VersionInfo = {
  current: string
  latest: string
  hasUpdate: boolean
  url: string
  checkedAt: number
}

export const CURRENT_VERSION = '1.3.2'
const API = 'https://api.github.com/repos/KaisvenZ/hydromind-studio/releases/latest'

function parseTag(tag: string): number[] {
  return tag.replace(/^v/, '').split('.').map(Number)
}

function isNewer(latest: string, current: string): boolean {
  const a = parseTag(latest)
  const b = parseTag(current)
  for (let i = 0; i < Math.max(a.length, b.length); i++) {
    if ((a[i] ?? 0) > (b[i] ?? 0)) return true
    if ((a[i] ?? 0) < (b[i] ?? 0)) return false
  }
  return false
}

export async function checkVersion(): Promise<VersionInfo> {
  try {
    const res = await fetch(API, { headers: { Accept: 'application/vnd.github+json' } })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const data = (await res.json()) as { tag_name: string; html_url: string }
    const latest = data.tag_name.replace(/^v/, '')
    return {
      current: CURRENT_VERSION,
      latest,
      hasUpdate: isNewer(latest, CURRENT_VERSION),
      url: data.html_url,
      checkedAt: Date.now(),
    }
  } catch {
    return { current: CURRENT_VERSION, latest: CURRENT_VERSION, hasUpdate: false, url: '', checkedAt: Date.now() }
  }
}
