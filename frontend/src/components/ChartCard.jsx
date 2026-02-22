import React from 'react';
import { ResponsiveContainer } from 'recharts';

const ChartCard = ({ title, subtitle, children, height = 300, icon: Icon }) => {
    return (
        <div className="bg-secondary/30 backdrop-blur-md border border-slate-700 rounded-2xl p-6 hover:border-blue-500/30 transition-all duration-300">
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-3">
                    {Icon && (
                        <div className="w-10 h-10 bg-blue-600/10 rounded-xl flex items-center justify-center border border-blue-500/20">
                            <Icon size={20} className="text-blue-400" />
                        </div>
                    )}
                    <div>
                        <h3 className="text-lg font-bold text-white">{title}</h3>
                        {subtitle && <p className="text-sm text-slate-400">{subtitle}</p>}
                    </div>
                </div>
            </div>
            <div style={{ width: '100%', height: height }}>
                <ResponsiveContainer width="100%" height="100%">
                    {children}
                </ResponsiveContainer>
            </div>
        </div>
    );
};

export default ChartCard;
