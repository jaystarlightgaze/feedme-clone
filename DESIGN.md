# Design

Where design work starts. Decision contracts in `docs/decisions/` own every
rule; this file holds values and points at the contract that owns each element.

## Values

Source: `app/globals.css`. Update this section when that source changes.

| Token | Light | Dark |
| --- | --- | --- |
| `--background` | `oklch(0.96 0.04 150)` | `oklch(0.2 0.03 150)` |
| `--foreground` | `oklch(0.145 0 0)` | `oklch(0.985 0 0)` |
| `--card` | `oklch(1 0 0)` | `oklch(0.205 0 0)` |
| `--card-foreground` | `oklch(0.145 0 0)` | `oklch(0.985 0 0)` |
| `--popover` | `oklch(1 0 0)` | `oklch(0.205 0 0)` |
| `--popover-foreground` | `oklch(0.145 0 0)` | `oklch(0.985 0 0)` |
| `--primary` | `oklch(0.205 0 0)` | `oklch(0.922 0 0)` |
| `--primary-foreground` | `oklch(0.985 0 0)` | `oklch(0.205 0 0)` |
| `--secondary` | `oklch(0.97 0 0)` | `oklch(0.269 0 0)` |
| `--secondary-foreground` | `oklch(0.205 0 0)` | `oklch(0.985 0 0)` |
| `--muted` | `oklch(0.97 0 0)` | `oklch(0.269 0 0)` |
| `--muted-foreground` | `oklch(0.556 0 0)` | `oklch(0.708 0 0)` |
| `--accent` | `oklch(0.97 0 0)` | `oklch(0.269 0 0)` |
| `--accent-foreground` | `oklch(0.205 0 0)` | `oklch(0.985 0 0)` |
| `--destructive` | `oklch(0.577 0.245 27.325)` | `oklch(0.704 0.191 22.216)` |
| `--border` | `oklch(0.922 0 0)` | `oklch(1 0 0 / 10%)` |
| `--input` | `oklch(0.922 0 0)` | `oklch(1 0 0 / 15%)` |
| `--ring` | `oklch(0.708 0 0)` | `oklch(0.556 0 0)` |

Text roles: `font-sans` for UI and headings (`--font-heading` maps to `--font-sans`), `font-mono` (`--font-geist-mono`) for code; rendered Markdown uses the `prose` typography plugin with colors mapped to the tokens above.
Radius and spacing: `--radius: 0.625rem`, with `--radius-sm` through `--radius-4xl` derived from it (0.6× to 2.6×); spacing uses the Tailwind scale.

## Components

Source: `components/ui/`. Update this section when it changes.

- `Alert`
- `Button`
- `Card`
- `Empty`
- `Field`
- `Input`
- `Label`
- `Separator`
- `Skeleton`
- `Sonner` (toast)
- `Toggle`
- `ToggleGroup`

## Rejected patterns

- Rebuilding Button, Field, Card, Dialog, Tabs, Table, Empty, Alert, or Skeleton with custom markup → [ui-composition](docs/decisions/ui-composition.md)
- Per-screen arbitrary colors instead of semantic tokens → [ui-composition](docs/decisions/ui-composition.md)
- Fixed coordinates and arbitrary pixel values for layout → [ui-composition](docs/decisions/ui-composition.md)
- Export toolbar inside the result card header → [export-actions](docs/decisions/export-actions.md)
- Sticky bottom dock for prompt and export actions → [export-actions](docs/decisions/export-actions.md)
- Disabling open-in-LLM for long content, or copying to clipboard and opening an empty chat instead → [llm-handoff](docs/decisions/llm-handoff.md)

## Map

- Component choice, semantic color use, and variants → [ui-composition](docs/decisions/ui-composition.md)
- Page shell: content width, gutters, section spacing, header position → [ui-composition](docs/decisions/ui-composition.md)
- Loading, empty, error, success, and disabled states → [ui-composition](docs/decisions/ui-composition.md)
- Narrow-screen stacking → [ui-composition](docs/decisions/ui-composition.md)
- Export action row placement and disabled state → [export-actions](docs/decisions/export-actions.md)
- Truncation notice after opening in an LLM → [llm-handoff](docs/decisions/llm-handoff.md)
