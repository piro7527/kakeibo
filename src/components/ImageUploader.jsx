import React, { useState } from 'react';

const ImageUploader = ({ onImageSelected, isLoading }) => {
    const [preview, setPreview] = useState(null);

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setPreview(reader.result);
                // Remove data URL prefix (data:image/jpeg;base64,) for the API
                const base64Data = reader.result.split(',')[1];
                onImageSelected(base64Data);
            };
            reader.readAsDataURL(file);
        }
    };

    return (
        <div className="w-full max-w-md mx-auto p-4 bg-white rounded-xl shadow-md space-y-4">
            <div className="text-center">
                <h2 className="text-xl font-bold text-gray-800 mb-2">Receipt Upload</h2>
                <p className="text-sm text-gray-500 mb-4">Capture or upload a receipt to analyze</p>
            </div>

            <div className="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-lg p-6 bg-gray-50 hover:bg-gray-100 transition-colors relative">
                {preview ? (
                    <img
                        src={preview}
                        alt="Receipt preview"
                        className="max-h-64 object-contain rounded-md mb-4"
                    />
                ) : (
                    <div className="text-gray-400 mb-2">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                    </div>
                )}

                <label
                    htmlFor="file-upload"
                    className={`cursor-pointer bg-blue-600 text-white py-2 px-6 rounded-full font-semibold shadow hover:bg-blue-700 transition duration-300 ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                    {isLoading ? 'Processing...' : (preview ? 'Retake / Select New' : 'Camera / Upload')}
                </label>
                <input
                    id="file-upload"
                    type="file"
                    accept="image/*"
                    capture="environment"
                    onChange={handleFileChange}
                    disabled={isLoading}
                    className="hidden"
                />
            </div>
        </div>
    );
};

export default ImageUploader;
