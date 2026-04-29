/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Poppins', 'system-ui', 'sans-serif'],
      },
      colors: {
        brand: {
          DEFAULT: '#ef7c21',
          dark: '#d96813',
          light: '#fff3e8',
          black: '#1d1d1b',
        },
        primary: {
          DEFAULT: '#ef7c21',
          foreground: '#ffffff',
        },
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        'input-background': 'hsl(var(--input-background))',
        ring: 'hsl(var(--ring))',
      },
      backgroundColor: {
        input: 'hsl(var(--input-background))',
      },
      borderColor: {
        input: 'hsl(var(--input))',
      },
      textColor: {
        'muted-foreground': 'hsl(var(--text-muted-foreground))',
      },
    },
  },
  plugins: [],
}
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}"
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
