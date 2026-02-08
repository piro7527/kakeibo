import React, { useState, useEffect } from 'react';
import { collection, addDoc, updateDoc, doc } from "firebase/firestore";
import { db, auth } from "../firebase";

const ResultDisplay = ({ data, onSave }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState(null);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (data) {
            setFormData(data);
            // Should start in edit mode if it's a manual entry (no ID yet but user wants to 'edit' the blank form)
            // OR if it's an existing item being edited.
            // Actually, for manual entry, we want the user to see the form immediately.
            // For scanned receipts, they see the summary first.
            // Let's rely on a prop or check if it's "raw" data?
            // Simplest: If it has an ID, it's an EDIT of an existing item -> Show form? Or summary?
            // If it has NO ID (scanned or manual), it's a NEW item.

            // Logic refinement:
            // - Scanned: No ID. User reviews summary. Can click "Edit".
            // - Manual: No ID. User should see FORM immediately. 
            // - Edit Existing: Has ID. User should see FORM immediately? Or summary? Probably Form.

            if (data.isManualEntry || data.id) {
                setIsEditing(true);
            } else {
                setIsEditing(false);
            }
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

    const handleDeleteItem = (index) => {
        const newItems = formData.items.filter((_, i) => i !== index);
        setFormData(prev => ({
            ...prev,
            items: newItems
        }));
    };

    const handleAddItem = () => {
        setFormData(prev => ({
            ...prev,
            items: [...(prev.items || []), { name: '', price: 0, category: '' }]
        }));
    }

    const handleSave = async () => {
        setIsSaving(true);
        try {
            const user = auth.currentUser;
            if (!user) {
                alert("ログインが必要です。");
                return;
            }

            // Clean up: remove temporary flags
            const { isManualEntry, _tempId, id, ...dataToSave } = formData;
            const payload = {
                ...dataToSave,
                uid: user.uid,
                // Only update createdAt if it's new? Or keep original?
                // For updates, generally we don't change createdAt.
                // For new, we add it. 
                // dataToSave already has createdAt if it's an edit, but we might want updatedAt?
            };

            if (!payload.createdAt) {
                payload.createdAt = new Date().toISOString().split('T')[0]; // Simple YYYY-MM-DD for now or ISO string
                // Actually the current code used new Date() object which Firestore handles.
                // Let's stick to what was there or make it consistent.
                // Previous code: createdAt: new Date()
            }

            if (id) {
                // Update existing
                const docRef = doc(db, "expenses", id);
                // We don't want to overwrite uid or createsAt if not necessary, but spread handles it.
                // Ensure we don't accidentally create a new one.
                await updateDoc(docRef, payload);
                console.log("Document updated with ID: ", id);
                alert("更新しました！");
            } else {
                // Create new
                if (!payload.createdAt) payload.createdAt = new Date(); // As object
                const docRef = await addDoc(collection(db, "expenses"), payload);
                console.log("Document written with ID: ", docRef.id);
                alert("保存しました！");
            }

            setIsEditing(false);
            if (onSave) onSave();
        } catch (e) {
            console.error("Error adding/updating document: ", e);
            alert("保存に失敗しました。Firestoreの設定を確認してください。");
        } finally {
            setIsSaving(false);
        }
    };

    if (isEditing) {
        return (
            <div className="w-full max-w-md mx-auto mt-6 bg-white rounded-xl shadow-lg overflow-hidden border border-gray-100 p-4">
                <h3 className="text-lg font-bold mb-4 text-gray-800">{formData.id ? '支出を編集' : '内容を編集'}</h3>

                <div className="space-y-4">
                    <div>
                        <label className="block text-xs text-gray-500">店舗名</label>
                        <input
                            type="text"
                            value={formData.merchant || ''}
                            onChange={(e) => handleChange('merchant', e.target.value)}
                            className="w-full border rounded p-2 text-sm"
                            placeholder="例: スーパー〇〇"
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
                        <select
                            value={formData.category || ''}
                            onChange={(e) => handleChange('category', e.target.value)}
                            className="w-full border rounded p-2 text-sm"
                        >
                            <option value="">選択してください</option>
                            <option value="食費">食費</option>
                            <option value="日用品">日用品</option>
                            <option value="交通費">交通費</option>
                            <option value="医療費">医療費</option>
                            <option value="交際費">交際費</option>
                            <option value="娯楽費">娯楽費</option>
                            <option value="その他">その他</option>
                        </select>
                    </div>
                </div>

                <div className="mt-6">
                    <div className="flex justify-between items-center mb-2">
                        <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">明細</h4>
                        <button
                            type="button"
                            onClick={handleAddItem}
                            className="text-xs bg-blue-50 text-blue-600 px-2 py-1 rounded hover:bg-blue-100"
                        >
                            + 追加
                        </button>
                    </div>
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
                                <button
                                    onClick={() => handleDeleteItem(index)}
                                    className="text-gray-400 hover:text-red-500 pt-1"
                                >
                                    ×
                                </button>
                            </div>
                        ))}
                        {(!formData.items || formData.items.length === 0) && (
                            <p className="text-xs text-gray-400 text-center py-2">明細なし</p>
                        )}
                    </div>
                </div>

                <div className="mt-6 flex gap-3">
                    <button
                        onClick={handleSave}
                        disabled={isSaving}
                        className={`flex-1 bg-green-600 text-white py-2 rounded-lg font-semibold hover:bg-green-700 ${isSaving ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                        {isSaving ? '保存中...' : (formData.id ? '更新' : '保存')}
                    </button>
                    <button
                        onClick={() => {
                            if (formData.isManualEntry) {
                                if (onSave) onSave(); // Exit manual entry without saving
                            } else {
                                setIsEditing(false);
                                setFormData(data); // Revert
                            }
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
