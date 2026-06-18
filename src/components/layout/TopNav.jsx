import { useState } from 'react';
import Icon from '../ui/Icon';

function SearchInput({ placeholder, value, onChange, searchLoading, searchResults, onResultClick, className = '' }) {
  return (
    <div className={`relative ${className}`}>
      <Icon name="search" className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[20px]" />
      <input
        className="pl-10 pr-4 py-2 w-full bg-surface-container-low border border-outline-variant rounded-lg font-body-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
        placeholder={placeholder}
        type="search"
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
      />
      {value.length >= 2 && (searchLoading || searchResults) && (
        <div className="absolute top-full mt-1 right-0 left-0 sm:w-80 bg-surface-container-lowest border border-outline-variant rounded-lg shadow-lg z-50 max-h-60 overflow-y-auto">
          {searchLoading ? (
            <p className="p-md text-secondary font-body-sm">מחפש...</p>
          ) : (
            <>
              {searchResults?.products?.length > 0 && (
                <div className="p-sm">
                  <p className="font-label-md text-secondary px-sm py-xs">מוצרים</p>
                  {searchResults.products.map((p) => (
                    <button key={p.id} type="button" className="w-full text-right px-sm py-xs hover:bg-surface-container-low rounded font-body-sm" onClick={() => onResultClick?.('product', p)}>
                      {p.name} {p.imei ? `(${p.imei})` : ''}
                    </button>
                  ))}
                </div>
              )}
              {searchResults?.customers?.length > 0 && (
                <div className="p-sm border-t border-outline-variant">
                  <p className="font-label-md text-secondary px-sm py-xs">לקוחות</p>
                  {searchResults.customers.map((c) => (
                    <button key={c.id} type="button" className="w-full text-right px-sm py-xs hover:bg-surface-container-low rounded font-body-sm" onClick={() => onResultClick?.('customer', c)}>
                      {c.fullName} – {c.phone}
                    </button>
                  ))}
                </div>
              )}
              {searchResults?.repairs?.length > 0 && (
                <div className="p-sm border-t border-outline-variant">
                  <p className="font-label-md text-secondary px-sm py-xs">תיקונים</p>
                  {searchResults.repairs.map((r) => (
                    <button key={r.id} type="button" className="w-full text-right px-sm py-xs hover:bg-surface-container-low rounded font-body-sm" onClick={() => onResultClick?.('repair', r)}>
                      {r.ticketNumber} – {r.deviceModel}
                    </button>
                  ))}
                </div>
              )}
              {!searchResults?.products?.length && !searchResults?.customers?.length && !searchResults?.repairs?.length && (
                <p className="p-md text-secondary font-body-sm">לא נמצאו תוצאות</p>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}

export default function TopNav({
  title,
  children,
  searchPlaceholder,
  searchQuery = '',
  onSearchChange,
  searchResults = null,
  onResultClick,
  searchLoading = false,
}) {
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-outline-variant/80 shadow-sm bg-surface/95 backdrop-blur-md shrink-0 safe-top">
      <div className="relative flex items-center justify-between gap-2 px-4 md:px-8 py-3 md:py-4">
        <div className="flex items-center gap-2 min-w-0 z-10">
          <div className="md:hidden w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-primary-container flex items-center justify-center text-on-primary shrink-0">
            <Icon name="smartphone" className="text-[18px]" />
          </div>
          <h2 className="font-headline-md text-base sm:text-lg md:text-headline-md font-bold text-on-surface truncate max-w-[min(50vw,180px)] sm:max-w-none">
            {title}
          </h2>
        </div>

        {searchPlaceholder && (
          <div className="hidden md:block absolute left-1/2 -translate-x-1/2 w-72">
            <SearchInput
              placeholder={searchPlaceholder}
              value={searchQuery}
              onChange={onSearchChange}
              searchLoading={searchLoading}
              searchResults={searchResults}
              onResultClick={onResultClick}
            />
          </div>
        )}

        <div className="flex items-center gap-1 sm:gap-2 shrink-0 z-10">
          {searchPlaceholder && (
            <button
              type="button"
              className="md:hidden w-9 h-9 flex items-center justify-center rounded-full text-on-surface-variant hover:bg-secondary-container"
              onClick={() => setMobileSearchOpen((v) => !v)}
              aria-label="חיפוש"
            >
              <Icon name={mobileSearchOpen ? 'close' : 'search'} />
            </button>
          )}
          <div className="flex items-center gap-1 sm:gap-2 [&_button]:text-sm [&_button]:px-2 [&_button]:sm:px-4">
            {children}
          </div>
        </div>
      </div>

      {searchPlaceholder && mobileSearchOpen && (
        <div className="md:hidden px-4 pb-3 border-t border-outline-variant/50 bg-surface-container-low/50">
          <SearchInput
            placeholder={searchPlaceholder}
            value={searchQuery}
            onChange={onSearchChange}
            searchLoading={searchLoading}
            searchResults={searchResults}
            onResultClick={onResultClick}
          />
        </div>
      )}
    </header>
  );
}
