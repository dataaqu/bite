import React, { useState } from 'react';

interface WeightInputPopupProps {
  isOpen: boolean;
  onConfirm: (weight: number | null) => void;
  onCancel: () => void;
}

export const WeightInputPopup: React.FC<WeightInputPopupProps> = ({
  isOpen,
  onConfirm,
  onCancel,
}) => {
  const [weight, setWeight] = useState<string>('');

  if (!isOpen) return null;

  const handleWeightSubmit = () => {
    if (weight) {
      const weightValue = parseFloat(weight);
      if (!isNaN(weightValue) && weightValue > 0) {
        onConfirm(weightValue);
      } else {
        alert('გთხოვთ შეიყვანოთ სწორი წონა');
        return;
      }
    }
    setWeight('');
  };

  const handleDontKnow = () => {
    onConfirm(null);
    setWeight('');
  };

  const handleCancel = () => {
    onCancel();
    setWeight('');
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center px-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl">
        <h3 className="text-lg font-bold mb-4" style={{color: '#f27141'}}>ზუსტი გრამაჟი</h3>
        
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            ჩაწერეთ ზუსტი გრამაჟი რათა კალკულაციისას არ იყოს ცდომილება
          </p>
          
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">
              წონა (გრამებში)
            </label>
            <input
              type="number"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              placeholder="მაგ: 150"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 outline-none focus:ring-1"
              style={{'--focus-border': '#f27141', '--focus-ring': '#f27141'}}
              autoFocus
            />
          </div>
        </div>

        <div className="space-y-3 mt-6">
          <button
            onClick={handleWeightSubmit}
            disabled={!weight}
            className="w-full py-2.5 text-white font-semibold rounded-xl transition-colors shadow-lg disabled:bg-gray-300 disabled:cursor-not-allowed"
            style={{backgroundColor: '#f27141', boxShadow: '0 10px 15px -3px rgba(242, 113, 65, 0.3)'}}
          >
            გაგრძელება
          </button>
          <button
            onClick={handleDontKnow}
            className="w-full py-2.5 text-gray-700 font-semibold hover:bg-gray-50 rounded-xl transition-colors border border-gray-300"
          >
            არ ვიცი
          </button>
          <button
            onClick={handleCancel}
            className="w-full py-1.5 text-gray-500 font-medium hover:text-gray-700 transition-colors text-sm"
          >
            გაუქმება
          </button>
        </div>
      </div>
    </div>
  );
};