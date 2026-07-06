import type { Config } from "tailwindcss";
import tailwindcssAnimate from "tailwindcss-animate"

export default {
	darkMode: ["class"],
	content: [
		"./src/**/*.{ts,tsx}",
	],
	prefix: "",
	theme: {
		container: {
			center: true,
			padding: '2rem',
			screens: {
				'2xl': '1400px'
			}
		},
		extend: {
			fontFamily: {
				display: ['"Plus Jakarta Sans"', 'system-ui', 'sans-serif'],
				body: ['"Plus Jakarta Sans"', 'system-ui', 'sans-serif'],
				displayAlt: ['"Instrument Serif"', 'Georgia', 'serif'],
				mono: ['"JetBrains Mono"', 'monospace'],
			},
			colors: {
				border: 'hsl(var(--border))',
				input: 'hsl(var(--input))',
				ring: 'hsl(var(--ring))',
				background: 'hsl(var(--background))',
				foreground: 'hsl(var(--foreground))',
				primary: {
					DEFAULT: 'hsl(var(--primary))',
					foreground: 'hsl(var(--primary-foreground))',
					light: 'hsl(var(--primary-light))',
					dark: 'hsl(var(--primary-dark))'
				},
				secondary: {
					DEFAULT: 'hsl(var(--secondary))',
					foreground: 'hsl(var(--secondary-foreground))'
				},
				success: {
					DEFAULT: 'hsl(var(--success))',
					foreground: 'hsl(var(--success-foreground))',
					light: 'hsl(var(--success-light))'
				},
				warning: {
					DEFAULT: 'hsl(var(--warning))',
					foreground: 'hsl(var(--warning-foreground))',
					light: 'hsl(var(--warning-light))'
				},
				destructive: {
					DEFAULT: 'hsl(var(--destructive))',
					foreground: 'hsl(var(--destructive-foreground))'
				},
				muted: {
					DEFAULT: 'hsl(var(--muted))',
					foreground: 'hsl(var(--muted-foreground))'
				},
				accent: {
					DEFAULT: 'hsl(var(--accent))',
					foreground: 'hsl(var(--accent-foreground))'
				},
				gold: {
					DEFAULT: 'hsl(var(--gold))',
					foreground: 'hsl(var(--gold-foreground))',
					light: 'hsl(var(--gold-light))'
				},
				teal: {
					DEFAULT: 'hsl(var(--teal))',
					foreground: 'hsl(var(--teal-foreground))',
					light: 'hsl(var(--teal-light))'
				},
				popover: {
					DEFAULT: 'hsl(var(--popover))',
					foreground: 'hsl(var(--popover-foreground))'
				},
				card: {
					DEFAULT: 'hsl(var(--card))',
					foreground: 'hsl(var(--card-foreground))'
				},
				sidebar: {
					DEFAULT: 'hsl(var(--sidebar-background))',
					foreground: 'hsl(var(--sidebar-foreground))',
					primary: 'hsl(var(--sidebar-primary))',
					'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
					accent: 'hsl(var(--sidebar-accent))',
					'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
					border: 'hsl(var(--sidebar-border))',
					ring: 'hsl(var(--sidebar-ring))'
				}
			},
			borderRadius: {
				lg: 'var(--radius)',
				md: 'calc(var(--radius) - 2px)',
				sm: 'calc(var(--radius) - 4px)'
			},
			backgroundImage: {
				'gradient-primary': 'var(--gradient-primary)',
				'gradient-gold': 'var(--gradient-gold)',
				'gradient-success': 'var(--gradient-success)',
				'gradient-card': 'var(--gradient-card)',
				'gradient-hero': 'var(--gradient-hero)',
				'gradient-hero-teal': 'var(--gradient-hero-teal)',
				'gradient-hero-glow': 'var(--gradient-hero-glow)',
			},
			boxShadow: {
				'sm': 'var(--shadow-sm)',
				'md': 'var(--shadow-md)',
				'lg': 'var(--shadow-lg)',
				'elegant': 'var(--shadow-elegant)',
				'card': 'var(--shadow-card)',
				'glow': 'var(--shadow-glow)',
				'glow-gold': 'var(--shadow-glow-gold)',
			},
			keyframes: {
				'accordion-down': {
					from: {
						height: '0'
					},
					to: {
						height: 'var(--radix-accordion-content-height)'
					}
				},
				'accordion-up': {
					from: {
						height: 'var(--radix-accordion-content-height)'
					},
					to: {
						height: '0'
					}
				},
				'fade-in': {
					'0%': {
						opacity: '0',
						transform: 'translateY(10px)'
					},
					'100%': {
						opacity: '1',
						transform: 'translateY(0)'
					}
				},
				'scale-in': {
					'0%': {
						transform: 'scale(0.95)',
						opacity: '0'
					},
					'100%': {
						transform: 'scale(1)',
						opacity: '1'
					}
				},
				'slide-up': {
					'0%': { transform: 'translateY(10px)', opacity: '0' },
					'100%': { transform: 'translateY(0)', opacity: '1' }
				},
				'slide-down': {
					'0%': { transform: 'translateY(-10px)', opacity: '0' },
					'100%': { transform: 'translateY(0)', opacity: '1' }
				},
				'hover-lift': {
					'0%': { transform: 'translateY(0)' },
					'100%': { transform: 'translateY(-2px)' }
				},
				'pulse-soft': {
					'0%, 100%': { opacity: '1' },
					'50%': { opacity: '0.8' }
				},
				'count-up': {
					'0%': { opacity: '0', transform: 'translateY(8px)' },
					'100%': { opacity: '1', transform: 'translateY(0)' }
				},
				'shimmer': {
					'0%': { backgroundPosition: '-200% 0' },
					'100%': { backgroundPosition: '200% 0' }
				},
				'float': {
					'0%, 100%': { transform: 'translateY(0)' },
					'50%': { transform: 'translateY(-6px)' }
				},
				'route-draw': {
					'0%': { strokeDashoffset: '1000' },
					'100%': { strokeDashoffset: '0' }
				},
				'gradient-shift': {
					'0%, 100%': { backgroundPosition: '0% 50%' },
					'50%': { backgroundPosition: '100% 50%' }
				},
				'appear': {
					'0%': { opacity: '0', transform: 'translateY(12px) scale(0.98)' },
					'100%': { opacity: '1', transform: 'translateY(0) scale(1)' }
				},
				'draw-line': {
					'0%': { strokeDashoffset: '800' },
					'100%': { strokeDashoffset: '0' }
				},
				'pulse-glow': {
					'0%, 100%': { opacity: '0.4', transform: 'scale(1)' },
					'50%': { opacity: '0.8', transform: 'scale(1.05)' }
				},
				'drift': {
					'0%, 100%': { transform: 'translate(0, 0) scale(1)', opacity: '0.3' },
					'25%': { transform: 'translate(10px, -15px) scale(1.1)', opacity: '0.5' },
					'50%': { transform: 'translate(-5px, -25px) scale(0.9)', opacity: '0.2' },
					'75%': { transform: 'translate(-15px, -10px) scale(1.05)', opacity: '0.4' },
				},
				'drift-slow': {
					'0%, 100%': { transform: 'translate(0, 0) scale(1)', opacity: '0.2' },
					'33%': { transform: 'translate(-8px, -12px) scale(1.1)', opacity: '0.35' },
					'66%': { transform: 'translate(12px, -8px) scale(0.95)', opacity: '0.25' },
				},
			},
			animation: {
				'accordion-down': 'accordion-down 0.2s ease-out',
				'accordion-up': 'accordion-up 0.2s ease-out',
				'fade-in': 'fade-in 0.3s ease-out',
				'scale-in': 'scale-in 0.2s ease-out',
				'slide-up': 'slide-up 0.3s ease-out',
				'slide-down': 'slide-down 0.3s ease-out',
				'hover-lift': 'hover-lift 0.2s ease-out',
				'pulse-soft': 'pulse-soft 2s infinite',
				'count-up': 'count-up 0.5s ease-out',
				'shimmer': 'shimmer 3s linear infinite',
				'float': 'float 3s ease-in-out infinite',
				'route-draw': 'route-draw 2s ease-out forwards',
				'gradient-shift': 'gradient-shift 8s ease infinite',
				'appear': 'appear 0.5s ease-out forwards',
				'draw-line': 'draw-line 1.5s ease-out forwards',
				'pulse-glow': 'pulse-glow 3s ease-in-out infinite',
				'drift': 'drift 6s ease-in-out infinite',
				'drift-slow': 'drift-slow 8s ease-in-out infinite',
			}
		}
	},
	plugins: [tailwindcssAnimate],
} satisfies Config;
