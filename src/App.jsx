import React, { useState } from 'react';
import ImageUploader from './components/ImageUploader';
import ResultDisplay from './components/ResultDisplay';
import Dashboard from './components/Dashboard';
import { analyzeImage } from './gemini';

function App() {
  const [currentView, setCurrentView] = useState('upload'); // 'upload' | 'dashboard'
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleImageSelected = async (base64Image, mimeType) => {
    setLoading(true);
    setError(null);
    setData(null);

    try {
      const result = await analyzeImage(base64Image, mimeType);
      setData(result);
    } catch (err) {
      console.error(err);
      setError("画像の解析に失敗しました。もう一度試すか、APIキーを確認してください。");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveComplete = () => {
    setData(null); // Clear data after save
    setCurrentView('dashboard'); // Go to dashboard
  };

  return (
    <div className="min-h-screen bg-gray-100 font-sans text-gray-900 pb-20">
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1
            className="text-xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-green-500 cursor-pointer"
            onClick={() => setCurrentView('upload')}
          >
            AIレシート家計簿
          </h1>
          <nav className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
            <button
              onClick={() => setCurrentView('upload')}
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${currentView === 'upload' ? 'bg-white shadow text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
            >
              登録
            </button>
            <button
              onClick={() => setCurrentView('dashboard')}
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${currentView === 'dashboard' ? 'bg-white shadow text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
            >
              グラフ
            </button>
          </nav>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6">
        {currentView === 'upload' && (
          <>
            {/* Hero / Upload Section */}
            <div className="max-w-md mx-auto">
              {!data && (
                <div className="mb-8 text-center">
                  <h2 className="text-2xl font-bold text-gray-800">レシートをスキャン</h2>
                  <p className="text-gray-500 mt-1 text-sm">AIが自動で家計簿に入力します</p>
                </div>
              )}

              {!data && <ImageUploader onImageSelected={handleImageSelected} isLoading={loading} />}

              {loading && (
                <div className="mt-8 p-8 bg-white rounded-xl shadow-sm text-center border border-gray-100">
                  <div className="inline-block animate-spin rounded-full h-10 w-10 border-4 border-blue-500 border-t-transparent mb-4"></div>
                  <p className="text-gray-800 font-medium">解析中...</p>
                  <p className="text-xs text-gray-400 mt-2">※ 20〜30秒ほどかかる場合があります</p>
                </div>
              )}

              {error && (
                <div className="mt-6 p-4 bg-red-50 text-red-700 rounded-lg border border-red-200 text-sm">
                  {error}
                </div>
              )}

              <ResultDisplay data={data} onSave={handleSaveComplete} />
            </div>
          </>
        )}

        {currentView === 'dashboard' && (
          <Dashboard />
        )}
      </main>
    </div>
  );
}

export default App;
