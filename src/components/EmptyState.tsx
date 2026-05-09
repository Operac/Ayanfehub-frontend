import { ReactNode } from 'react';
import { PackageSearch } from 'lucide-react';
import { Link } from 'react-router-dom';

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: {
    label: string;
    to?: string;
    onClick?: () => void;
  };
}

export default function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="col-span-full flex flex-col items-center justify-center py-20 px-4 text-center bg-gray-50 rounded-3xl">
      <div className="text-gray-300 mb-4">
        {icon ?? <PackageSearch size={56} />}
      </div>
      <h3 className="text-lg font-bold text-gray-700 mb-1">{title}</h3>
      {description && <p className="text-sm text-gray-500 mb-6 max-w-xs">{description}</p>}
      {action && (
        action.to ? (
          <Link
            to={action.to}
            className="bg-primary text-white px-6 py-2.5 rounded-full text-sm font-medium hover:opacity-90 transition"
          >
            {action.label}
          </Link>
        ) : (
          <button
            onClick={action.onClick}
            className="bg-primary text-white px-6 py-2.5 rounded-full text-sm font-medium hover:opacity-90 transition"
          >
            {action.label}
          </button>
        )
      )}
    </div>
  );
}
