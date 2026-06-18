import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      fontFamily: {
        display: ['Barlow Condensed', 'sans-serif'],
        body:    ['Barlow', 'sans-serif'],
      },
      colors: {
        bg:               '#0F172A',
        surface:          '#1E293B',
        'surface-elevated': '#293548',
        primary:          '#F97316',
        'team-a':         '#38BDF8',
        'team-b':         '#A78BFA',
        make:             '#22C55E',
        miss:             '#64748B',
        score:            '#F8FAFC',
        fg:               '#F8FAFC',
        muted:            '#94A3B8',
        destructive:      '#EF4444',
      },
    },
  },
  plugins: [],
}

export default config
