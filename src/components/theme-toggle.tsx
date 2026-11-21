import { Check, Monitor, Moon, Sun, type LucideIcon } from 'lucide-react'
import { DropdownMenu } from 'radix-ui'

import { t } from '@/lib/strings.uz'
import { useTheme, type ThemeChoice } from '@/lib/theme'
import { cn } from '@/lib/utils'

const options: { value: ThemeChoice; label: string; icon: LucideIcon }[] = [
  { value: 'system', label: t.profile.themeSystem, icon: Monitor },
  { value: 'light', label: t.profile.themeLight, icon: Sun },
  { value: 'dark', label: t.profile.themeDark, icon: Moon },
]

function option(choice: ThemeChoice) {
  return options.find((o) => o.value === choice) ?? options[0]!
}

/** Header button: shows the current choice and opens system / light / dark. */
export function ThemeToggle({ className }: { className?: string }) {
  const [choice, setChoice] = useTheme()
  const { icon: Icon, label } = option(choice)
  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger
        aria-label={t.profile.themeButton(label)}
        className={cn(
          'grid size-11 shrink-0 cursor-pointer place-items-center rounded-full text-foreground transition-colors outline-none hover:bg-muted focus-visible:outline-2 focus-visible:outline-ring data-[state=open]:bg-muted',
          className,
        )}
      >
        <Icon className="size-6" aria-hidden />
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content
          align="end"
          sideOffset={6}
          className="z-50 min-w-44 rounded-xl border bg-card p-1 text-card-foreground shadow-xl data-[state=open]:animate-pop-in"
        >
          <DropdownMenu.Label className="px-3 pt-2 pb-1 text-xs font-semibold text-muted-foreground">
            {t.profile.theme}
          </DropdownMenu.Label>
          <DropdownMenu.RadioGroup
            value={choice}
            onValueChange={(value) => setChoice(value as ThemeChoice)}
          >
            {options.map(({ value, label: itemLabel, icon: ItemIcon }) => (
              <DropdownMenu.RadioItem
                key={value}
                value={value}
                className="flex min-h-11 cursor-pointer items-center gap-3 rounded-lg px-3 text-sm font-medium outline-none select-none data-[highlighted]:bg-muted"
              >
                <ItemIcon className="size-4 text-muted-foreground" aria-hidden />
                <span className="flex-1">{itemLabel}</span>
                <DropdownMenu.ItemIndicator>
                  <Check className="size-4 text-primary" aria-hidden />
                </DropdownMenu.ItemIndicator>
              </DropdownMenu.RadioItem>
            ))}
          </DropdownMenu.RadioGroup>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  )
}

/** Profile: the three choices side by side. */
export function ThemeSwitch() {
  const [choice, setChoice] = useTheme()
  return (
    <div
      role="radiogroup"
      aria-label={t.profile.theme}
      className="grid grid-cols-3 gap-2 rounded-xl bg-muted p-1"
    >
      {options.map(({ value, label, icon: Icon }) => (
        <button
          key={value}
          type="button"
          role="radio"
          aria-checked={choice === value}
          onClick={() => setChoice(value)}
          className={cn(
            'flex min-h-11 cursor-pointer items-center justify-center gap-1.5 rounded-lg text-sm font-medium transition-colors',
            choice === value
              ? 'bg-card text-foreground shadow-card'
              : 'text-muted-foreground hover:text-foreground',
          )}
        >
          <Icon className="size-4" aria-hidden />
          {label}
        </button>
      ))}
    </div>
  )
}
