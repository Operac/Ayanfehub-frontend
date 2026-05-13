import type { ReactNode } from 'react';
import { PackageSearch } from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

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
    <motion.div
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: 'spring', stiffness: 200 }}
      className="col-span-full flex flex-col items-center justify-center py-20 px-6 text-center"
    >
      <div className="size-20 rounded-3xl bg-surface flex items-center justify-center text-muted mb-5 shadow-sm">
        {icon ?? <PackageSearch size={36} />}
      </div>
      <h3 className="text-lg font-black text-ink mb-2">{title}</h3>
      {description && <p className="text-sm text-muted mb-6 max-w-xs leading-relaxed">{description}</p>}
      {action && (
        action.to ? (
          <Link
            to={action.to}
            className="px-7 py-3 bg-primary text-white text-sm font-bold rounded-2xl hover:bg-primary-dark transition-colors shadow-md shadow-primary/20"
          >
            {action.label}
          </Link>
        ) : (
          <button
            onClick={action.onClick}
            className="px-7 py-3 bg-primary text-white text-sm font-bold rounded-2xl hover:bg-primary-dark transition-colors shadow-md shadow-primary/20"
          >
            {action.label}
          </button>
        )
      )}
    </motion.div>
  );
}
