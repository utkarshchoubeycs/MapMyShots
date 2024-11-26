// themes.ts
export const themes = {
    light: {
      // Background Styles
      backgrounds: {
        primary: 'bg-gradient-to-br from-gray-50 via-gray-100 to-gray-50',
        secondary: 'bg-gradient-to-r from-blue-50 to-indigo-50',
        glass: 'backdrop-blur-md bg-white/80',
        card: 'bg-white',
        hover: 'hover:bg-gray-50',
      },
  
      // Container Styles
      containers: {
        glass: 'backdrop-blur-md bg-white/80 border border-gray-200 rounded-xl shadow-lg',
        card: 'bg-white border border-gray-200 rounded-xl shadow-lg',
        section: 'p-8 rounded-xl border border-gray-200',
        modal: 'bg-white rounded-xl shadow-2xl p-6',
      },
  
      // Button Styles
      buttons: {
        primary: `
          bg-gradient-to-r from-blue-600 to-indigo-600
          hover:from-blue-700 hover:to-indigo-700
          text-white font-medium
          transition-all duration-200 ease-in-out
          transform hover:scale-105 hover:shadow-lg
          active:scale-95
        `,
        secondary: `
          bg-gray-200 hover:bg-gray-300
          text-gray-800
          transition-all duration-200 ease-in-out
          transform hover:scale-105
          active:scale-95
        `,
        outline: `
          border-2 border-gray-300 hover:border-gray-400
          text-gray-700 hover:text-gray-900
          bg-transparent hover:bg-gray-50
          transition-all duration-200
        `,
        icon: `
          p-2 rounded-lg
          hover:bg-gray-100
          text-gray-600 hover:text-gray-900
          transition-all duration-200
        `,
      },
  
      // Text Styles
      text: {
        primary: 'text-gray-900',
        secondary: 'text-gray-600',
        muted: 'text-gray-400',
        heading: `
          font-bold
          bg-clip-text text-transparent
          bg-gradient-to-r from-gray-900 to-gray-600
        `,
        subheading: 'text-gray-600 font-medium',
      },
  
      // Input Styles
      inputs: {
        primary: `
          bg-gray-50
          border border-gray-300
          rounded-lg p-2
          focus:ring-2 focus:ring-blue-500 focus:border-blue-500
          transition-all duration-200
        `,
        search: `
          bg-gray-100
          border border-gray-200
          rounded-full px-4 py-2
          focus:ring-2 focus:ring-blue-400
          transition-all duration-200
        `,
      },
  
      // Status/Feedback Styles
      status: {
        success: {
          bg: 'bg-green-50',
          border: 'border-green-200',
          text: 'text-green-700',
        },
        error: {
          bg: 'bg-red-50',
          border: 'border-red-200',
          text: 'text-red-700',
        },
        warning: {
          bg: 'bg-yellow-50',
          border: 'border-yellow-200',
          text: 'text-yellow-700',
        },
        info: {
          bg: 'bg-blue-50',
          border: 'border-blue-200',
          text: 'text-blue-700',
        },
      },
  
      // Animation Variants
      animations: {
        fadeIn: {
          initial: { opacity: 0, y: 20 },
          animate: { opacity: 1, y: 0 },
          exit: { opacity: 0, y: -20 },
          transition: { duration: 0.3 },
        },
        slideIn: {
          initial: { x: -20, opacity: 0 },
          animate: { x: 0, opacity: 1 },
          exit: { x: 20, opacity: 0 },
          transition: { duration: 0.3 },
        },
      },
  
      // Layout Styles
      layout: {
        maxWidth: 'max-w-7xl',
        padding: 'px-4 sm:px-6 lg:px-8',
        spacing: 'space-y-8',
        grid: 'grid gap-6',
      },
  
      // Custom Components
      components: {
        navbar: `
          sticky top-0 z-50
          backdrop-blur-lg bg-white/80
          border-b border-gray-200
          transition-all duration-300
        `,
        sidebar: `
          fixed inset-y-0 left-0
          w-64 bg-white
          border-r border-gray-200
          transition-all duration-300
        `,
        tooltip: `
          bg-gray-900 text-white
          px-2 py-1 rounded
          text-sm font-medium
          shadow-lg
        `,
      },
    },
    // You can add more theme variations here (dark, custom, etc.)
  };
  
  // Theme Utils
  export const getThemeClass = (path: string, theme = 'light') => {
    return path.split('.').reduce((obj, key) => obj[key], themes[theme]);
  };
  