import React, { useState, useEffect } from 'react';
import { collection, query, where, orderBy, getDocs, deleteDoc, doc, writeBatch } from "firebase/firestore";
import { db } from "../firebase";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

const Dashboard = () => {
    const [expenses, setExpenses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [viewMode, setViewMode] = useState('monthly'); // 'monthly' | 'yearly'
    const [currentMonth, setCurrentMonth] = useState(() => {
        const now = new Date();
        return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    });

    useEffect(() => {
        fetchData();
    }, [currentMonth, viewMode]);

    const fetchData = async () => {
        setLoading(true);
        try {
            let q;
            const [year, month] = currentMonth.split('-').map(Number);

            if (viewMode === 'monthly') {
                const startDate = `${currentMonth}-01`;
                const lastDay = new Date(year, month, 0).getDate();
                const endDate = `${currentMonth}-${lastDay}`;

                q = query(
                    collection(db, "expenses"),
                    where("date", ">=", startDate),
                    where("date", "<=", endDate),
                    orderBy("date", "desc")
                );
            } else {
                // Yearly view: Fetch all data for the year
                const startDate = `${year}-01-01`;
                const endDate = `${year}-12-31`;

                q = query(
                    collection(db, "expenses"),
                    where("date", ">=", startDate),
                    where("date", "<=", endDate),
                    orderBy("date", "desc")
                );
            }

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

    const handlePrev = () => {
        const [year, month] = currentMonth.split('-').map(Number);
        if (viewMode === 'monthly') {
            const newDate = new Date(year, month - 2, 1);
            setCurrentMonth(`${newDate.getFullYear()}-${String(newDate.getMonth() + 1).padStart(2, '0')}`);
        } else {
            setCurrentMonth(`${year - 1}-${String(month).padStart(2, '0')}`);
        }
    };

    const handleNext = () => {
        const [year, month] = currentMonth.split('-').map(Number);
        if (viewMode === 'monthly') {
            const newDate = new Date(year, month, 1);
            setCurrentMonth(`${newDate.getFullYear()}-${String(newDate.getMonth() + 1).padStart(2, '0')}`);
        } else {
            setCurrentMonth(`${year + 1}-${String(month).padStart(2, '0')}`);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("このデータを削除してもよろしいですか？")) return;

        try {
            await deleteDoc(doc(db, "expenses", id));
            setExpenses(prev => prev.filter(item => item.id !== id));
        } catch (error) {
            console.error("Error deleting document: ", error);
            alert("削除に失敗しました。");
        }
    };

    const handleDeleteAll = async () => {
        const confirmMsg = viewMode === 'monthly'
            ? `${currentMonth.split('-')[0]}年${currentMonth.split('-')[1]}月のデータを全て削除してもよろしいですか？`
            : `${currentMonth.split('-')[0]}年のデータを全て削除してもよろしいですか？`;

        if (!window.confirm(`${confirmMsg}（この操作は取り消せません）`)) return;

        try {
            const batch = writeBatch(db);
            // Delete visible expenses (which are already filtered by the query)
            expenses.forEach(item => {
                const docRef = doc(db, "expenses", item.id);
                batch.delete(docRef);
            });
            await batch.commit();
            setExpenses([]);
            alert("削除しました。");
        } catch (error) {
            console.error("Error deleting all documents: ", error);
            alert("一括削除に失敗しました。");
        }
    };

    if (loading && expenses.length === 0) {
        return <div className="text-center py-8">読み込み中...</div>;
    }

    // Calculate stats
    const totalAmount = expenses.reduce((sum, item) => sum + (Number(item.totalAmount) || 0), 0);

    // Prepare Chart Data
    let chartData = [];

    if (viewMode === 'monthly') {
        const categoryData = expenses.reduce((acc, item) => {
            const cat = item.category || 'その他';
            if (!acc[cat]) {
                acc[cat] = 0;
            }
            acc[cat] += (Number(item.totalAmount) || 0);
            return acc;
        }, {});

        chartData = Object.keys(categoryData).map(key => ({
            name: key,
            value: categoryData[key]
        }));
    } else {
        // Yearly: aggregate by month
        const monthlyData = Array(12).fill(0);
        expenses.forEach(item => {
            if (item.date) {
                const monthIndex = new Date(item.date).getMonth(); // 0-11
                monthlyData[monthIndex] += (Number(item.totalAmount) || 0);
            }
        });

        chartData = monthlyData.map((amount, index) => ({
            name: `${index + 1}月`,
            amount: amount
        }));
    }

    const currentYear = currentMonth.split('-')[0];
    const currentMonthNum = currentMonth.split('-')[1];

    return (
        <div className="w-full max-w-4xl mx-auto p-4 space-y-6">
            {/* Control Bar */}
            <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                {/* View Switcher */}
                <div className="flex bg-gray-100 p-1 rounded-lg">
                    <button
                        onClick={() => setViewMode('monthly')}
                        className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${viewMode === 'monthly' ? 'bg-white shadow text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        月次
                    </button>
                    <button
                        onClick={() => setViewMode('yearly')}
                        className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${viewMode === 'yearly' ? 'bg-white shadow text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        年次
                    </button>
                </div>

                {/* Navigation */}
                <div className="flex items-center space-x-4">
                    <button
                        onClick={handlePrev}
                        className="p-2 hover:bg-gray-100 rounded-full text-gray-600 transition-colors"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                    </button>
                    <h2 className="text-xl font-bold text-gray-800 w-32 text-center">
                        {viewMode === 'monthly' ? `${currentYear}年${currentMonthNum}月` : `${currentYear}年`}
                    </h2>
                    <button
                        onClick={handleNext}
                        className="p-2 hover:bg-gray-100 rounded-full text-gray-600 transition-colors"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                    </button>
                </div>
            </div>

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
            <div className={`grid grid-cols-1 ${viewMode === 'monthly' ? 'lg:grid-cols-2' : ''} gap-6`}>
                {/* Chart */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <h3 className="text-lg font-bold text-gray-800 mb-4">
                        {viewMode === 'monthly' ? 'カテゴリ別支出' : '月別支出推移'}
                    </h3>
                    <div className="h-64 w-full">
                        {loading ? (
                            <div className="h-full flex items-center justify-center text-gray-400">読み込み中...</div>
                        ) : chartData.length > 0 || (viewMode === 'yearly' && expenses.length > 0) ? (
                            <ResponsiveContainer width="100%" height="100%">
                                {viewMode === 'monthly' ? (
                                    <PieChart>
                                        <Pie
                                            data={chartData}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={60}
                                            outerRadius={80}
                                            paddingAngle={5}
                                            dataKey="value"
                                        >
                                            {chartData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <Tooltip formatter={(value) => `¥${value.toLocaleString()}`} />
                                        <Legend />
                                    </PieChart>
                                ) : (
                                    <BarChart data={chartData}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                        <XAxis dataKey="name" axisLine={false} tickLine={false} />
                                        <YAxis axisLine={false} tickLine={false} />
                                        <Tooltip formatter={(value) => `¥${value.toLocaleString()}`} cursor={{ fill: '#f3f4f6' }} />
                                        <Bar dataKey="amount" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                                    </BarChart>
                                )}
                            </ResponsiveContainer>
                        ) : (
                            <div className="h-full flex items-center justify-center text-gray-400">データがありません</div>
                        )}
                    </div>
                </div>

                {/* Recent List - Only shown in Monthly View for now to avoid clutter, or could be shown in Yearly too but might be too long. 
                    Let's hide it for yearly view as per plan adjustment to focus on chart, or list everything. 
                    The user asked for "Bar chart view", implying visual focus. 
                    Showing list for a whole year might be heavy. Let's keep it for Monthly only. 
                */}
                {viewMode === 'monthly' && (
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-bold text-gray-800">最近の支出</h3>
                            {expenses.length > 0 && (
                                <button
                                    onClick={handleDeleteAll}
                                    className="text-xs text-red-500 hover:text-red-700 font-medium px-2 py-1 hover:bg-red-50 rounded"
                                >
                                    今月のデータを全て削除
                                </button>
                            )}
                        </div>
                        <div className="space-y-4 max-h-64 overflow-y-auto pr-2 flex-grow">
                            {loading ? (
                                <div className="text-center py-4 text-gray-400">読み込み中...</div>
                            ) : (
                                <>
                                    {expenses.map((expense) => (
                                        <div key={expense.id} className="flex justify-between items-center py-2 border-b last:border-0 border-gray-50 group">
                                            <div>
                                                <div className="font-semibold text-sm text-gray-800">{expense.merchant}</div>
                                                <div className="text-xs text-gray-400">{expense.date} • {expense.category}</div>
                                            </div>
                                            <div className="flex items-center space-x-3">
                                                <div className="font-bold text-gray-700">¥{Number(expense.totalAmount).toLocaleString()}</div>
                                                <button
                                                    onClick={() => handleDelete(expense.id)}
                                                    className="text-gray-300 hover:text-red-500 p-1 rounded-full transition-colors"
                                                    title="削除"
                                                >
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                    </svg>
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                    {expenses.length === 0 && (
                                        <p className="text-center text-gray-400 text-sm">データがありません</p>
                                    )}
                                </>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Dashboard;
