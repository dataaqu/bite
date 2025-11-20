import React from 'react';

interface DeleteConfirmPopupProps {
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export const DeleteConfirmPopup: React.FC<DeleteConfirmPopupProps> = ({
  isOpen,
  onConfirm,
  onCancel,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center px-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl">
        <h3 className="text-lg font-bold mb-4" style={{color: '#f27141'}}>ჩანაწერის წაშლა</h3>
        
        <p className="text-sm text-gray-600 mb-6">
          ნამდვილად გსურთ ამ ჩანაწერის წაშლა?
        </p>

        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 py-2.5 text-gray-700 font-semibold hover:bg-gray-50 rounded-xl transition-colors border border-gray-300"
          >
            გაუქმება
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 py-2.5 text-white font-semibold rounded-xl transition-colors shadow-lg"
            style={{backgroundColor: '#f27141', boxShadow: '0 10px 15px -3px rgba(242, 113, 65, 0.3)'}}
          >
            წაშლა
          </button>
        </div>
      </div>
    </div>
  );
};