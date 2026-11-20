import { Outlet } from 'react-router'

/**
 * Quiz, practice and checkpoint: no tabs, nothing to tap away to by accident.
 * Pages stay one readable column; the question and result screens opt into two panes
 * on desktop with lg:max-w-none!.
 */
export function FullScreenLayout() {
  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-2xl flex-col px-4 pt-3 pb-[calc(1.5rem+env(safe-area-inset-bottom))] md:px-8 md:pt-6 lg:max-w-6xl [&>*]:mx-auto [&>*]:w-full [&>*]:max-w-2xl">
      <Outlet />
    </div>
  )
}
