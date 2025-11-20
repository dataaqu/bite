import React, { useState } from 'react';
import { XIcon } from './Icons';
import { AuthService } from '../lib/auth';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onLogin: (user: any) => void;
}

export const AuthPrompt: React.FC<Props> = ({ isOpen, onClose, onLogin }) => {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (!email.includes('@')) {
        throw new Error('გთხოვთ შეიყვანოთ სწორი ელფოსტა');
      }

      const user = await AuthService.login(email.trim(), name.trim());
      onLogin(user);
      onClose();
    } catch (error) {
      setError(error instanceof Error ? error.message : 'შეცდომა მოხდა');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center px-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl">
        
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold text-gray-900">შესვლა Bite-ში</h3>
          <button 
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 transition-colors rounded-full hover:bg-gray-100"
          >
            <XIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Description */}
        <p className="text-gray-600 mb-6 text-sm">
          შეინახეთ თქვენი კვების ისტორია ყველა მოწყობილობაზე. 
          მხოლოდ ელფოსტა და სახელია საჭირო.
        </p>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              ელფოსტა
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none"
              placeholder="your@email.com"
              required
              disabled={loading}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              სახელი
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none"
              placeholder="თქვენი სახელი"
              required
              disabled={loading}
            />
          </div>

          {error && (
            <div className="text-red-600 text-sm bg-red-50 border border-red-200 rounded-lg p-3">
              {error}
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button 
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 text-gray-700 font-semibold hover:bg-gray-50 rounded-xl transition-colors"
              disabled={loading}
            >
              გაუქმება
            </button>
            <button 
              type="submit"
              className="flex-1 py-2.5 text-white font-semibold rounded-xl transition-colors shadow-lg disabled:opacity-50"
              style={{backgroundColor: '#f27141', boxShadow: '0 10px 15px -3px rgba(242, 113, 65, 0.3)'}}
              disabled={loading}
            >
              {loading ? 'მუშავდება...' : 'შესვლა'}
            </button>
          </div>
        </form>

        {/* Footer note */}
        <p className="text-xs text-gray-500 mt-4 text-center">
          პაროლი არ არის საჭირო. მონაცემები დაცულია.
        </p>
      </div>
    </div>
  );
};