import React, { useState } from 'react';
import ImageUploader from './components/ImageUploader';
import ResultDisplay from './components/ResultDisplay';
import Dashboard from './components/Dashboard';
import { analyzeImage } from './gemini';

function App() {
  const [currentView, setCurrentView] = useState('upload'); // 'upload' | 'dashboard'
  const [data, setData] = useState(null); // Currently editing/viewing result
  const [pendingResults, setPendingResults] = useState([]); // Results waiting for review
  const [processingStatus, setProcessingStatus] = useState({ total: 0, current: 0, active: false });
  const [error, setError] = useState(null);

  const handleImagesSelected = async (imagesData) => {
    setProcessingStatus({ total: imagesData.length, current: 0, active: true });
    setError(null);
    const newPending = [];
    const errors = [];

    for (let i = 0; i < imagesData.length; i++) {
      setProcessingStatus(prev => ({ ...prev, current: i + 1 }));
      try {
        const result = await analyzeImage(imagesData[i].base64Data, imagesData[i].mimeType);
        newPending.push({ ...result, _tempId: Date.now() + i }); // Add temp ID for list key
      } catch (err) {
        console.error(err);
        errors.push(`画像 ${i + 1} の解析に失敗しました。`);
      }
    }

    if (errors.length > 0) {
      setError(errors.join("\n"));
    }

    setPendingResults(prev => [...prev, ...newPending]);
    setProcessingStatus({ total: 0, current: 0, active: false });
  };

  const handleReviewClick = (result) => {
    setData(result);
  };

  const handleSaveComplete = () => {
    // Remove the saved item from pending results
    if (data && data._tempId) {
      setPendingResults(prev => prev.filter(item => item._tempId !== data._tempId));
    }
    setData(null);

    // If no more pending, stay on upload (or go to dashboard? Upload seems better to show "Done")
    // If pending remains, user sees list again.
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

              {!data && !processingStatus.active && (
                <ImageUploader onImagesSelected={handleImagesSelected} isLoading={processingStatus.active} />
              )}

              {processingStatus.active && (
                <div className="mt-8 p-8 bg-white rounded-xl shadow-sm text-center border border-gray-100">
                  <div className="inline-block animate-spin rounded-full h-10 w-10 border-4 border-blue-500 border-t-transparent mb-4"></div>
                  <p className="text-gray-800 font-medium">解析中... ({processingStatus.current}/{processingStatus.total})</p>
                  <p className="text-xs text-gray-400 mt-2">※ 1枚につき20〜30秒ほどかかる場合があります</p>
                </div>
              )}

              {error && (
                <div className="mt-6 p-4 bg-red-50 text-red-700 rounded-lg border border-red-200 text-sm whitespace-pre-line">
                  {error}
                </div>
              )}

              {/* Pending Results List */}
              {!data && pendingResults.length > 0 && !processingStatus.active && (
                <div className="mt-6 space-y-4">
                  <h3 className="font-bold text-gray-700">確認待ちのレシート ({pendingResults.length}件)</h3>
                  {pendingResults.map((result) => (
                    <div
                      key={result._tempId}
                      className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 flex justify-between items-center cursor-pointer hover:bg-gray-50 transition-colors"
                      onClick={() => handleReviewClick(result)}
                    >
                      <div>
                        <div className="font-bold text-gray-800">{result.merchant || "店舗名不明"}</div>
                        <div className="text-xs text-gray-500">{result.date} - 合計: ¥{result.totalAmount?.toLocaleString()}</div>
                      </div>
                      <div className="text-blue-500 font-medium text-sm">確認する &rarr;</div>
                    </div>
                  ))}
                </div>
              )}

              {data && (
                <div className="relative">
                  <button
                    onClick={() => setData(null)}
                    className="mb-4 text-sm text-gray-500 hover:text-gray-700 underline"
                  >
                    &larr; 一覧に戻る
                  </button>
                  <ResultDisplay data={data} onSave={handleSaveComplete} />
                </div>
              )}
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
