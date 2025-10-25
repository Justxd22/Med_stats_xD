"use client";
import { useState } from 'react';
import { useRouter } from 'next/navigation';

const LoginPage = () => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');

    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });

      if (res.ok) {
        const data = await res.json();
        console.log("REDIITITEECCTTTT")
        router.push(data.redirectPath);
      } else {
        const data = await res.json();
        setError(data.error || 'Invalid password');
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background Image with Blur */}
      <div
        className="absolute inset-0 bg-cover bg-center scale-110"
        style={{ 
          backgroundImage: "url('/ophthalmic_center.jpg')",
          // filter: "blur(8px)"
        }}
      ></div>
      
      {/* Vignette Overlay */}
      <div 
        className="absolute inset-0" 
        style={{
          background: "radial-gradient(circle at center, transparent 0%, rgba(0, 0, 0, 0.3) 50%, rgba(0, 0, 0, 0.7) 100%)"
        }}
      ></div>
      
      {/* Additional Dark Overlay */}
      <div className="absolute inset-0 bg-black/20"></div>
      
      {/* Login Form */}
      <div className="relative z-10 bg-black/40 text-white backdrop-blur-sm p-8 sm:p-12 rounded-2xl shadow-2xl w-full max-w-md mx-4">
        <div className="text-center mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-white-800">Ophthalmology Center</h1>
          <p className="text-white-600 mt-2">Please enter the password to access the dashboard.</p>
        </div>
        <form onSubmit={handleLogin}>
          <div className="space-y-6">
            <div>
              <label htmlFor="password" className="sr-only">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-4 py-3 text-lg border-2 border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 transition"
                placeholder="Password"
              />
            </div>

            {error && (
              <p className="text-center text-red-500 font-medium">{error}</p>
            )}

            <div>
              <button
                type="submit"
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-lg font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition"
              >
                Login
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LoginPage;