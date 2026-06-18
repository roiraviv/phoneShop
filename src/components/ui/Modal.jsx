import Icon from './Icon';

export default function Modal({ open, onClose, title, children, wide = false }) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-end md:items-center justify-center p-0 md:p-md">
      <button
        type="button"
        className="absolute inset-0 bg-inverse-surface/40"
        onClick={onClose}
        aria-label="סגור"
      />
      <div
        className={`relative bg-surface-container-lowest rounded-t-2xl md:rounded-xl border border-outline-variant shadow-[0px_4px_12px_rgba(0,0,0,0.1)] w-full ${wide ? 'md:max-w-2xl' : 'md:max-w-lg'} max-h-[92dvh] md:max-h-[90vh] overflow-y-auto pb-[env(safe-area-inset-bottom,0px)]`}
      >
        <div className="md:hidden flex justify-center pt-2 pb-1">
          <div className="w-10 h-1 rounded-full bg-outline-variant/60" aria-hidden />
        </div>
        <div className="flex items-center justify-between p-4 md:p-lg border-b border-outline-variant sticky top-0 bg-surface-container-lowest z-10">
          <h3 className="font-title-sm text-title-sm text-on-surface">{title}</h3>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-secondary hover:bg-surface-container-low"
          >
            <Icon name="close" />
          </button>
        </div>
        <div className="p-4 md:p-lg">{children}</div>
      </div>
    </div>
  );
}
