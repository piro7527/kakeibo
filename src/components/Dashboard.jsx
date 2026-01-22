import React, { useState, useEffect } from 'react';
import { collection, query, orderBy, getDocs } from "firebase/firestore";
import { db } from "../firebase";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

const Dashboard = () => {
    const [expenses, setExpenses] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const q = query(collection(db, "expenses"), orderBy("date", "desc"));
                const querySnapshot = await getDocs(q);
                const data = querySnapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));
                setExpenses(data);
            } catch (error) {
                console.error("Error fetching documents: ", error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    if (loading) {
        return <div className="text-center py-8">読み込み中...</div>;
    }

    // Calculate stats
    const totalAmount = expenses.reduce((sum, item) => sum + (Number(item.totalAmount) || 0), 0);

    // Group by category
    const categoryData = expenses.reduce((acc, item) => {
        const cat = item.category || 'その他';
        if (!acc[cat]) {
            acc[cat] = 0;
        }
        acc[cat] += (Number(item.totalAmount) || 0);
        return acc;
    }, {});

    const pieData = Object.keys(categoryData).map(key => ({
        name: key,
        value: categoryData[key]
    }));

    return (
        <div className="w-full max-w-4xl mx-auto p-4 space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <h3 className="text-gray-500 text-sm font-medium">支出合計</h3>
                    <p className="text-3xl font-bold text-gray-800 mt-2">¥{totalAmount.toLocaleString()}</p>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <h3 className="text-gray-500 text-sm font-medium">登録数</h3>
                    <p className="text-3xl font-bold text-gray-800 mt-2">{expenses.length} 件</p>
                </div>
            </div>

            {/* Charts & Recent List */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Chart */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <h3 className="text-lg font-bold text-gray-800 mb-4">カテゴリ別支出</h3>
                    <div className="h-64 w-full">
                        {pieData.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={pieData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={80}
                                        paddingAngle={5}
                                        dataKey="value"
                                    >
                                        {pieData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip formatter={(value) => `¥${value.toLocaleString()}`} />
                                    <Legend />
                                </PieChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="h-full flex items-center justify-center text-gray-400">データがありません</div>
                        )}
                    </div>
                </div>

                {/* Recent List */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <h3 className="text-lg font-bold text-gray-800 mb-4">最近の支出</h3>
                    <div className="space-y-4 max-h-64 overflow-y-auto pr-2">
                        {expenses.map((expense) => (
                            <div key={expense.id} className="flex justify-between items-center py-2 border-b last:border-0 border-gray-50">
                                <div>
                                    <div className="font-semibold text-sm text-gray-800">{expense.merchant}</div>
                                    <div className="text-xs text-gray-400">{expense.date} • {expense.category}</div>
                                </div>
                                <div className="font-bold text-gray-700">¥{Number(expense.totalAmount).toLocaleString()}</div>
                            </div>
                        ))}
                        {expenses.length === 0 && (
                            <p className="text-center text-gray-400 text-sm">データがありません</p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
