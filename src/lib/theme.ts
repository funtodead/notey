import type { Appearance } from '../types/models'

const systemDark = window.matchMedia('(prefers-color-scheme: dark)')

/** Sets data-theme on <html>, which the color tokens key off. Returns a cleanup for "system". */
export function applyAppearance(appearance: Appearance = 'dark') {
  const apply = () => {
    const dark = appearance === 'dark' || (appearance === 'system' && systemDark.matches)
    document.documentElement.dataset.theme = dark ? 'dark' : 'light'
  }
  apply()
  if (appearance !== 'system') return () => {}
  systemDark.addEventListener('change', apply)
  return () => systemDark.removeEventListener('change', apply)
}
