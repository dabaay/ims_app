import React from 'react';
import { X } from 'lucide-react';

const Modal = ({ isOpen, onClose, title, children }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="bg-secondary border border-slate-700 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl animate-in fade-in zoom-in duration-200">
                <div className="p-6 border-b border-slate-700 flex items-center justify-between bg-slate-800/50">
                    <h2 className="text-xl font-bold text-white">{title}</h2>
                    <button 
                        onClick={onClose}
                        className="p-2 hover:bg-slate-700 rounded-lg text-slate-400 hover:text-white transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>
                <div className="p-6 overflow-y-auto flex-1 custom-scrollbar">
                    {children}
                </div>
            </div>
        </div>
    );
};

export default Modal;
