import { Icon, type IconName } from './Icon'
import './IconButton.css'

interface IconButtonProps {
  icon: IconName
  label: string
  onClick: () => void
}

export function IconButton({ icon, label, onClick }: IconButtonProps) {
  return (
    <button className="icon-button clay-sm" aria-label={label} onClick={onClick}>
      <Icon name={icon} />
    </button>
  )
}
