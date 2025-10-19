import React from 'react';

interface ErrorMessageProps {
  message: string;
  onRetry?: () => void;
}

const ErrorMessage: React.FC<ErrorMessageProps> = ({ message, onRetry }) => {
  if (!message) return null;

  return (
    <div className="bg-red-900/40 text-red-200 border border-red-500/50 rounded-lg p-4 my-4 flex flex-col sm:flex-row items-center justify-between gap-4 text-right shadow-lg shadow-red-900/30">
      <p><strong className="font-semibold text-red-100">خطا:</strong> {message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg transition-colors duration-200 flex-shrink-0 w-full sm:w-auto"
        >
          تلاش مجدد
        </button>
      )}
    </div>
  );
};

export default ErrorMessage;
