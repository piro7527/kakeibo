import React, { useState, useEffect } from 'react';
import { collection, query, where, orderBy, getDocs, deleteDoc, doc, writeBatch } from "firebase/firestore";
import { db, auth } from "../firebase";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658', '#ff6b6b', '#a29bfe', '#fd79a8', '#00b894', '#e17055', '#74b9ff', '#55efc4', '#fdcb6e', '#636e72', '#b2bec3', '#dfe6e9'];

const Dashboard = ({ onEdit }) => {
    const [expenses, setExpenses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [viewMode, setViewMode] = useState('monthly'); // 'monthly' | 'yearly'
    const [showAllExpenses, setShowAllExpenses] = useState(false);
    const [currentMonth, setCurrentMonth] = useState(() => {
        const now = new Date();
        return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    });
    const [showCsvPanel, setShowCsvPanel] = useState(false);
    const [csvStartDate, setCsvStartDate] = useState('');
    const [csvEndDate, setCsvEndDate] = useState('');
    const [csvLoading, setCsvLoading] = useState(false);
    const [excelLoading, setExcelLoading] = useState(false);

    useEffect(() => {
        fetchData();
    }, [currentMonth, viewMode]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const user = auth.currentUser;
            if (!user) {
                setExpenses([]);
                setLoading(false);
                return;
            }

            let q;
            const [year, month] = currentMonth.split('-').map(Number);

            if (viewMode === 'monthly') {
                const startDate = `${currentMonth}-01`;
                const lastDay = new Date(year, month, 0).getDate();
                const endDate = `${currentMonth}-${lastDay}`;

                q = query(
                    collection(db, "expenses"),
                    where("uid", "==", user.uid),
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
                    where("uid", "==", user.uid),
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

    const drawPieChart = (categoryData, grandTotal) => {
        return new Promise((resolve) => {
            const canvas = document.createElement('canvas');
            canvas.width = 560;
            canvas.height = 400;
            const ctx = canvas.getContext('2d');

            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            ctx.fillStyle = '#1f2937';
            ctx.font = 'bold 18px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('カテゴリ別支出', 180, 28);

            const colors = ['#0088FE','#00C49F','#FFBB28','#FF8042','#8884d8','#82ca9d','#ffc658','#ff6b6b','#a29bfe','#fd79a8','#00b894','#e17055','#74b9ff','#55efc4','#fdcb6e','#636e72'];
            const cx = 175, cy = 215, radius = 155;
            let startAngle = -Math.PI / 2;

            categoryData.forEach(([, amount], i) => {
                const slice = grandTotal > 0 ? (amount / grandTotal) * 2 * Math.PI : 0;
                ctx.beginPath();
                ctx.moveTo(cx, cy);
                ctx.arc(cx, cy, radius, startAngle, startAngle + slice);
                ctx.closePath();
                ctx.fillStyle = colors[i % colors.length];
                ctx.fill();
                ctx.strokeStyle = '#ffffff';
                ctx.lineWidth = 2;
                ctx.stroke();
                startAngle += slice;
            });

            let legendY = 36;
            ctx.font = '13px sans-serif';
            categoryData.forEach(([cat, amount], i) => {
                const ratio = grandTotal > 0 ? ((amount / grandTotal) * 100).toFixed(1) : '0.0';
                ctx.fillStyle = colors[i % colors.length];
                ctx.fillRect(370, legendY - 11, 14, 14);
                ctx.fillStyle = '#374151';
                ctx.textAlign = 'left';
                ctx.fillText(`${cat}  ${ratio}%`, 392, legendY);
                legendY += 24;
            });

            resolve(canvas.toDataURL('image/png').split(',')[1]);
        });
    };

    const handleDownloadExcel = async () => {
        if (!csvStartDate || !csvEndDate) {
            alert('開始日と終了日を入力してください。');
            return;
        }
        if (csvStartDate > csvEndDate) {
            alert('開始日は終了日より前の日付を指定してください。');
            return;
        }

        setExcelLoading(true);
        try {
            const user = auth.currentUser;
            if (!user) return;

            const q = query(
                collection(db, "expenses"),
                where("uid", "==", user.uid),
                where("date", ">=", csvStartDate),
                where("date", "<=", csvEndDate),
                orderBy("date", "desc")
            );
            const querySnapshot = await getDocs(q);
            const data = querySnapshot.docs
                .map(doc => ({ id: doc.id, ...doc.data() }))
                .sort((a, b) => {
                    const catCmp = (a.category || 'その他').localeCompare(b.category || 'その他', 'ja');
                    return catCmp !== 0 ? catCmp : a.date.localeCompare(b.date);
                });

            if (data.length === 0) {
                alert('指定期間のデータが見つかりませんでした。');
                return;
            }

            const categoryTotals = {};
            data.forEach(item => {
                const cat = item.category || 'その他';
                categoryTotals[cat] = (categoryTotals[cat] || 0) + (Number(item.totalAmount) || 0);
            });
            const categoryData = Object.entries(categoryTotals).sort((a, b) => b[1] - a[1]);
            const grandTotal = categoryData.reduce((sum, [, v]) => sum + v, 0);

            const { default: ExcelJS } = await import('exceljs');
            const workbook = new ExcelJS.Workbook();

            // --- Sheet 1: 明細 ---
            const detailSheet = workbook.addWorksheet('明細');
            detailSheet.columns = [
                { header: '日付', key: 'date', width: 14 },
                { header: '店舗名', key: 'merchant', width: 22 },
                { header: 'カテゴリ', key: 'category', width: 16 },
                { header: '金額（円）', key: 'amount', width: 14 },
                { header: '品目', key: 'items', width: 45 },
            ];
            const headerFill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF3B82F6' } };
            const headerFont = { bold: true, color: { argb: 'FFFFFFFF' } };
            detailSheet.getRow(1).eachCell(cell => {
                cell.fill = headerFill;
                cell.font = headerFont;
                cell.alignment = { vertical: 'middle', horizontal: 'center' };
                cell.border = { bottom: { style: 'thin', color: { argb: 'FFBFDBFE' } } };
            });

            let currentCat = null;
            let catStartRow = 2;
            let rowNum = 2;

            const addSubtotal = (catName, fromRow, toRow) => {
                const sr = detailSheet.addRow(['', '', `${catName} 小計`, { formula: `SUM(D${fromRow}:D${toRow})` }, '']);
                sr.eachCell((cell, col) => {
                    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFDBEAFE' } };
                    cell.font = { bold: true, color: { argb: 'FF1D4ED8' } };
                    if (col === 4) cell.numFmt = '#,##0';
                });
            };

            for (const item of data) {
                const cat = item.category || 'その他';
                if (cat !== currentCat) {
                    if (currentCat !== null) {
                        addSubtotal(currentCat, catStartRow, rowNum - 1);
                        rowNum++;
                    }
                    currentCat = cat;
                    catStartRow = rowNum;
                }
                const itemsStr = (item.items || []).map(i => `${i.name}(¥${i.price})`).join(', ');
                const row = detailSheet.addRow([item.date, item.merchant || '', cat, Number(item.totalAmount) || 0, itemsStr]);
                row.getCell(4).numFmt = '#,##0';
                row.eachCell(cell => { cell.alignment = { vertical: 'middle' }; });
                rowNum++;
            }
            if (currentCat !== null) {
                addSubtotal(currentCat, catStartRow, rowNum - 1);
                rowNum++;
            }
            const totalRow = detailSheet.addRow(['', '', '合計', grandTotal, '']);
            totalRow.eachCell((cell, col) => {
                cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1D4ED8' } };
                cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
                if (col === 4) cell.numFmt = '#,##0';
            });

            // --- Sheet 2: カテゴリ集計 ---
            const summarySheet = workbook.addWorksheet('カテゴリ集計');
            summarySheet.columns = [
                { header: 'カテゴリ', key: 'cat', width: 18 },
                { header: '合計金額（円）', key: 'amount', width: 16 },
                { header: '割合', key: 'ratio', width: 10 },
            ];
            summarySheet.getRow(1).eachCell(cell => {
                cell.fill = headerFill;
                cell.font = headerFont;
                cell.alignment = { vertical: 'middle', horizontal: 'center' };
            });
            categoryData.forEach(([cat, amount]) => {
                const row = summarySheet.addRow([cat, amount, grandTotal > 0 ? amount / grandTotal : 0]);
                row.getCell(2).numFmt = '#,##0';
                row.getCell(3).numFmt = '0.0%';
            });
            const sTotalRow = summarySheet.addRow(['合計', grandTotal, 1]);
            sTotalRow.eachCell((cell, col) => {
                cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1D4ED8' } };
                cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
                if (col === 2) cell.numFmt = '#,##0';
                if (col === 3) cell.numFmt = '0.0%';
            });

            // 円グラフ画像を埋め込む
            const chartPng = await drawPieChart(categoryData, grandTotal);
            const imageId = workbook.addImage({ base64: chartPng, extension: 'png' });
            summarySheet.addImage(imageId, { tl: { col: 4, row: 0 }, ext: { width: 560, height: 400 } });

            // ダウンロード
            const buffer = await workbook.xlsx.writeBuffer();
            const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `kakeibo_${csvStartDate}_${csvEndDate}.xlsx`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Excel download error:', error);
            alert('ダウンロードに失敗しました。');
        } finally {
            setExcelLoading(false);
        }
    };

    const handleDownloadCSV = async () => {
        if (!csvStartDate || !csvEndDate) {
            alert('開始日と終了日を入力してください。');
            return;
        }
        if (csvStartDate > csvEndDate) {
            alert('開始日は終了日より前の日付を指定してください。');
            return;
        }

        setCsvLoading(true);
        try {
            const user = auth.currentUser;
            if (!user) return;

            const q = query(
                collection(db, "expenses"),
                where("uid", "==", user.uid),
                where("date", ">=", csvStartDate),
                where("date", "<=", csvEndDate),
                orderBy("date", "desc")
            );

            const querySnapshot = await getDocs(q);
            const data = querySnapshot.docs
                .map(doc => ({ id: doc.id, ...doc.data() }))
                .sort((a, b) => a.date.localeCompare(b.date));

            if (data.length === 0) {
                alert('指定期間のデータが見つかりませんでした。');
                return;
            }

            const headers = ['日付', '店舗名', 'カテゴリ', '合計金額（円）', '品目'];
            const rows = data.map(item => {
                const itemsStr = (item.items || []).map(i => `${i.name}(¥${i.price})`).join('|');
                return [
                    item.date,
                    `"${(item.merchant || '').replace(/"/g, '""')}"`,
                    `"${(item.category || '').replace(/"/g, '""')}"`,
                    item.totalAmount || 0,
                    `"${itemsStr.replace(/"/g, '""')}"`
                ].join(',');
            });

            const csvContent = '\uFEFF' + [headers.join(','), ...rows].join('\n');
            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `kakeibo_${csvStartDate}_${csvEndDate}.csv`;
            a.click();
            URL.revokeObjectURL(url);
        } catch (error) {
            console.error('CSV download error:', error);
            alert('ダウンロードに失敗しました。');
        } finally {
            setCsvLoading(false);
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

            {/* CSV Download */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100">
                <button
                    onClick={() => setShowCsvPanel(prev => !prev)}
                    className="w-full flex items-center justify-between px-5 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-xl transition-colors"
                >
                    <div className="flex items-center gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                        CSVダウンロード
                    </div>
                    <svg xmlns="http://www.w3.org/2000/svg" className={`h-4 w-4 text-gray-400 transition-transform ${showCsvPanel ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                </button>
                {showCsvPanel && (
                    <div className="px-5 pb-4 border-t border-gray-100 pt-4">
                        <div className="flex flex-col sm:flex-row items-end gap-3">
                            <div className="flex flex-col gap-1 w-full sm:w-auto">
                                <label className="text-xs text-gray-500 font-medium">開始日</label>
                                <input
                                    type="date"
                                    value={csvStartDate}
                                    onChange={e => setCsvStartDate(e.target.value)}
                                    className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
                                />
                            </div>
                            <div className="flex flex-col gap-1 w-full sm:w-auto">
                                <label className="text-xs text-gray-500 font-medium">終了日</label>
                                <input
                                    type="date"
                                    value={csvEndDate}
                                    onChange={e => setCsvEndDate(e.target.value)}
                                    className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
                                />
                            </div>
                        </div>
                        <div className="flex gap-2 mt-3">
                            <button
                                onClick={handleDownloadExcel}
                                disabled={excelLoading}
                                className="flex-1 flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-300 text-white font-medium text-sm px-4 py-2 rounded-lg transition-colors"
                            >
                                {excelLoading ? (
                                    <>
                                        <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                        </svg>
                                        生成中...
                                    </>
                                ) : (
                                    <>
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                        </svg>
                                        Excelダウンロード（円グラフ付き）
                                    </>
                                )}
                            </button>
                            <button
                                onClick={handleDownloadCSV}
                                disabled={csvLoading}
                                className="flex items-center justify-center gap-1 bg-gray-100 hover:bg-gray-200 disabled:bg-gray-50 text-gray-600 font-medium text-sm px-4 py-2 rounded-lg transition-colors"
                            >
                                {csvLoading ? '処理中...' : 'CSV'}
                            </button>
                        </div>
                        <p className="text-xs text-gray-400 mt-2">Excelはカテゴリ別ソート・小計・円グラフ付き。CSVはシンプルな一覧形式。</p>
                    </div>
                )}
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
                            <div className="flex items-center gap-2">
                                {expenses.length > 5 && (
                                    <button
                                        onClick={() => setShowAllExpenses(prev => !prev)}
                                        className="text-xs text-blue-600 hover:text-blue-800 font-medium px-2 py-1 hover:bg-blue-50 rounded transition-colors"
                                    >
                                        {showAllExpenses ? '折りたたむ' : `全て見る (${expenses.length}件)`}
                                    </button>
                                )}
                                {expenses.length > 0 && (
                                    <button
                                        onClick={handleDeleteAll}
                                        className="text-xs text-red-500 hover:text-red-700 font-medium px-2 py-1 hover:bg-red-50 rounded"
                                    >
                                        今月のデータを全て削除
                                    </button>
                                )}
                            </div>
                        </div>
                        <div className={`space-y-4 pr-2 flex-grow overflow-y-auto transition-all ${showAllExpenses ? 'max-h-[600px]' : 'max-h-64'}`}>
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
                                                    onClick={() => onEdit(expense)}
                                                    className="text-gray-300 hover:text-blue-500 p-1 rounded-full transition-colors"
                                                    title="編集"
                                                >
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                    </svg>
                                                </button>
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
