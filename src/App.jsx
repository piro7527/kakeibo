import React, { useState } from 'react';
import ImageUploader from './components/ImageUploader';
import ResultDisplay from './components/ResultDisplay';
import { analyzeImage } from './gemini';

function App() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleImageSelected = async (base64Image) => {
    setLoading(true);
    setError(null);
    setData(null);

    try {
      const result = await analyzeImage(base64Image);
      setData(result);
    } catch (err) {
      console.error(err);
      setError("Failed to analyze image. Please try again or check your API key.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 py-8 px-4 font-sans text-gray-900">
      <header className="max-w-md mx-auto mb-8 text-center">
        <h1 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-green-500">
          AI Receipt Kakeibo
        </h1>
        <p className="text-gray-500 mt-2">Simplify your expenses</p>
      </header>

      <main>
        <ImageUploader onImageSelected={handleImageSelected} isLoading={loading} />

        {loading && (
          <div className="max-w-md mx-auto mt-6 p-4 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-blue-500 border-t-transparent"></div>
            <p className="mt-2 text-blue-600 font-medium">Analyzing receipt with Gemini...</p>
          </div>
        )}

        {error && (
          <div className="max-w-md mx-auto mt-6 p-4 bg-red-50 text-red-700 rounded-lg border border-red-200">
            {error}
          </div>
        )}

        <ResultDisplay data={data} />
      </main>
    </div>
  );
}

export default App;
