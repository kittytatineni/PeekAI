
import {
  LayoutDashboard,
  BookOpen,
  CalendarDays,
  ChartNoAxesColumnIncreasing,
  Settings,
  Brain,
  MessageCircle,
  X
} from 'lucide-react'

import type { PageName } from '../../types'

type SidebarProps = {
  activePage: PageName
  mobileMenuOpen: boolean
  onNavigate: (page: PageName) => void
  onCloseMobile: () => void
}

const navigation = [
  { name: 'Dashboard' as PageName, icon: LayoutDashboard },
  { name: 'My Courses' as PageName, icon: BookOpen },
  { name: 'Planner' as PageName, icon: CalendarDays },
  { name: 'Study Centre' as PageName, icon: Brain },
  { name: 'Study Buddy' as PageName, icon: MessageCircle },
  { name: 'Calendar' as PageName, icon: CalendarDays },
  {
    name: 'Grade Tracker' as PageName,
    icon: ChartNoAxesColumnIncreasing
  }
]

export default function Sidebar({
  activePage,
  mobileMenuOpen,
  onNavigate,
  onCloseMobile
}: SidebarProps) {
  return (
    <>
      {mobileMenuOpen && (
        <div
          className="mobile-overlay"
          onClick={onCloseMobile}
        />
      )}

      <aside className={`sidebar ${mobileMenuOpen ? 'sidebar-open' : ''}`}>
        <div className="brand">
          <div className="brand-icon">
            <Brain size={22} />
          </div>

          <span>
            peek<span className="brand-light">AI</span>
          </span>

          <button
            className="mobile-close"
            onClick={onCloseMobile}
          >
            <X size={20} />
          </button>
        </div>

        <div className="workspace-label">WORKSPACE</div>

        <nav className="navigation">
          {navigation.map(item => {
            const Icon = item.icon

            return (
              <button
                key={item.name}
                className={`nav-item ${
                  activePage === item.name ? 'active' : ''
                }`}
                onClick={() => onNavigate(item.name)}
              >
                <Icon size={19} />
                <span>{item.name}</span>

                {item.name === 'Planner' && (
                  <span className="nav-count">4</span>
                )}
              </button>
            )
          })}
        </nav>

        <div className="sidebar-bottom">
          <button
            className={`nav-item ${
              activePage === 'Settings' ? 'active' : ''
            }`}
            onClick={() => onNavigate('Settings')}
          >
            <Settings size={19} />
            <span>Settings</span>
          </button>

          <div className="profile-card">
            <div className="avatar">A</div>

            <div className="profile-info">
              <strong>Kitty Tatineni</strong>
              <span>University student</span>
            </div>

            <Settings
              size={16}
              className="profile-settings"
            />
          </div>
        </div>
      </aside>
    </>
  )
}
