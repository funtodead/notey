import { useIonRouter } from '@ionic/react'
import { useLocation } from 'react-router-dom'

import { Icon, type IconName } from '../ui/Icon'
import { MicButton } from './MicButton'
import './TabBar.css'

interface Tab {
  path: string
  label: string
  icon: IconName
}

const LEFT: Tab[] = [
  { path: '/today', label: 'Today', icon: 'today' },
  { path: '/calendar', label: 'Calendar', icon: 'calendar' },
]

const RIGHT: Tab[] = [
  { path: '/notes', label: 'Notes', icon: 'notes' },
  { path: '/lists', label: 'Lists', icon: 'lists' },
]

export function TabBar() {
  const router = useIonRouter()
  const { pathname } = useLocation()

  // Hidden rather than removed on Settings and Stats: the mic button keeps the conversation alive.
  const hidden = pathname === '/settings' || pathname === '/stats'

  const renderTab = (tab: Tab) => {
    const active = pathname.startsWith(tab.path)
    return (
      <button
        key={tab.path}
        className={`tab ${active ? 'tab-active' : ''}`}
        aria-current={active ? 'page' : undefined}
        onClick={() => router.push(tab.path, 'none', 'replace')}
      >
        <span className="tab-pill">
          <Icon name={tab.icon} size={22} />
        </span>
        <span className="tab-label">{tab.label}</span>
      </button>
    )
  }

  return (
    <div className={hidden ? 'tabbar-hidden' : undefined}>
      <div className="tabbar-fade" aria-hidden="true" />
      <nav className="tabbar clay" aria-label="Main">
        {LEFT.map(renderTab)}
        <span aria-hidden="true" />
        {RIGHT.map(renderTab)}
      </nav>
      <MicButton />
    </div>
  )
}
