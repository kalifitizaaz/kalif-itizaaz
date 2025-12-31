
import React, { useState } from 'react';

interface MultiAnswerInputProps {
  items: string[];
  onAdd: (text: string) => void;
  onRemove: (index: number) => void;
  placeholder?: string;
}

export const MultiAnswerInput: React.FC<MultiAnswerInputProps> = ({ items, onAdd, onRemove, placeholder }) => {
  const [value, setValue] = useState('');

  const handleAdd = () => {
    if (value.trim()) {
      onAdd(value.trim());
      setValue('');
    }
  };

  return (
    <div className="w-full max-w-lg space-y-4">
      <div className="relative">
        <input
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
          placeholder={placeholder || "Type something..."}
          className="w-full bg-transparent border-b border-gray-700 py-3 text-xl focus:outline-none focus:border-white transition-colors placeholder-gray-600"
          autoFocus
        />
        <button 
          onClick={handleAdd}
          className="absolute right-0 bottom-3 text-gray-500 hover:text-white transition-colors"
        >
          Add
        </button>
      </div>
      
      <div className="space-y-2 max-h-64 overflow-y-auto custom-scrollbar pr-2">
        {items.map((item, idx) => (
          <div key={idx} className="flex justify-between items-center p-4 bg-gray-900/50 rounded-lg border border-gray-800 fade-in group">
            <span className="text-gray-300 font-light">{item}</span>
            <button 
              onClick={() => onRemove(idx)}
              className="text-gray-700 group-hover:text-red-900 transition-colors"
            >
              &times;
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};
