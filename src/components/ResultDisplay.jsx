import React from 'react';

const ResultDisplay = ({ data }) => {
    if (!data) return null;

    const { date, merchant, totalAmount, category, items } = data;

    return (
        <div className="w-full max-w-md mx-auto mt-6 bg-white rounded-xl shadow-lg overflow-hidden border border-gray-100">
            <div className="bg-green-600 p-4 text-white">
                <h3 className="text-lg font-bold flex justify-between items-center">
                    <span>{merchant || 'Unknown Merchant'}</span>
                    <span className="text-xl">¥{totalAmount?.toLocaleString() || 0}</span>
                </h3>
                <div className="text-sm opacity-90 flex justify-between mt-1">
                    <span>{date || 'No Date'}</span>
                    <span className="bg-white/20 px-2 py-0.5 rounded text-xs">{category || 'Uncategorized'}</span>
                </div>
            </div>

            <div className="p-4">
                <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Items</h4>

                {items && items.length > 0 ? (
                    <div className="space-y-3">
                        {items.map((item, index) => (
                            <div key={index} className="flex justify-between items-start py-2 border-b border-gray-50 last:border-0">
                                <div>
                                    <div className="font-medium text-gray-800">{item.name}</div>
                                    <div className="text-xs text-gray-400">{item.category}</div>
                                </div>
                                <div className="font-semibold text-gray-700">¥{item.price?.toLocaleString()}</div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="text-gray-400 italic text-sm text-center py-2">No items detected</p>
                )}
            </div>

            <div className="bg-gray-50 p-3 text-center border-t border-gray-100">
                <button className="text-green-600 text-sm font-medium hover:text-green-800">
                    Edit Details
                </button>
            </div>
        </div>
    );
};

export default ResultDisplay;
