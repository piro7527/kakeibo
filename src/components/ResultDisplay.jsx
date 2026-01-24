import React, { useState, useEffect } from 'react';
import { collection, addDoc } from "firebase/firestore";
import { db, auth } from "../firebase";

const ResultDisplay = ({ data, onSave }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState(null);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (data) {
            setFormData(data);
        }
    }, [data]);

    if (!formData) return null;

    const handleChange = (field, value) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const handleItemChange = (index, field, value) => {
        const newItems = [...formData.items];
        newItems[index] = {
            ...newItems[index],
            [field]: field === 'price' ? Number(value) : value
        };
        setFormData(prev => ({
            ...prev,
            items: newItems
        }));
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            const user = auth.currentUser;
            if (!user) {
                alert("ログインが必要です。");
                return;
            }

            // Save to Firestore
            const docRef = await addDoc(collection(db, "expenses"), {
                ...formData,
                uid: user.uid,
                createdAt: new Date()
            });
            console.log("Document written with ID: ", docRef.id);
            setIsEditing(false);
            alert("保存しました！");
            if (onSave) onSave();
        } catch (e) {
            console.error("Error adding document: ", e);
            alert("保存に失敗しました。Firestoreの設定を確認してください。");
        } finally {
            setIsSaving(false);
        }
    };

    if (isEditing) {
        return (
            <div className="w-full max-w-md mx-auto mt-6 bg-white rounded-xl shadow-lg overflow-hidden border border-gray-100 p-4">
                <h3 className="text-lg font-bold mb-4 text-gray-800">内容を編集</h3>

                <div className="space-y-4">
                    <div>
                        <label className="block text-xs text-gray-500">店舗名</label>
                        <input
                            type="text"
                            value={formData.merchant || ''}
                            onChange={(e) => handleChange('merchant', e.target.value)}
                            className="w-full border rounded p-2 text-sm"
                        />
                    </div>
                    <div className="flex gap-2">
                        <div className="flex-1">
                            <label className="block text-xs text-gray-500">日付</label>
                            <input
                                type="date"
                                value={formData.date || ''}
                                onChange={(e) => handleChange('date', e.target.value)}
                                className="w-full border rounded p-2 text-sm"
                            />
                        </div>
                        <div className="flex-1">
                            <label className="block text-xs text-gray-500">合計金額</label>
                            <input
                                type="number"
                                value={formData.totalAmount || 0}
                                onChange={(e) => handleChange('totalAmount', Number(e.target.value))}
                                className="w-full border rounded p-2 text-sm"
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-xs text-gray-500">カテゴリ</label>
                        <input
                            type="text"
                            value={formData.category || ''}
                            onChange={(e) => handleChange('category', e.target.value)}
                            className="w-full border rounded p-2 text-sm"
                        />
                    </div>
                </div>

                <div className="mt-6">
                    <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">明細</h4>
                    <div className="space-y-3 max-h-60 overflow-y-auto">
                        {formData.items && formData.items.map((item, index) => (
                            <div key={index} className="flex gap-2 items-start border-b pb-2">
                                <div className="flex-1 space-y-1">
                                    <input
                                        type="text"
                                        placeholder="商品名"
                                        value={item.name}
                                        onChange={(e) => handleItemChange(index, 'name', e.target.value)}
                                        className="w-full border rounded p-1 text-xs"
                                    />
                                    <input
                                        type="text"
                                        placeholder="カテゴリ"
                                        value={item.category}
                                        onChange={(e) => handleItemChange(index, 'category', e.target.value)}
                                        className="w-full border rounded p-1 text-xs text-gray-500"
                                    />
                                </div>
                                <div className="w-20">
                                    <input
                                        type="number"
                                        value={item.price}
                                        onChange={(e) => handleItemChange(index, 'price', e.target.value)}
                                        className="w-full border rounded p-1 text-xs text-right"
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="mt-6 flex gap-3">
                    <button
                        onClick={handleSave}
                        disabled={isSaving}
                        className={`flex-1 bg-green-600 text-white py-2 rounded-lg font-semibold hover:bg-green-700 ${isSaving ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                        {isSaving ? '保存中...' : '保存'}
                    </button>
                    <button
                        onClick={() => {
                            setIsEditing(false);
                            setFormData(data); // Revert
                        }}
                        disabled={isSaving}
                        className="flex-1 bg-gray-200 text-gray-700 py-2 rounded-lg font-semibold hover:bg-gray-300"
                    >
                        キャンセル
                    </button>
                </div>
            </div>
        );
    }

    const { date, merchant, totalAmount, category, items } = formData;

    return (
        <div className="w-full max-w-md mx-auto mt-6 bg-white rounded-xl shadow-lg overflow-hidden border border-gray-100">
            <div className="bg-green-600 p-4 text-white">
                <h3 className="text-lg font-bold flex justify-between items-center">
                    <span>{merchant || '店舗不明'}</span>
                    <span className="text-xl">¥{totalAmount?.toLocaleString() || 0}</span>
                </h3>
                <div className="text-sm opacity-90 flex justify-between mt-1">
                    <span>{date || '日付なし'}</span>
                    <span className="bg-white/20 px-2 py-0.5 rounded text-xs">{category || '未分類'}</span>
                </div>
            </div>

            <div className="p-4">
                <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">明細リスト</h4>

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
                    <p className="text-gray-400 italic text-sm text-center py-2">明細なし</p>
                )}
            </div>

            <div className="bg-gray-50 p-3 flex gap-2 border-t border-gray-100">
                <button
                    onClick={handleSave}
                    disabled={isSaving}
                    className={`flex-1 bg-blue-600 text-white py-2 rounded-lg font-semibold hover:bg-blue-700 text-sm ${isSaving ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                    {isSaving ? '保存中...' : 'この内容で登録'}
                </button>
                <button
                    onClick={() => setIsEditing(true)}
                    disabled={isSaving}
                    className="flex-1 bg-white border border-gray-300 text-gray-700 py-2 rounded-lg font-semibold hover:bg-gray-50 text-sm"
                >
                    詳細を編集
                </button>
            </div>
        </div>
    );
};

export default ResultDisplay;
