/**
 * MaterialIcon Component
 * Renders Google Material Symbols icons
 */

interface MaterialIconProps {
  name: string;
  className?: string;
  size?: 'small' | 'medium' | 'large';
  filled?: boolean;
}

export const MaterialIcon: React.FC<MaterialIconProps> = ({
  name,
  className = '',
  size = 'medium',
  filled = false,
}) => {
  const sizeClass = {
    small: 'material-icon-sm',
    medium: 'material-icon-md',
    large: 'material-icon-lg',
  }[size];

  return (
    <span
      className={`material-symbols-outlined ${sizeClass} ${filled ? 'material-icon-filled' : ''} ${className}`}
      aria-hidden="true"
    >
      {name}
    </span>
  );
};
