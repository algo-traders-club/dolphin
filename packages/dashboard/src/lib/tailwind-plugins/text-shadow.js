// Text shadow plugin for Tailwind CSS
// Adds text-shadow utilities for typography enhancement

const plugin = require('tailwindcss/plugin');

module.exports = plugin(function({ addUtilities, theme, variants }) {
  const textShadows = {
    '.text-shadow-sm': {
      'text-shadow': '0 0.5px 0.5px rgba(0, 0, 0, 0.1)',
    },
    '.text-shadow-md': {
      'text-shadow': '0 1px 1px rgba(0, 0, 0, 0.1)',
    },
    '.text-shadow-none': {
      'text-shadow': 'none',
    },
    // Dark mode optimized text shadows
    '.dark .text-shadow-sm': {
      'text-shadow': '0 0.5px 1px rgba(0, 0, 0, 0.2)',
    },
  };

  addUtilities(textShadows, variants('textShadow'));
});
