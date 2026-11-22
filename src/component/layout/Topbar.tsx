
import { Bell, ChevronRight, Search, Menu } from 'lucide-react'
import { useEffect, useState } from 'react'
import type { PageName } from '../../types'

type TopbarProps = {
  activePage: PageName
  onOpenMobileMenu: () => void
}

export default function Topbar({
  activePage,
  onOpenMobileMenu
}: TopbarProps) {
  const [today, setToday] = useState('')
  useEffect(() => {
    setToday(new Date().toLocaleDateString('en-AU', { weekday: 'long', day: 'numeric', month: 'long' }))
  }, [])
  return (
    <header className="topbar">
      <div className="topbar-left">
        <button
          className="mobile-menu"
          onClick={onOpenMobileMenu}
        >
          <Menu size={21} />
        </button>

        <div className="breadcrumb">
          Workspace
          <ChevronRight size={15} />
          <strong>{activePage}</strong>
        </div>
      </div>

      <div className="topbar-actions">
        <button className="icon-button" aria-label="Search">
          <Search size={19} />
        </button>

        <button
          className="icon-button notification-button"
          aria-label="Notifications"
        >
          <Bell size={19} />
          <span />
        </button>

        <div className="topbar-divider" />

        <div className="topbar-date">
          {today}
        </div>
      </div>
    </header>
  )
}
