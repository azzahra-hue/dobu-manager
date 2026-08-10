import React, { useState } from 'react';
import { Package } from 'lucide-react';
import { useAppContext } from '../context/AppContext';

export default function Login() {
  const { login } = useAppContext();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const success = login(username, password);
    if (!success) {
      setError('Username atau password salah.');
    }
  };

  return (
    <div className="min-h-screen bg-amber-50/50 flex flex-col justify-center items-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-sm border border-amber-200 p-8 text-center space-y-6">
        <div className="flex justify-center">
          <div className="p-4 bg-sky-100 text-sky-600 rounded-2xl">
            <Package size={48} />
          </div>
        </div>
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Dobu Manager</h1>
          <p className="text-gray-500">Masuk untuk mengelola usaha bakingmu.</p>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4 text-left">
          {error && <p className="text-red-500 text-sm text-center bg-red-50 p-2 rounded-lg">{error}</p>}
          
          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-600">Username</label>
            <input 
              type="text" 
              required
              className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-sky-500 outline-none"
              value={username}
              onChange={e => setUsername(e.target.value)}
            />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-600">Password</label>
            <input 
              type="password" 
              required
              className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-sky-500 outline-none"
              value={password}
              onChange={e => setPassword(e.target.value)}
            />
          </div>
          
          <button
            type="submit"
            className="w-full bg-sky-500 hover:bg-sky-600 text-white font-bold py-3 px-4 rounded-xl transition-colors mt-2"
          >
            Masuk
          </button>
        </form>
      </div>
    </div>
  );
}
