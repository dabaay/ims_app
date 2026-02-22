import React, { useState, useRef } from 'react';
import api from '../api/axios';
import { useSettings } from '../context/SettingsContextDef';
import { useAuth } from '../context/AuthContext';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import * as XLSX from 'xlsx';
import { TrendingUp, Package, Users, AlertTriangle, DollarSign, Activity, FileDown } from 'lucide-react';

const FinancialReportsPage = () => {
    const { settings } = useSettings();
    const { user } = useAuth();
    const [reportType, setReportType] = useState(''); // Default to placeholder
    const [period, setPeriod] = useState('monthly');
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [reportData, setReportData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [downloading, setDownloading] = useState(false);
    const reportRef = useRef(null);

    // Sync with URL params (for dashboard links)
    React.useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const type = params.get('type');
        if (type) setReportType(type);
    }, []);

    const handleReset = () => {
        setReportType('');
        setPeriod('monthly');
        setDate(new Date().toISOString().split('T')[0]);
        setReportData(null);
        window.history.replaceState({}, '', window.location.pathname);
    };

    const generateReport = React.useCallback(async () => {
        if (!reportType) return;
        setLoading(true);
        try {
            const response = await api.get(`/reports/financial/${reportType}`, {
                params: { period, date, start_date: date } // Pass date as start_date for comprehensive
            });
            setReportData(response.data);
        } catch (error) {
            console.error("Error generating report:", error);
            alert("Failed to generate report");
        } finally {
            setLoading(false);
        }
    }, [reportType, period, date]);

    // Trigger auto-generation on change
    React.useEffect(() => {
        const timer = setTimeout(() => {
            if (reportType && date) {
                generateReport();
            }
        }, 100);
        return () => clearTimeout(timer);
    }, [reportType, period, date, generateReport]);

    const handleDownloadPDF = async () => {
        const element = document.getElementById('report-content');
        if (!element || !reportData || loading) return;
        setDownloading(true);

        try {
            // Give time for any animations/renders to settle
            await new Promise(r => setTimeout(r, 1200));

            const canvas = await html2canvas(element, {
                scale: 2,
                useCORS: true,
                backgroundColor: '#ffffff',
                logging: false,
                windowWidth: 1200,
                onclone: (doc) => {
                    const clone = doc.getElementById('report-content');
                    if (!clone) return;

                    // 1. Force high-level visibility
                    clone.style.visibility = 'visible';
                    clone.style.background = 'white';
                    clone.style.padding = '40px'; 
                    clone.style.height = 'auto';
                    clone.style.minHeight = 'auto';
                    clone.style.boxShadow = 'none';
                    clone.style.borderRadius = '0';

                    // 2. Inject a Global Sanitization Stylesheet
                    const styleBlock = doc.createElement('style');
                    styleBlock.innerHTML = `
                        * {
                            transition: none !important;
                            animation: none !important;
                            box-shadow: none !important;
                            text-shadow: none !important;
                            filter: none !important;
                        }
                        /* Fallback oklab/oklch variables to hex */
                        :root {
                            --color-navy-blue: #000080 !important;
                            --color-blue-600: #2563eb !important;
                        }
                        /* Important: ensure spacers don't have backgrounds */
                        .pdf-spacer { background: transparent !important; border: none !important; }
                    `;
                    doc.head.appendChild(styleBlock);

                    // 3. Virtual Page Alignment (The "Separator" Fix)
                    // A4 Ratio is 1.414. For 1200px width, height is ~1697px
                    const virtualPageHeight = 1697; 
                    const breakElements = Array.from(clone.querySelectorAll('.print-break-before'));
                    
                    let cumulativeShift = 0;
                    breakElements.forEach(el => {
                        // Use offsetTop to get position relative to the report-content container
                        let offsetTop = 0;
                        let curr = el;
                        while (curr && curr !== clone) {
                            offsetTop += curr.offsetTop;
                            curr = curr.offsetParent;
                        }
                        
                        // Account for spacers added so far
                        const actualY = offsetTop + cumulativeShift;
                        const positionInPage = actualY % virtualPageHeight;
                        const remainingSpace = virtualPageHeight - positionInPage;

                        // If we aren't already at the top of a page (15px threshold)
                        if (positionInPage > 15) { 
                            const spacer = doc.createElement('div');
                            spacer.className = 'pdf-spacer';
                            spacer.style.height = `${remainingSpace}px`;
                            el.parentNode.insertBefore(spacer, el);
                            cumulativeShift += remainingSpace;
                        }
                    });

                    // 4. Recursive DOM Style Sanitization
                    const sanitizeNode = (el) => {
                        if (el.nodeType !== 1) return;
                        
                        const win = doc.defaultView || window;
                        const style = win.getComputedStyle(el);
                        
                        const bgImg = style.getPropertyValue('background-image');
                        if (bgImg && (bgImg.includes('oklch') || bgImg.includes('oklab'))) {
                            el.style.setProperty('background-image', 'none', 'important');
                        }

                        ['color', 'background-color', 'border-color', 'fill', 'stroke'].forEach(prop => {
                            const val = style.getPropertyValue(prop);
                            if (val && (val.includes('oklch') || val.includes('oklab'))) {
                                let safeColor = '#1e293b'; 
                                if (prop === 'background-color') safeColor = '#ffffff';

                                if (el.classList.contains('text-green-400') || el.classList.contains('text-green-600') || el.classList.contains('text-green-700')) {
                                    safeColor = '#10b981'; 
                                } else if (el.classList.contains('text-rose-400') || el.classList.contains('text-rose-600') || el.classList.contains('text-rose-800')) {
                                    safeColor = '#f43f5e'; 
                                } else if (el.classList.contains('bg-navy-blue') || el.closest('.bg-navy-blue')) {
                                    safeColor = prop === 'color' ? '#ffffff' : '#000080';
                                } else if (el.classList.contains('text-navy-blue')) {
                                    safeColor = '#000080';
                                } else if (el.classList.contains('bg-emerald-900')) {
                                    safeColor = '#064e3b';
                                } else if (el.classList.contains('bg-rose-900')) {
                                    safeColor = '#4c0519';
                                }

                                el.style.setProperty(prop, safeColor, 'important');
                            }
                        });

                        el.childNodes.forEach(sanitizeNode);
                    };

                    sanitizeNode(clone);
                }
            });

            if (!canvas) throw new Error("Could not capture report content");

            const imgWidth = 210; // A4 width in mm
            const pageHeight = 297; // A4 height in mm
            const imgHeight = (canvas.height * imgWidth) / canvas.width;
            let heightLeft = imgHeight;
            const pdf = new jsPDF('p', 'mm', 'a4');
            let position = 0;

            const imgData = canvas.toDataURL('image/png', 1.0);

            // Add first page
            pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight, undefined, 'FAST');
            heightLeft -= pageHeight;

            // Add subsequent pages if content overflows
            while (heightLeft > 0) {
                position = heightLeft - imgHeight;
                pdf.addPage();
                pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight, undefined, 'FAST');
                heightLeft -= pageHeight;
            }
            
            pdf.save(`SoMali_Office_${reportType.toUpperCase()}_${date}.pdf`);
        } catch (error) {
            console.error("PDF Final Error:", error);
            alert(`Digital Export Error: ${error.message || 'Unknown technical limitation'}. \n\nPlease refresh the page and try again if this persists.`);
        } finally {
            setDownloading(false);
        }
    };

    const handleDownloadExcel = () => {
        if (!reportData) return;
        
        const wb = XLSX.utils.book_new();
        
        // Financials Sheet
        if (reportData.financials) {
            const financials = Object.entries(reportData.financials).map(([k, v]) => ({ Metric: k.replace(/_/g, ' ').toUpperCase(), Value: v }));
            const wsFin = XLSX.utils.json_to_sheet(financials);
            XLSX.utils.book_append_sheet(wb, wsFin, "Executive Summary");
        }

        // Hotspots
        if (reportData.expense_hotspots) {
            const wsExp = XLSX.utils.json_to_sheet(reportData.expense_hotspots);
            XLSX.utils.book_append_sheet(wb, wsExp, "Expenses");
        }

        // Top Revenue
        if (reportData.top_revenue_items) {
            const wsRev = XLSX.utils.json_to_sheet(reportData.top_revenue_items);
            XLSX.utils.book_append_sheet(wb, wsRev, "Top Earners");
        }

        // Debts
        if (reportData.debts) {
            const wsDebt = XLSX.utils.json_to_sheet(reportData.debts);
            XLSX.utils.book_append_sheet(wb, wsDebt, "Outstanding Debts");
        }

        XLSX.writeFile(wb, `Executive_Report_${date}.xlsx`);
    };

    const handleDownloadWord = () => {
        const content = document.getElementById('report-content');
        if (!content) return;
        
        const header = `<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
                        <head><meta charset='utf-8'><title>Executive Report</title>
                        <style>
                            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; }
                            table { border-collapse: collapse; width: 100%; border: 1px solid #000080; }
                            th, td { border: 1px solid #000080; padding: 8px; text-align: left; }
                            .navy { color: #000080; font-weight: bold; }
                            .green { color: #10b981; }
                            .red { color: #f43f5e; }
                        </style>
                        </head><body>`;
        const footer = "</body></html>";
        const sourceLayout = header + content.innerHTML + footer;
        
        const source = 'data:application/vnd.ms-word;charset=utf-8,' + encodeURIComponent(sourceLayout);
        const fileDownload = document.createElement("a");
        document.body.appendChild(fileDownload);
        fileDownload.href = source;
        fileDownload.download = `Executive_Report_${date}.doc`;
        fileDownload.click();
        document.body.removeChild(fileDownload);
    };



    const ReportHeader = () => (
        <div className="flex flex-col items-center border-b-2 border-navy-blue pb-8 mb-10 text-navy-blue text-center w-full">
            <div className="mb-4">
                <div className="w-24 h-24 bg-white text-navy-blue rounded-2xl flex items-center justify-center font-black text-4xl overflow-hidden shadow-xl border-2 border-navy-blue/10 mx-auto">
                    {settings.store_logo ? (
                        <img 
                            src={`http://localhost:8000/storage/${settings.store_logo}`} 
                            alt="Store Logo" 
                            className="w-full h-full object-contain p-2" 
                            onError={(e) => {
                                e.target.style.display = 'none';
                                e.target.parentElement.innerText = settings.store_name?.[0] || 'S';
                            }}
                        />
                    ) : (
                        settings.store_name?.[0] || 'S'
                    )}
                </div>
            </div>
            <div className="space-y-1">
                <h1 className="text-3xl font-black uppercase tracking-tight">{settings.store_name}</h1>
                <p className="text-sm font-bold opacity-80 uppercase tracking-widest">{settings.store_address || 'Mogadishu, Somalia'}</p>
                <div className="flex items-center justify-center space-x-4 mt-2">
                    <p className="text-sm font-bold bg-navy-blue text-white px-3 py-1 rounded-full uppercase tracking-widest">TEL: {settings.store_number || '+252 xxx xxx xxx'}</p>
                    <div className="bg-navy-blue/10 text-navy-blue px-3 py-1 rounded-full font-black text-xs uppercase tracking-tighter">
                        REP: {reportType.toUpperCase().replace('-', ' ')}
                    </div>
                </div>
            </div>
        </div>
    );

    const ReportFooter = () => (
        <div className="mt-12 pt-6 border-t border-navy-blue/20 text-navy-blue flex justify-between items-end text-xs font-bold uppercase tracking-wider">
            <div>
                <p>PUBLISHED BY {settings.store_name}</p>
                <p className="opacity-60">OFFICIAL FINANCIAL RECORD</p>
            </div>
            <div className="text-center">
                <p>PAGE 1 OF 1</p>
            </div>
            <div className="text-right">
                <p>GENERATED ON {new Date().toLocaleDateString()}</p>
                <p className="opacity-60">BY {user?.full_name || user?.username}</p>
            </div>
        </div>
    );

    const renderReportContent = () => {
        if (!reportData || typeof reportData !== 'object') {
            return (
                <div className="flex flex-col items-center justify-center py-32 text-slate-400">
                    <TrendingUp size={48} className="mb-4 opacity-10 animate-pulse" />
                    <p className="font-bold uppercase tracking-widest text-xs">Awaiting Ledger Parameters...</p>
                </div>
            );
        }

        if (reportType === 'income-statement') {
            const periods = Object.keys(reportData);
            return (
                <div ref={reportRef} className="bg-white p-12 shadow-2xl min-h-screen text-navy-blue">
                    <ReportHeader />

                    <div className="text-center mb-10 pb-4">
                        <h2 className="text-4xl font-black uppercase tracking-extra-wide mb-2">Income Statement</h2>
                        <p className="text-navy-blue/60 font-bold uppercase tracking-widest">Comprehensive Profit & Loss Analysis</p>
                    </div>
                    
                    <div className="grid grid-cols-1 gap-12 max-w-5xl mx-auto">
                        {periods.map((periodLabel, idx) => {
                            const data = reportData[periodLabel];
                             const totalRevenue = parseFloat(data.revenue || 0);
                             const cogs = parseFloat(data.cogs || 0);
                             const grossProfit = totalRevenue - cogs;
                             const totalExpenses = parseFloat(data.total_expenses || 0);
                             const netProfit = grossProfit - totalExpenses;

                            return (
                                <div key={periodLabel} className={`bg-white border-2 border-navy-blue/10 rounded-2xl overflow-hidden shadow-sm print-break-inside-avoid ${idx > 0 ? 'print-break-before' : ''}`}>
                                    <div className="bg-navy-blue text-white p-4 text-center font-black text-xl uppercase tracking-widest">
                                        {periodLabel}
                                    </div>
                                    
                                    <div className="p-8 space-y-6">
                                        <div className="flex justify-between items-center bg-navy-blue/5 p-4 rounded-xl">
                                            <span className="font-black text-lg uppercase tracking-wide">Gross Sales Revenue</span>
                                            <span className="text-2xl font-black">${totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                                        </div>

                                        <div className="space-y-4 px-4">
                                            <div className="flex justify-between items-center border-b border-navy-blue/10 pb-2">
                                                <span className="font-bold opacity-70 uppercase text-sm italic">Less: Cost of Goods Sold (COGS)</span>
                                                <span className="font-black text-red-600">(${cogs.toLocaleString(undefined, { minimumFractionDigits: 2 })})</span>
                                            </div>

                                            <div className="flex justify-between items-center bg-navy-blue text-white py-3 px-6 rounded-xl shadow-lg ring-4 ring-navy-blue/10">
                                                <span className="font-black text-xl uppercase tracking-tighter">Gross Profit Margin</span>
                                                <span className="text-2xl font-black">${grossProfit.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                                            </div>
                                        </div>

                                        <div className="pt-6 px-4">
                                            <div className="flex items-center space-x-2 mb-4 border-b-2 border-navy-blue/20 pb-2">
                                                <div className="w-2 h-2 bg-navy-blue rounded-full"></div>
                                                <p className="font-black text-navy-blue uppercase text-sm tracking-widest">Operating Expenditure Breakdown</p>
                                            </div>
                                            
                                            <div className="space-y-3">
                                                {data.expenses && data.expenses.map((exp, idx) => (
                                                     <div key={idx} className="flex justify-between items-center text-sm font-bold py-1 hover:bg-navy-blue/5 rounded px-2 transition-colors">
                                                        <span className="capitalize opacity-70">{exp.expense_category}</span>
                                                        <span className="font-black">${parseFloat(exp.total).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                                                    </div>
                                                ))}
                                            </div>

                                            <div className="flex justify-between items-center mt-6 pt-4 border-t-2 border-navy-blue/20 font-black">
                                                <span className="uppercase text-sm tracking-wide">Total Operating Expenses</span>
                                                <span className="text-lg underline decoration-4 underline-offset-4">${totalExpenses.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                                            </div>
                                        </div>

                                        <div className="pt-10 flex flex-col items-center">
                                            <div className="w-full bg-navy-blue text-white rounded-3xl p-8 flex justify-between items-center shadow-2xl relative overflow-hidden group">
                                                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 transition-transform group-hover:scale-110"></div>
                                                <div className="relative z-10">
                                                    <p className="text-[10px] font-black uppercase tracking-[0.3em] opacity-60 mb-2">Final Fiscal Result</p>
                                                    <h4 className="text-3xl font-black uppercase tracking-tighter">Net Profit / Loss</h4>
                                                </div>
                                                <div className="relative z-10 text-right">
                                                    <span className={`text-5xl font-black ${netProfit >= 0 ? "text-green-400" : "text-rose-400"}`}>
                                                        {netProfit >= 0 ? '' : '-'}${Math.abs(netProfit).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    <ReportFooter />
                </div>
            );
        }

        if (reportType === 'balance-sheet') {
             const { assets = {}, liabilities = {}, equity = {}, as_of = '' } = reportData;
             return (
                <div ref={reportRef} className="bg-white p-12 shadow-2xl min-h-screen text-navy-blue">
                    <ReportHeader />

                    <div className="text-center mb-10 pb-4">
                        <h2 className="text-4xl font-black uppercase tracking-extra-wide mb-2">Balance Sheet</h2>
                        <p className="text-navy-blue/60 font-bold uppercase tracking-widest text-sm">Financial Position Statement As Of {new Date(as_of).toLocaleDateString()}</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-12 max-w-6xl mx-auto items-start">
                        {/* ASSETS */}
                        <div className="bg-white border-2 border-navy-blue/10 rounded-2xl overflow-hidden shadow-sm print-break-inside-avoid">
                            <h3 className="text-xl font-black bg-navy-blue text-white p-4 text-center uppercase tracking-widest">Assets (Hanti)</h3>
                            
                            <div className="p-8 space-y-8">
                                <div className="space-y-4">
                                    <div className="flex items-center space-x-2 border-b-2 border-navy-blue/20 pb-1">
                                        <div className="w-2 h-2 bg-navy-blue rounded-full"></div>
                                        <p className="font-black text-navy-blue uppercase text-xs tracking-widest">Current Assets</p>
                                    </div>
                                    <div className="space-y-2 px-4">
                                        <div className="flex justify-between font-bold text-sm">
                                            <span className="opacity-70 italic">Cash & Bank Equivalents</span>
                                            <span className="font-black">${parseFloat(assets.cash || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                                        </div>
                                        <div className="flex justify-between font-bold text-sm">
                                            <span className="opacity-70 italic">Accounts Receivable</span>
                                            <span className="font-black">${parseFloat(assets.accounts_receivable || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                                        </div>
                                        <div className="flex justify-between font-bold text-sm">
                                            <span className="opacity-70 italic">Inventory Valuation</span>
                                            <span className="font-black">${parseFloat(assets.inventory || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <div className="flex items-center space-x-2 border-b-2 border-navy-blue/20 pb-1">
                                        <div className="w-2 h-2 bg-navy-blue rounded-full"></div>
                                        <p className="font-black text-navy-blue uppercase text-xs tracking-widest">Tangible Fixed Assets</p>
                                    </div>
                                    <div className="space-y-2 px-4">
                                        <div className="flex justify-between font-bold text-sm">
                                            <span className="opacity-70 italic">Property & Equipment (Net)</span>
                                            <span className="font-black">${parseFloat(assets.fixed_assets?.total_value || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex justify-between items-center bg-navy-blue text-white p-5 rounded-xl shadow-xl mt-12 ring-8 ring-navy-blue/5">
                                    <span className="font-black text-lg uppercase tracking-wider">Total Fiscal Assets</span>
                                    <span className="text-2xl font-black">${parseFloat(assets.total || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                                </div>
                            </div>
                        </div>

                        {/* LIABILITIES & EQUITY */}
                        <div className="space-y-12 print-break-before">
                            <div className="bg-white border-2 border-rose-900/10 rounded-2xl overflow-hidden shadow-sm print-break-inside-avoid">
                                <h3 className="text-xl font-black bg-rose-900 text-white p-4 text-center uppercase tracking-widest">Liabilities (Deyn)</h3>
                                <div className="p-8 space-y-4">
                                     <div className="flex justify-between items-center px-4 font-bold">
                                        <span className="opacity-70 italic">Accounts Payable & Accrued Expenses</span>
                                        <span className="font-black text-rose-900">${parseFloat(liabilities.accounts_payable || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                                    </div>
                                    <div className="flex justify-between items-center bg-rose-900 text-white p-4 rounded-xl shadow-lg mt-6">
                                        <span className="font-black uppercase tracking-wide">Total Liabilities</span>
                                        <span className="text-xl font-black">${parseFloat(liabilities.total || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white border-2 border-emerald-900/10 rounded-2xl overflow-hidden shadow-sm border-dashed print-break-inside-avoid">
                                <h3 className="text-xl font-black bg-emerald-900 text-white p-4 text-center uppercase tracking-widest border-b-4 border-double border-white/20">Owner's Equity</h3>
                                <div className="p-8 space-y-6">
                                    <div className="space-y-3 px-4">
                                        <div className="flex justify-between font-bold text-sm">
                                            <span className="opacity-70 italic">Capital Investment</span>
                                            <span className="font-black">${parseFloat(equity.capital || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                                        </div>
                                        <div className="flex justify-between font-bold text-sm">
                                            <span className="opacity-70 italic">Retained Cumulative Earnings</span>
                                            <span className="font-black">${parseFloat(equity.retained_earnings || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                                        </div>
                                        <div className="flex justify-between font-bold text-sm text-rose-600">
                                            <span className="opacity-70 italic">Owner Drawings / Personal distributions</span>
                                            <span className="font-black">(${parseFloat(equity.drawings || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })})</span>
                                        </div>
                                    </div>
                                    <div className="flex justify-between items-center bg-emerald-900 text-white p-5 rounded-xl shadow-lg ring-8 ring-emerald-900/5 mt-6">
                                        <span className="font-black uppercase tracking-wide">Adjusted Net Equity</span>
                                        <span className="text-2xl font-black">${parseFloat(equity.total || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                                    </div>
                                </div>
                            </div>

                             <div className="bg-navy-blue text-white p-6 rounded-2xl flex justify-between items-center shadow-[0_15px_30px_rgba(0,0,128,0.2)]">
                                <div className="flex flex-col">
                                    <span className="text-[10px] font-black uppercase tracking-widest opacity-50 mb-1">Total Fiscal Liability + Equity</span>
                                    <span className="text-lg font-black uppercase tracking-tighter">Balanced Final Total</span>
                                </div>
                                <span className="text-3xl font-black underline decoration-2 underline-offset-8">
                                    ${(parseFloat(liabilities.total || 0) + parseFloat(equity.total || 0)).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                </span>
                            </div>
                        </div>
                    </div>

                    <ReportFooter />
                </div>
             );
        }

        if (reportType === 'equity') {
            const periods = Object.keys(reportData);
            return (
                <div ref={reportRef} className="bg-white p-12 shadow-2xl min-h-screen text-navy-blue">
                    <ReportHeader />

                    <div className="text-center mb-10 pb-4">
                        <h2 className="text-4xl font-black uppercase tracking-extra-wide mb-2">Statement of Owner's Equity</h2>
                        <p className="text-navy-blue/60 font-bold uppercase tracking-widest text-sm italic">Summary of Changes in Proprietorship Capital</p>
                    </div>

                    <div className="max-w-4xl mx-auto space-y-12">
                        {periods.map((periodLabel, idx) => {
                            const data = reportData[periodLabel];
                            return (
                                <div key={periodLabel} className={`bg-white border-2 border-navy-blue/10 rounded-2xl overflow-hidden shadow-sm print-break-inside-avoid ${idx > 0 ? 'print-break-before' : ''}`}>
                                    <div className="bg-navy-blue text-white p-4 text-center font-black text-xl uppercase tracking-widest">
                                        {periodLabel}
                                    </div>
                                    <div className="p-8 space-y-4 font-bold">
                                        <div className="flex justify-between items-center py-2 border-b border-navy-blue/5">
                                            <span className="opacity-70">Opening Equity Balance</span>
                                            <span className="font-black text-lg text-navy-blue">${parseFloat(data.opening_equity || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                                        </div>
                                        <div className="flex justify-between items-center py-2 text-green-700">
                                            <span className="opacity-70">Add: Net Income for the Period</span>
                                            <span className="font-black text-lg">+ ${parseFloat(data.net_income || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                                        </div>
                                        <div className="flex justify-between items-center py-2 text-navy-blue">
                                            <span className="opacity-70">Add: Fresh Capital Investments</span>
                                            <span className="font-black text-lg">+ ${parseFloat(data.investments || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                                        </div>
                                        <div className="flex justify-between items-center py-2 text-rose-800">
                                            <span className="opacity-70 italic">Less: Owner Drawings / Distributions</span>
                                            <span className="font-black text-lg">(${Math.abs(parseFloat(data.drawings || 0)).toLocaleString(undefined, { minimumFractionDigits: 2 })})</span>
                                        </div>
                                        <div className="flex justify-between items-center bg-navy-blue text-white p-6 rounded-2xl shadow-xl mt-8">
                                            <span className="font-black text-xl uppercase tracking-wider">Closing Equity Balance</span>
                                            <span className="text-3xl font-black underline decoration-2 underline-offset-8">
                                                ${parseFloat(data.closing_equity || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    <ReportFooter />
                </div>
            );
        }

        if (reportType === 'cash-flow') {
            const { operating, investing, financing, net_increase } = reportData;
             return (
                <div ref={reportRef} className="bg-white p-12 shadow-2xl min-h-screen text-navy-blue">
                    <ReportHeader />

                    <div className="text-center mb-10 pb-4">
                        <h2 className="text-4xl font-black uppercase tracking-extra-wide mb-2">Cash Flow Statement</h2>
                        <p className="text-navy-blue/60 font-bold uppercase tracking-widest text-sm italic underline decoration-double underline-offset-4">Statement of Actual Cash Movements & Equivalents</p>
                    </div>

                    <div className="max-w-4xl mx-auto space-y-12">
                        {/* Operating */}
                        <div className="group print-break-inside-avoid">
                             <h3 className="font-black text-xl bg-navy-blue/5 p-4 uppercase tracking-widest border-l-8 border-navy-blue flex items-center justify-between">
                                 <span>A. Operating Activities</span>
                                 <span className="text-[10px] opacity-40">Section 1.1</span>
                             </h3>
                             <div className="p-8 space-y-4 font-bold border-2 border-t-0 border-navy-blue/5 rounded-b-2xl">
                                <div className="flex justify-between items-center py-1 hover:text-navy-blue transition-colors">
                                    <span className="opacity-70">Gross cash receipts from customers</span>
                                    <span className="font-black text-lg">${parseFloat(operating.receipts_customers || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                                </div>
                                <div className="flex justify-between items-center py-1 text-rose-800">
                                    <span className="opacity-70 italic">Cash disbursements for operating expenses</span>
                                    <span className="font-black">(${Math.abs(parseFloat(operating.payments_expenses || 0)).toLocaleString(undefined, { minimumFractionDigits: 2 })})</span>
                                </div>
                                <div className="flex justify-between items-center font-black text-xl border-t-2 border-navy-blue/20 pt-4 mt-4 text-navy-blue">
                                    <span className="uppercase tracking-tighter italic">Net Cash from Operating Activities</span>
                                    <span className="underline decoration-4 decoration-navy-blue/30 underline-offset-8">${parseFloat(operating.net || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                                </div>
                             </div>
                        </div>

                         {/* Investing */}
                        <div className="print-break-before">
                             <h3 className="font-black text-xl bg-navy-blue/5 p-4 uppercase tracking-widest border-l-8 border-navy-blue flex items-center justify-between">
                                 <span>B. Investing Activities</span>
                                 <span className="text-[10px] opacity-40">Section 1.2</span>
                             </h3>
                             <div className="p-8 space-y-4 font-bold border-2 border-t-0 border-navy-blue/5 rounded-b-2xl">
                                <div className="flex justify-between items-center text-rose-800">
                                    <span className="opacity-70 italic">Capital expenditure (Purchase of Fixed Assets)</span>
                                    <span className="font-black text-lg">(${Math.abs(parseFloat(investing.purchase_assets || 0)).toLocaleString(undefined, { minimumFractionDigits: 2 })})</span>
                                </div>
                                <div className="flex justify-between items-center font-black text-xl border-t-2 border-navy-blue/20 pt-4 mt-4 text-navy-blue">
                                    <span className="uppercase tracking-tighter italic">Net Cash flow from Investing</span>
                                    <span className="underline decoration-4 decoration-navy-blue/30 underline-offset-8">${parseFloat(investing.net || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                                </div>
                             </div>
                        </div>

                         {/* Financing */}
                        <div className="print-break-before">
                             <h3 className="font-black text-xl bg-navy-blue/5 p-4 uppercase tracking-widest border-l-8 border-navy-blue flex items-center justify-between">
                                 <span>C. Financing Activities</span>
                                 <span className="text-[10px] opacity-40">Section 1.3</span>
                             </h3>
                             <div className="p-8 space-y-4 font-bold border-2 border-t-0 border-navy-blue/5 rounded-b-2xl">
                                <div className="flex justify-between items-center">
                                    <span className="opacity-70">Fresh owner capital injections</span>
                                    <span className="font-black text-lg">${parseFloat(financing.investments || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                                </div>
                                <div className="flex justify-between items-center text-rose-800">
                                    <span className="opacity-70 italic">Owner drawings / Personal distributions</span>
                                    <span className="font-black text-lg">(${Math.abs(parseFloat(financing.drawings || 0)).toLocaleString(undefined, { minimumFractionDigits: 2 })})</span>
                                </div>
                                <div className="flex justify-between items-center font-black text-xl border-t-2 border-navy-blue/20 pt-4 mt-4 text-navy-blue">
                                    <span className="uppercase tracking-tighter italic">Net Cash generated from Financing</span>
                                    <span className="underline decoration-4 decoration-navy-blue/30 underline-offset-8">${parseFloat(financing.net || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                                </div>
                             </div>
                        </div>

                         <div className="bg-navy-blue rounded-3xl p-10 flex border-12 border-double border-white shadow-[0_30px_60px_-15px_rgba(0,0,128,0.3)] mt-20 group relative overflow-hidden print-break-inside-avoid">
                             <div className="flex-1 relative z-10 flex flex-col justify-center">
                                 <span className="text-white/40 font-black uppercase tracking-[0.4em] text-[10px] mb-4">Consolidated Fiscal Result</span>
                                 <h4 className="text-white text-3xl font-black uppercase tracking-extra-wide leading-tight">Total Net Fiscal<br/>Increase / Decrease</h4>
                             </div>
                             <div className="text-right relative z-10 flex flex-col justify-center">
                                 <span className={`text-6xl font-black italic tracking-tighter drop-shadow-2xl ${net_increase >= 0 ? "text-green-400" : "text-rose-400"}`}>
                                     {net_increase >= 0 ? '+' : '-'}${Math.abs(net_increase).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                 </span>
                                 <div className="w-full h-1 bg-white/20 mt-4 rounded-full"></div>
                             </div>
                             <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-white/5 rounded-full blur-2xl"></div>
                             <div className="absolute top-0 right-1/4 w-0.5 h-full bg-white/10"></div>
                         </div>
                    </div>

                    <ReportFooter />
                </div>
             );
        }

        if (reportType === 'notes') {
            if (!reportData || !reportData.policies) {
                return <div className="text-center py-20 text-gray-500 font-bold uppercase tracking-widest animate-pulse">Preparing Supplemental Disclosures...</div>;
            }
            const { policies, fixed_assets_detail, inventory_detail, revenue_detail } = reportData;
            return (
                <div ref={reportRef} className="bg-white p-12 shadow-2xl min-h-screen text-navy-blue">
                    <ReportHeader />

                    <div className="text-center mb-10 pb-4">
                        <h2 className="text-4xl font-black uppercase tracking-extra-wide mb-2">Notes to Financial Statements</h2>
                        <p className="text-navy-blue/60 font-bold uppercase tracking-widest text-sm italic">Supplementary Disclosures & Detailed Schedules</p>
                    </div>

                    <div className="max-w-5xl mx-auto space-y-12">
                        {/* Note 1: Policies */}
                        <section className="bg-navy-blue/5 p-8 rounded-3xl border-2 border-navy-blue/10 print-break-inside-avoid">
                            <h3 className="font-black text-xl uppercase tracking-widest border-b-2 border-navy-blue pb-4 mb-6">Note 1: Significant Accounting Policies</h3>
                            <div className="space-y-4 text-sm font-bold opacity-80 leading-relaxed">
                                <p><span className="text-navy-blue opacity-100">1.1 Reporting Basis:</span> {policies.basis}</p>
                                <p><span className="text-navy-blue opacity-100">1.2 Inventory Valuation:</span> {policies.inventory}</p>
                                <p><span className="text-navy-blue opacity-100">1.3 Fixed Assets & Depreciation:</span> {policies.assets}</p>
                            </div>
                        </section>

                        {/* Note 2: Fixed Assets */}
                         <section className="print-break-before">
                             <h3 className="font-black text-xl uppercase tracking-widest border-b-2 border-navy-blue pb-4 mb-6">Note 2: Fixed Assets Schedule</h3>
                            <div className="overflow-hidden rounded-2xl border-2 border-navy-blue/10">
                                <table className="w-full text-left border-collapse">
                                    <thead className="bg-navy-blue text-white uppercase text-[10px] tracking-widest">
                                        <tr>
                                            <th className="p-4">Asset Description</th>
                                            <th className="p-4 text-right">Original Cost</th>
                                            <th className="p-4 text-right">Acc. Depreciation</th>
                                            <th className="p-4 text-right">Net Book Value</th>
                                        </tr>
                                    </thead>
                                    <tbody className="text-xs font-bold divide-y divide-navy-blue/10 italic">
                                        {fixed_assets_detail.map((asset, idx) => (
                                            <tr key={idx} className="hover:bg-navy-blue/5">
                                                <td className="p-4 uppercase">{asset.asset_name}</td>
                                                <td className="p-4 text-right">${parseFloat(asset.purchase_cost).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                                                <td className="p-4 text-right text-rose-800">(${parseFloat(asset.accumulated_depreciation).toLocaleString(undefined, { minimumFractionDigits: 2 })})</td>
                                                <td className="p-4 text-right font-black text-navy-blue">${parseFloat(asset.current_value).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </section>

                        {/* Note 3: Inventory */}
                        <section className="print-break-before">
                            <h3 className="font-black text-xl uppercase tracking-widest border-b-2 border-navy-blue pb-4 mb-6">Note 3: Inventory Composition</h3>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                {inventory_detail.map((inv, idx) => (
                                    <div key={idx} className="bg-white border-2 border-navy-blue/10 p-6 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
                                        <p className="text-[10px] font-black uppercase opacity-40 mb-1">{inv.category}</p>
                                        <p className="text-lg font-black text-navy-blue">${parseFloat(inv.value).toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
                                        <p className="text-[10px] font-bold opacity-60 italic">{inv.units} Units in Stock</p>
                                    </div>
                                ))}
                            </div>
                        </section>

                         {/* Note 4: Revenue */}
                        <section className="print-break-before">
                            <h3 className="font-black text-xl uppercase tracking-widest border-b-2 border-navy-blue pb-4 mb-6">Note 4: Revenue by Segment (Current YTD)</h3>
                            <div className="space-y-4">
                                {revenue_detail.map((rev, idx) => {
                                    const total = revenue_detail.reduce((sum, r) => sum + parseFloat(r.total_sales), 0);
                                    const percentage = (parseFloat(rev.total_sales) / total * 100).toFixed(1);
                                    return (
                                        <div key={idx} className="space-y-1">
                                            <div className="flex justify-between items-center text-sm font-bold uppercase">
                                                <span>{rev.category}</span>
                                                <span className="font-black">${parseFloat(rev.total_sales).toLocaleString(undefined, { minimumFractionDigits: 2 })} ({percentage}%)</span>
                                            </div>
                                            <div className="w-full bg-navy-blue/5 h-2 rounded-full overflow-hidden">
                                                <div className="bg-navy-blue h-full rounded-full" style={{ width: `${percentage}%` }}></div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </section>
                    </div>

                    <ReportFooter />
                </div>
            );
        }

        if (reportType === 'comprehensive') {
            const { financials, expense_hotspots, top_revenue_items, daily_best_sellers, historical_opportunity, slow_movers, debts, inventory } = reportData;
            return (
                <div ref={reportRef} className="bg-white p-12 shadow-2xl min-h-screen text-navy-blue">
                    <ReportHeader />

                    <div className="text-center mb-10 pb-4">
                        <h2 className="text-4xl font-black uppercase tracking-extra-wide mb-2">Comprehensive Executive Report</h2>
                        <p className="text-navy-blue/60 font-bold uppercase tracking-widest text-sm italic">Holistic Business Performance & Intelligence Summary</p>
                    </div>

                    <div className="max-w-5xl mx-auto space-y-12">
                        {/* 1. Financial Performance */}
                        <section className="bg-navy-blue text-white p-8 rounded-3xl shadow-xl print-break-inside-avoid">
                            <h3 className="text-xl font-black uppercase tracking-widest mb-6 border-b border-white/20 pb-4 flex items-center gap-3">
                                <DollarSign size={24} /> Financial Performance
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                                <div className="space-y-1">
                                    <p className="text-[10px] font-black uppercase opacity-60">Total Profit (Revenue - COGS)</p>
                                    <p className="text-3xl font-black text-green-400">${financials.gross_profit.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-[10px] font-black uppercase opacity-60">Total Money Out (Exp + Pur)</p>
                                    <p className="text-3xl font-black text-rose-400">${financials.total_money_out.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-[10px] font-black uppercase opacity-60">Net Operational Profit</p>
                                    <p className={`text-3xl font-black ${financials.net_profit >= 0 ? 'text-green-400' : 'text-rose-400'}`}>
                                        ${financials.net_profit.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                    </p>
                                </div>
                            </div>
                        </section>

                        {/* 2. Expense Hotspots & Top Revenue */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                            <section className="print-break-before">
                                <h3 className="font-black text-lg uppercase tracking-widest border-b-2 border-rose-900 pb-2 mb-4 text-rose-900 flex items-center gap-2">
                                    <Activity size={18} /> Expense Hotspots
                                </h3>
                                <div className="space-y-3">
                                    {expense_hotspots.map((exp, idx) => (
                                        <div key={idx} className="flex justify-between items-center text-sm font-bold border-b border-rose-900/5 pb-2">
                                            <span className="capitalize">{exp.expense_category}</span>
                                            <span className="text-rose-600">${parseFloat(exp.total).toLocaleString()}</span>
                                        </div>
                                    ))}
                                </div>
                            </section>

                            <section className="print-break-before">
                                <h3 className="font-black text-lg uppercase tracking-widest border-b-2 border-green-700 pb-2 mb-4 text-green-700 flex items-center gap-2">
                                    <TrendingUp size={18} /> Income Generators
                                </h3>
                                <div className="space-y-3">
                                    {top_revenue_items.map((item, idx) => (
                                        <div key={idx} className="flex justify-between items-center text-sm font-bold border-b border-green-700/5 pb-2">
                                            <span className="capitalize">{item.name}</span>
                                            <span className="text-green-600">${parseFloat(item.total_income).toLocaleString()}</span>
                                        </div>
                                    ))}
                                </div>
                            </section>
                        </div>

                        {/* 3. Daily Velocity & Slow Movers */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                            <section className="print-break-before">
                                <h3 className="font-black text-lg uppercase tracking-widest border-b-2 border-navy-blue pb-2 mb-4 text-navy-blue flex items-center gap-2">
                                    <Package size={18} /> Daily Best Sellers
                                </h3>
                                <div className="space-y-3">
                                    {daily_best_sellers.map((item, idx) => (
                                        <div key={idx} className="flex justify-between items-center text-sm font-bold border-b border-navy-blue/5 pb-2">
                                            <span>{item.name}</span>
                                            <span className="bg-navy-blue text-white px-2 py-0.5 rounded text-[10px]">{item.total_qty} Units</span>
                                        </div>
                                    ))}
                                </div>
                            </section>

                            <section className="print-break-before">
                                <h3 className="font-black text-lg uppercase tracking-widest border-b-2 border-slate-400 pb-2 mb-4 text-slate-500 flex items-center gap-2">
                                    <AlertTriangle size={18} /> Slow Moving Items
                                </h3>
                                <div className="space-y-3">
                                    {slow_movers.map((item, idx) => (
                                        <div key={idx} className="flex justify-between items-center text-sm font-bold border-b border-slate-200 pb-2">
                                            <span className="opacity-60">{item.name}</span>
                                            <span className="text-slate-400 text-xs italic">{item.sale_count} Sales Recorded</span>
                                        </div>
                                    ))}
                                </div>
                            </section>
                        </div>

                        {/* 4. Opportunity Analysis (High history, 0 stock) */}
                        <section className="bg-amber-50 p-8 rounded-3xl border-2 border-amber-200 print-break-before">
                            <h3 className="font-black text-lg uppercase tracking-widest text-amber-800 mb-6 flex items-center gap-2">
                                <Activity size={18} /> Success Opportunity (Stock-Out High Performers)
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {historical_opportunity.map((item, idx) => (
                                    <div key={idx} className="bg-white p-4 rounded-xl border border-amber-100 flex justify-between items-center shadow-sm">
                                        <span className="font-bold text-amber-900">{item.name}</span>
                                        <div className="text-right">
                                            <span className="block text-[10px] font-black text-amber-600 uppercase">Historical Income</span>
                                            <span className="font-black text-amber-800">${parseFloat(item.historical_income).toLocaleString()}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </section>

                        {/* 5. Outstanding Debts */}
                        <section className="print-break-before">
                            <h3 className="font-black text-lg uppercase tracking-widest border-b-2 border-rose-600 pb-2 mb-6 text-rose-600 flex items-center gap-2">
                                <Users size={18} /> Outstanding Debts (Credit Details)
                            </h3>
                            <div className="overflow-hidden rounded-2xl border-2 border-rose-100">
                                <table className="w-full text-left border-collapse">
                                    <thead className="bg-rose-600 text-white uppercase text-[10px] tracking-widest">
                                        <tr>
                                            <th className="p-4">Customer Name</th>
                                            <th className="p-4">Phone Number</th>
                                            <th className="p-4 text-right">Balance Owed</th>
                                        </tr>
                                    </thead>
                                    <tbody className="text-sm font-bold divide-y divide-rose-100 divide-dashed">
                                        {debts.map((debt, idx) => (
                                            <tr key={idx}>
                                                <td className="p-4 text-rose-900 uppercase">{debt.full_name}</td>
                                                <td className="p-4 opacity-70">{debt.phone_number}</td>
                                                <td className="p-4 text-right text-rose-600 font-black">${parseFloat(debt.current_balance).toLocaleString()}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </section>

                        {/* 6. Inventory Status */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 print-break-before">
                            <section>
                                <h3 className="font-black text-lg uppercase tracking-widest border-b-2 border-slate-900 pb-2 mb-4 flex items-center gap-2">
                                    <Package size={18} /> Stock Out Items
                                </h3>
                                <div className="space-y-2">
                                    {inventory.finished.map((item, idx) => (
                                        <div key={idx} className="text-xs font-bold text-rose-600 uppercase bg-rose-50 px-3 py-1.5 rounded-lg">
                                            {item.name} ({item.category})
                                        </div>
                                    ))}
                                </div>
                            </section>

                            <section>
                                <h3 className="font-black text-lg uppercase tracking-widest border-b-2 border-navy-blue pb-2 mb-4 flex items-center gap-2">
                                    <Package size={18} /> In-Stock Summary
                                </h3>
                                <div className="space-y-2">
                                    {inventory.in_stock.slice(0, 20).map((item, idx) => (
                                        <div key={idx} className="flex justify-between text-xs font-bold border-b border-navy-blue/5 pb-1 uppercase">
                                            <span className="opacity-70">{item.name}</span>
                                            <span className="font-black">{item.current_stock} units</span>
                                        </div>
                                    ))}
                                </div>
                            </section>
                        </div>
                    </div>

                    <ReportFooter />
                </div>
            );
        }

        if (!reportType) {
            return (
                <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                    <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                        <TrendingUp size={40} className="text-slate-300" />
                    </div>
                    <h3 className="text-xl font-bold uppercase tracking-wider">Dooro Nooca Warbixinta</h3>
                    <p className="text-sm">Fadlan ka dooro liiska sare si aad u bilowdo</p>
                </div>
            );
        }

        return <div className="text-center py-20 text-gray-500 font-bold uppercase tracking-widest">Report Configuration Not Recognized</div>;
    };

    return (
        <div className="max-w-7xl mx-auto pb-20 px-4">
             {/* Controls */}
             <div className="bg-slate-900 text-white p-6 rounded-2xl mb-8 flex flex-wrap gap-6 items-end print:hidden">
                <div className="flex-1 min-w-[200px]">
                    <h1 className="text-3xl font-extrabold mb-1">Financial <span className="text-blue-500">Reports</span></h1>
                    <p className="text-slate-400 text-sm">Professional Accounting Statements</p>
                </div>
                
                <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-400 uppercase">Report Type</label>
                    <select 
                        value={reportType}
                        onChange={(e) => setReportType(e.target.value)}
                        className="w-full bg-slate-800 border border-slate-600 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
                    >
                        <option value="">-- Dooro Nooca Warbixinta --</option>
                        <option value="income-statement">Income Statement (P&L)</option>
                        <option value="balance-sheet">Balance Sheet</option>
                        <option value="cash-flow">Cash Flow Statement</option>
                        <option value="equity">Statement of Owner's Equity</option>
                        <option value="notes">Notes to Financials</option>
                        <option value="comprehensive">Comprehensive Executive Report</option>
                    </select>
                </div>

                <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-400 uppercase">Period / As Of</label>
                    <select 
                        value={period}
                        onChange={(e) => setPeriod(e.target.value)}
                        className="w-full bg-slate-800 border border-slate-600 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
                    >
                        <option value="monthly">Monthly Comparison</option>
                        <option value="yearly">Yearly Comparison</option>
                    </select>
                </div>

                 <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-400 uppercase">Reference Date</label>
                     <input 
                        type="date" 
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                        className="bg-slate-800 border border-slate-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>

                <div className="flex gap-2">
                    <button 
                        onClick={generateReport}
                        disabled={loading}
                        className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-2 rounded-lg font-bold shadow-lg shadow-blue-600/20 transition-all active:scale-95 disabled:opacity-50"
                    >
                        {loading ? "Generating..." : "Generate Report"}
                    </button>

                    <button 
                        onClick={handleReset}
                        className="bg-slate-700 hover:bg-slate-600 text-white px-4 py-2 rounded-lg font-bold transition-all active:scale-95 flex items-center gap-2"
                        title="Reset Filters"
                    >
                        <span>🔄 Clear</span>
                    </button>
                </div>

                <div className="flex flex-wrap gap-2">
                    <button 
                        onClick={handleDownloadPDF}
                        disabled={downloading || !reportData}
                        className="bg-navy-blue hover:bg-navy-blue/90 text-white px-5 py-2 rounded-lg font-bold shadow-lg transition-all active:scale-95 disabled:opacity-50 flex items-center space-x-2"
                    >
                        <span>{downloading ? "Preparing PDF..." : "📥 PDF"}</span>
                    </button>
                    <button 
                        onClick={handleDownloadExcel}
                        disabled={downloading || !reportData}
                        className="bg-green-700 hover:bg-green-600 text-white px-5 py-2 rounded-lg font-bold shadow-lg transition-all active:scale-95 disabled:opacity-50 flex items-center space-x-2"
                    >
                        <FileDown size={16} />
                        <span>EXCEL</span>
                    </button>
                    <button 
                        onClick={handleDownloadWord}
                        disabled={downloading || !reportData}
                        className="bg-blue-800 hover:bg-blue-700 text-white px-5 py-2 rounded-lg font-bold shadow-lg transition-all active:scale-95 disabled:opacity-50 flex items-center space-x-2"
                    >
                        <FileDown size={16} />
                        <span>WORD</span>
                    </button>
                </div>


             </div>

             {/* Report Content Area */}
             <div id="report-content" className="min-h-[500px] print:min-h-0 bg-white p-8 rounded-2xl shadow-xl">
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-20 animate-pulse">
                        <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                        <p className="text-navy-blue font-black uppercase tracking-[0.2em]">Synchronizing Ledger Data...</p>
                    </div>
                ) : (
                    renderReportContent()
                )}

                {/* Print Footer */}
                <div className="hidden print:block text-center text-xs text-gray-500 mt-12 pt-4 border-t">
                    <p>Generated by So'Mali POS System on {new Date().toLocaleString()}</p>
                </div>
             </div>
        </div>
    );
};

export default FinancialReportsPage;
