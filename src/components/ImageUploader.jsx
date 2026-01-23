import React, { useState } from 'react';

const ImageUploader = ({ onImagesSelected, isLoading }) => {
    const [previews, setPreviews] = useState([]);
    const [isDragging, setIsDragging] = useState(false);

    // Handle file selection (via input or drop)
    const processFiles = (files) => {
        const validFiles = Array.from(files).filter(file => file.type.startsWith('image/'));

        if (validFiles.length > 0) {
            const newPreviews = [];
            const results = [];
            let processedCount = 0;

            validFiles.forEach(file => {
                const reader = new FileReader();
                reader.onloadend = () => {
                    newPreviews.push(reader.result);
                    const base64Data = reader.result.split(',')[1];
                    const mimeType = file.type;
                    results.push({ base64Data, mimeType });

                    processedCount++;
                    if (processedCount === validFiles.length) {
                        setPreviews(newPreviews);
                        onImagesSelected(results);
                    }
                };
                reader.readAsDataURL(file);
            });
        }
    };

    const handleFileChange = (e) => {
        processFiles(e.target.files);
    };

    const handleDragOver = (e) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = (e) => {
        e.preventDefault();
        setIsDragging(false);
    };

    const handleDrop = (e) => {
        e.preventDefault();
        setIsDragging(false);
        processFiles(e.dataTransfer.files);
    };

    return (
        <div className="w-full max-w-md mx-auto p-4 bg-white rounded-xl shadow-md space-y-4">
            <div className="text-center">
                <h2 className="text-xl font-bold text-gray-800 mb-2">レシート登録</h2>
                <p className="text-sm text-gray-500 mb-4">レシートを撮影またはアップロードしてください（複数可）</p>
            </div>

            <div
                className={`flex flex-col items-center justify-center border-2 border-dashed rounded-lg p-6 transition-colors relative
          ${isDragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300 bg-gray-50 hover:bg-gray-100'}
        `}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
            >
                {previews.length > 0 ? (
                    <div className="grid grid-cols-3 gap-2 mb-4 w-full">
                        {previews.map((src, index) => (
                            <img
                                key={index}
                                src={src}
                                alt={`Receipt preview ${index + 1}`}
                                className="h-20 w-full object-cover rounded-md"
                            />
                        ))}
                    </div>
                ) : (
                    <div className="text-gray-400 mb-2 pointer-events-none">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        <p className="mt-2 text-sm text-gray-500">ここにドラッグ＆ドロップ</p>
                    </div>
                )}

                <label
                    htmlFor="file-upload"
                    className={`cursor-pointer bg-blue-600 text-white py-2 px-6 rounded-full font-semibold shadow hover:bg-blue-700 transition duration-300 ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                    {isLoading ? '処理中...' : (previews.length > 0 ? '追加 / 再選択' : 'カメラ / アップロード')}
                </label>
                <input
                    id="file-upload"
                    type="file"
                    accept="image/*,.heic,.heif"
                    capture="environment"
                    multiple
                    onChange={handleFileChange}
                    disabled={isLoading}
                    className="hidden"
                />
            </div>
        </div>
    );
};

export default ImageUploader;
