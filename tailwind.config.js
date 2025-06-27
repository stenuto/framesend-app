/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./src/renderer/index.html",
    "./src/renderer/src/**/*.{vue,js,ts,jsx,tsx}"
  ],
  safelist: [
    // Background colors - includes all Tailwind default colors
    {
      pattern: /bg-(red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose|gray|slate|zinc|neutral|stone)-(50|100|200|300|400|500|600|700|800|900|950)/
    },
    // Text colors - includes all Tailwind default colors
    {
      pattern: /text-(red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose|gray|slate|zinc|neutral|stone)-(50|100|200|300|400|500|600|700|800|900|950)/
    },
    // Border colors
    {
      pattern: /border-(red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose|gray|slate|zinc|neutral|stone)-(50|100|200|300|400|500|600|700|800|900|950)/
    },
    // Ring colors
    {
      pattern: /ring-(red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose|gray|slate|zinc|neutral|stone)-(50|100|200|300|400|500|600|700|800|900|950)/
    },
    // Additional dynamic classes you might need
    'from-transparent',
    'to-transparent',
    // Common utility classes that might be dynamically generated
    'opacity-0',
    'opacity-100',
    'scale-95',
    'scale-100',
    'translate-x-0',
    'translate-y-0'
  ],
  theme: {
    extend: {}
  },
  plugins: []
}