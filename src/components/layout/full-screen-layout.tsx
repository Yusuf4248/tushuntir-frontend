import { Outlet } from 'react-router'

/** Quiz, practice and checkpoint: no tabs, nothing to tap away to by accident. */
export function FullScreenLayout() {
  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-2xl flex-col px-4 pt-3 pb-[calc(1.5rem+env(safe-area-inset-bottom))] md:px-8 md:pt-6">
      <Outlet />
    </div>
  )
}
