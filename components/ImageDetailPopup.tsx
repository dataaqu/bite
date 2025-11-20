import React from 'react';
import { FoodLogEntry } from '../types';
import { XIcon, FlameIcon } from './Icons';

interface Props {
  entry: FoodLogEntry;
  isOpen: boolean;
  onClose: () => void;
}

export const ImageDetailPopup: React.FC<Props> = ({ entry, isOpen, onClose }) => {
  if (!isOpen || !entry.analysis) return null;

  const { totalMacros, summary, foodItems } = entry.analysis;
  const timestampStr = new Date(entry.timestamp).toLocaleDateString('ka-GE', { 
    hour: '2-digit', 
    minute: '2-digit',
    day: 'numeric',
    month: 'long'
  });

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center px-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl">
        
        {/* Header with close button */}
        <div className="sticky top-0 bg-white rounded-t-2xl border-b border-gray-100 p-4 flex justify-between items-center">
          <h3 className="text-lg font-bold text-gray-900">კერძის დეტალები</h3>
          <button 
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 transition-colors rounded-full hover:bg-gray-100"
          >
            <XIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Image */}
        {entry.imageUrl && (
          <div className="px-4">
            <img 
              src={entry.imageUrl} 
              alt="Meal" 
              className="w-full h-64 object-cover rounded-xl"
            />
          </div>
        )}

        {/* Content */}
        <div className="p-4 space-y-6">
          
          {/* Summary and calories */}
          <div>
            <div className="flex items-start justify-between mb-2">
              <h4 className="text-xl font-bold text-gray-900 flex-1 leading-tight">{summary}</h4>
              <div className="flex items-center ml-4 px-3 py-1.5 rounded-full" style={{backgroundColor: '#f27141'}}>
                <FlameIcon className="w-4 h-4 text-white mr-1" />
                <span className="font-bold text-white">{Math.round(totalMacros.calories)}</span>
              </div>
            </div>
            <p className="text-sm text-gray-500">{timestampStr}</p>
          </div>

          {/* Food items */}
          <div>
            <h5 className="font-semibold text-gray-900 mb-3">კერძის შემადგენლობა:</h5>
            <div className="space-y-2">
              {foodItems.map((item, idx) => (
                <div key={idx} className="flex justify-between items-center py-2 px-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">{item.name}</p>
                    <p className="text-sm text-gray-500">{item.portion}</p>
                  </div>
                  <div className="text-right text-sm">
                    <p className="font-medium text-gray-900">{Math.round(item.macros.calories)} კკალ</p>
                    <p className="text-gray-500">
                      ც: {Math.round(item.macros.protein)}გ | ნწ: {Math.round(item.macros.carbs)}გ | ცხ: {Math.round(item.macros.fat)}გ
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Total macros */}
          <div>
            <h5 className="font-semibold text-gray-900 mb-3">მთლიანი მაკროები:</h5>
            <div className="grid grid-cols-4 gap-3">
              <div className="text-center p-3 rounded-lg" style={{backgroundColor: 'rgba(242, 113, 65, 0.1)', borderColor: 'rgba(242, 113, 65, 0.3)'}}>
                <p className="text-xs font-medium uppercase tracking-wider" style={{color: '#f27141'}}>კალორია</p>
                <p className="text-lg font-bold mt-1" style={{color: '#f27141'}}>{Math.round(totalMacros.calories)}</p>
              </div>
              <div className="text-center p-3 rounded-lg" style={{backgroundColor: 'rgba(59, 130, 246, 0.1)', borderColor: 'rgba(59, 130, 246, 0.3)'}}>
                <p className="text-xs text-blue-500 font-medium uppercase tracking-wider">ნახშირწყლები</p>
                <p className="text-lg font-bold text-blue-800 mt-1">{Math.round(totalMacros.carbs)}გ</p>
              </div>
              <div className="text-center p-3 rounded-lg" style={{backgroundColor: 'rgba(34, 197, 94, 0.1)', borderColor: 'rgba(34, 197, 94, 0.3)'}}>
                <p className="text-xs text-green-500 font-medium uppercase tracking-wider">ცილა</p>
                <p className="text-lg font-bold text-green-800 mt-1">{Math.round(totalMacros.protein)}გ</p>
              </div>
              <div className="text-center p-3 rounded-lg" style={{backgroundColor: 'rgba(239, 68, 68, 0.1)', borderColor: 'rgba(239, 68, 68, 0.3)'}}>
                <p className="text-xs text-red-500 font-medium uppercase tracking-wider">ცხიმი</p>
                <p className="text-lg font-bold text-red-800 mt-1">{Math.round(totalMacros.fat)}გ</p>
              </div>
            </div>
          </div>

          {/* User provided weight info */}
          {entry.userProvidedWeight && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-sm text-blue-800">
                <span className="font-medium">მომხმარებლის მითითებული წონა:</span> {entry.userProvidedWeight}გ
              </p>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};