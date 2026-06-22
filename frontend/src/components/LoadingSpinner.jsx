import React from 'react';

const LoadingSpinner = ({ size = 'md', text = '' }) => {
  const sizeMap = { sm: 'w-4 h-4', md: 'w-8 h-8', lg: 'w-12 h-12' };

  return (
    <div className="flex flex-col items-center justify-center gap-3">
      <div
        className={`${sizeMap[size]} border-2 border-slate-700 border-t-primary-500 rounded-full animate-spin`}
      />
      {text && <p className="text-slate-400 text-sm">{text}</p>}
    </div>
  );
};

export default LoadingSpinner;
