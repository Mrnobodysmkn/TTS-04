import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary';
}

const Button: React.FC<ButtonProps> = ({ children, variant = 'primary', ...props }) => {
  const baseClasses = `
    relative inline-flex items-center justify-center gap-3 px-6 py-3 font-bold rounded-xl
    border shadow-lg
    focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900
    disabled:opacity-60 disabled:cursor-not-allowed disabled:shadow-md
    transform hover:-translate-y-0.5 transition-all duration-300 ease-in-out
  `;

  const variantClasses = {
    primary: `
      bg-gradient-to-r from-cyan-500 to-sky-600 border-cyan-600/50 text-white shadow-cyan-500/20
      hover:shadow-lg hover:shadow-cyan-500/30
      focus:ring-cyan-400
    `,
    secondary: `
      bg-slate-800/60 border-slate-700/80 text-slate-200 shadow-slate-900/40
      hover:bg-slate-700/60 hover:border-slate-600
      focus:ring-slate-500
    `,
  };

  return (
    <button
      {...props}
      className={`${baseClasses} ${variantClasses[variant]}`}
    >
      {children}
    </button>
  );
};

export default Button;
