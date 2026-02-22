import React, { useState, useEffect, useRef, useCallback } from 'react';
import api from '../api/axios';
import { MessageCircle, Send, Image, X, ChevronLeft, Package, CheckCircle } from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:8000';

// ─── Helpers ────────────────────────────────────────────────────────────────
const formatTime = (dt) =>
    new Date(dt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

const formatDateLabel = (dt) => {
    const d = new Date(dt);
    const today = new Date(); today.setHours(0,0,0,0);
    const msgDay = new Date(d); msgDay.setHours(0,0,0,0);
    const diff = Math.round((today - msgDay) / 86400000);
    if (diff === 0) return 'Today';
    if (diff === 1) return 'Yesterday';
    return d.toLocaleDateString([], { year: 'numeric', month: 'short', day: 'numeric' });
};

const isSameDay = (a, b) => {
    const da = new Date(a), db = new Date(b);
    return da.getFullYear() === db.getFullYear() && da.getMonth() === db.getMonth() && da.getDate() === db.getDate();
};

// ─── Sub-components ──────────────────────────────────────────────────────────
const DateSeparator = ({ date }) => (
    <div className="flex justify-center my-4">
        <span className="bg-[#D1F4CC] text-[#4A4A4A] text-xs font-semibold px-3 py-1 rounded-full shadow-sm">
            {formatDateLabel(date)}
        </span>
    </div>
);

const ChatBubble = ({ msg, onImport }) => {
    // In manager view: admin messages are on the RIGHT (sent by manager)
    const isRight = !msg.is_from_customer;
    const imageUrl = msg.image_url;
    const hasText = msg.message && msg.message !== '[Image]';

    return (
        <div className={`flex mb-1 ${isRight ? 'justify-end' : 'justify-start'}`}>
            <div
                className={`relative max-w-[65%] rounded-2xl overflow-hidden shadow-sm text-sm
                    ${isRight
                        ? 'bg-[#DCF8C6] rounded-tr-sm text-gray-800'
                        : 'bg-white rounded-tl-sm text-gray-800'
                    }`}
            >
                {imageUrl && (
                    <div className="relative group">
                        <img
                            src={imageUrl}
                            alt="chat"
                            className="block w-full max-w-xs cursor-pointer object-cover"
                            onClick={() => window.open(imageUrl, '_blank')}
                        />
                        {/* Import button — only visible on customer images */}
                        {msg.is_from_customer && onImport && (
                            <button
                                onClick={() => onImport(msg)}
                                className="absolute inset-0 flex flex-col items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity gap-1"
                            >
                                <Package size={20} className="text-white" />
                                <span className="text-white text-[10px] font-bold uppercase tracking-wider">Import as Product</span>
                            </button>
                        )}
                    </div>
                )}
                <div className="px-3 pt-2 pb-1">
                    {hasText && <p className="leading-relaxed">{msg.message}</p>}
                    <div className={`flex items-center gap-1 mt-1 ${isRight ? 'justify-end' : 'justify-start'}`}>
                        <span className="text-[10px] text-gray-400 leading-none">{formatTime(msg.created_at)}</span>
                        {isRight && (
                            <svg viewBox="0 0 16 11" className="w-4 h-3 text-[#53BDEB] fill-current" xmlns="http://www.w3.org/2000/svg">
                                <path d="M11.071.653a.75.75 0 0 1 1.06 1.06L5.5 8.344 3.5 6.344a.75.75 0 0 0-1.06 1.06l2.53 2.53a.75.75 0 0 0 1.06 0l7.162-7.162a.75.75 0 0 0 0-1.06zm-2.53 0L2.47 6.713a.75.75 0 0 0 0 1.06.75.75 0 0 0 1.06 0L9.6 1.714A.75.75 0 0 0 8.54.653z"/>
                            </svg>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

// ─── Import Product Modal ─────────────────────────────────────────────────────
const ImportProductModal = ({ msg, onClose }) => {
    const API_BASE_MODAL = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:8000';
    const [form, setForm] = useState({ name: '', category: '', selling_price: '', current_stock: '0' });
    const [submitting, setSubmitting] = useState(false);
    const [done, setDone] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        setError('');
        try {
            // Step 1: import the image and create a draft product
            const importRes = await api.post('/products/import-from-chat', { chat_message_id: msg.id });
            const product = importRes.data.data;

            // Step 2: update the product with real details
            await api.put(`/products/${product.product_id}`, {
                name: form.name,
                category: form.category,
                selling_price: parseFloat(form.selling_price) || 0,
                cost_price: 0,
                current_stock: parseInt(form.current_stock) || 0,
                is_active: true,
            });

            setDone(true);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to import product.');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
            <div className="bg-[#202C33] rounded-2xl shadow-2xl w-full max-w-md border border-slate-700 overflow-hidden">
                <div className="flex items-center justify-between px-5 py-4 border-b border-slate-700">
                    <div className="flex items-center gap-2 text-white font-black uppercase tracking-wider text-sm">
                        <Package size={18} className="text-[#25D366]" />
                        Import as Product
                    </div>
                    <button onClick={onClose} className="text-slate-400 hover:text-white"><X size={20} /></button>
                </div>

                {done ? (
                    <div className="p-8 flex flex-col items-center gap-4 text-center">
                        <CheckCircle size={48} className="text-[#25D366]" />
                        <p className="text-white font-bold text-lg">Product imported successfully!</p>
                        <p className="text-slate-400 text-sm">The product has been added to your inventory.</p>
                        <button onClick={onClose} className="mt-2 px-6 py-2.5 bg-[#128C7E] hover:bg-[#25D366] text-white rounded-xl font-bold transition-all">Done</button>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="p-5 space-y-4">
                        {/* Image preview */}
                        <div className="w-full h-40 rounded-xl overflow-hidden border border-slate-600 bg-slate-900">
                            <img src={msg.image_url} alt="preview" className="w-full h-full object-contain" />
                        </div>

                        <div>
                            <label className="block text-slate-400 text-xs font-semibold mb-1 uppercase tracking-wider">Product Name *</label>
                            <input required type="text" placeholder="e.g. Samsung Galaxy S24"
                                className="w-full bg-[#111B21] border border-slate-600 rounded-xl px-4 py-2 text-white text-sm outline-none focus:ring-2 focus:ring-[#25D366]/50"
                                value={form.name} onChange={e => setForm({...form, name: e.target.value})} />
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="block text-slate-400 text-xs font-semibold mb-1 uppercase tracking-wider">Category *</label>
                                <input required type="text" placeholder="e.g. Electronics"
                                    className="w-full bg-[#111B21] border border-slate-600 rounded-xl px-4 py-2 text-white text-sm outline-none focus:ring-2 focus:ring-[#25D366]/50"
                                    value={form.category} onChange={e => setForm({...form, category: e.target.value})} />
                            </div>
                            <div>
                                <label className="block text-slate-400 text-xs font-semibold mb-1 uppercase tracking-wider">Selling Price *</label>
                                <input required type="number" step="0.01" min="0" placeholder="0.00"
                                    className="w-full bg-[#111B21] border border-slate-600 rounded-xl px-4 py-2 text-white text-sm outline-none focus:ring-2 focus:ring-[#25D366]/50"
                                    value={form.selling_price} onChange={e => setForm({...form, selling_price: e.target.value})} />
                            </div>
                        </div>

                        <div>
                            <label className="block text-slate-400 text-xs font-semibold mb-1 uppercase tracking-wider">Initial Stock</label>
                            <input type="number" min="0"
                                className="w-full bg-[#111B21] border border-slate-600 rounded-xl px-4 py-2 text-white text-sm outline-none focus:ring-2 focus:ring-[#25D366]/50"
                                value={form.current_stock} onChange={e => setForm({...form, current_stock: e.target.value})} />
                        </div>

                        {error && <p className="text-rose-400 text-xs font-semibold">{error}</p>}

                        <div className="flex gap-3 pt-2">
                            <button type="button" onClick={onClose}
                                className="flex-1 py-2.5 border border-slate-600 text-slate-400 hover:text-white rounded-xl font-bold text-sm transition-all">
                                Cancel
                            </button>
                            <button type="submit" disabled={submitting}
                                className="flex-1 py-2.5 bg-[#128C7E] hover:bg-[#25D366] disabled:opacity-50 text-white rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2">
                                {submitting ? 'Saving…' : (<><Package size={16} /> Save to Inventory</>)}
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
};

// ─── Main Component ──────────────────────────────────────────────────────────
const MobileChat = () => {
    const [chats, setChats] = useState([]);
    const [selectedChat, setSelectedChat] = useState(null);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(true);
    const [imagePreview, setImagePreview] = useState(null);
    const [imageFile, setImageFile] = useState(null);
    const [sending, setSending] = useState(false);
    const [chatStatus, setChatStatus] = useState('open');
    const [hasNewMsg, setHasNewMsg] = useState(false);
    const [importMsg, setImportMsg] = useState(null); // message being imported as product
    const msgEndRef = useRef(null);
    const fileInputRef = useRef(null);
    const lastMsgCount = useRef(0);
    const selectedChatRef = useRef(selectedChat);

    useEffect(() => { selectedChatRef.current = selectedChat; }, [selectedChat]);

    const isNearBottom = () => {
        const el = msgEndRef.current?.parentElement;
        if (!el) return true;
        return el.scrollHeight - el.scrollTop - el.clientHeight < 100;
    };

    const scrollToBottom = useCallback((force = false) => {
        setTimeout(() => {
            if (force || isNearBottom()) {
                msgEndRef.current?.scrollIntoView({ behavior: 'smooth' });
                setHasNewMsg(false);
            }
        }, 80);
    }, []);

    // ── Fetch chat list ──────────────────────────────────────────
    const fetchChats = useCallback(async () => {
        try {
            const res = await api.get('/mobile-manager/chats');
            const incoming = res.data.data || [];
            setChats(incoming.map(c => {
                // Don't re-show unread count for the currently open conversation
                const activeId = selectedChatRef.current?.customer?.customer_id;
                if (activeId && c.customer?.customer_id === activeId) {
                    return { ...c, unread_count: 0 };
                }
                return c;
            }));
        } catch { /* silent */ }
    }, []);

    useEffect(() => {
        fetchChats().then(() => setLoading(false));
        // Poll chat list every 5s
        const id = setInterval(fetchChats, 5000);
        return () => clearInterval(id);
    }, [fetchChats]);

    // ── Fetch messages ───────────────────────────────────────────
    const fetchMessages = useCallback(async (customerId) => {
        try {
            const res = await api.get(`/mobile-manager/chats/${customerId}`);
            const msgs = res.data.data || [];
            const status = res.data.chat_status || 'open';
            setChatStatus(status);
            setMessages(msgs);

            const near = isNearBottom();
            if (msgs.length > lastMsgCount.current && lastMsgCount.current > 0 && !near) {
                setHasNewMsg(true);
            } else if (msgs.length > lastMsgCount.current) {
                scrollToBottom();
            }
            lastMsgCount.current = msgs.length;

            // Update chat list status badge inline
            setChats(prev => prev.map(c =>
                c.customer.customer_id === customerId ? { ...c, chat_status: status } : c
            ));
        } catch (err) { 
            if (err.response?.status === 404) {
                setSelectedChat(null);
                fetchChats();
            }
        }
    }, [scrollToBottom, fetchChats]);

    useEffect(() => {
        if (!selectedChat) return;
        const id = selectedChat.customer.customer_id;
        lastMsgCount.current = 0;
        fetchMessages(id);
        scrollToBottom(true);
        // Poll messages every 3s for real-time feel
        const interval = setInterval(() => fetchMessages(id), 3000);
        return () => clearInterval(interval);
    }, [selectedChat, fetchMessages, scrollToBottom]);

    const handleSelectChat = (chat) => {
        setSelectedChat(chat);
        setMessages([]);
        setHasNewMsg(false);
        // Optimistically clear the unread badge immediately
        setChats(prev => prev.map(c =>
            c.customer.customer_id === chat.customer.customer_id
                ? { ...c, unread_count: 0 }
                : c
        ));
    };

    // ── Send message / image ─────────────────────────────────────
    const handleSendMessage = async (e) => {
        e?.preventDefault();
        if ((!newMessage.trim() && !imageFile) || !selectedChat) return;
        setSending(true);
        try {
            const formData = new FormData();
            if (newMessage.trim()) formData.append('message', newMessage);
            if (imageFile) formData.append('image', imageFile);
            await api.post(`/mobile-manager/chats/${selectedChat.customer?.customer_id}/send`, formData);
            setNewMessage('');
            clearImage();
            await fetchMessages(selectedChat.customer?.customer_id);
            scrollToBottom(true);
        } catch (err) { 
            console.error('Chat Send Error:', err.response?.status, err.response?.data);
            const status = err.response?.status;
            let msg = err.response?.data?.message || 'Failed to send';
            if (status === 422) {
                const errors = err.response?.data?.errors;
                if (errors) msg = Object.values(errors).flat().join(', ');
            }
            alert(msg);
        }
        finally { setSending(false); }
    };

    const handleImageSelect = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        setImageFile(file);
        setImagePreview(URL.createObjectURL(file));
    };

    const clearImage = () => {
        setImageFile(null);
        setImagePreview(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const handleEndChat = async () => {
        if (!selectedChat || !confirm('End this chat? The customer will be prompted to rate the service.')) return;
        await api.post(`/mobile-manager/chats/${selectedChat.customer?.customer_id}/end`);
        setChatStatus('closed');
        fetchChats();
    };

    const handleReopenChat = async () => {
        if (!selectedChat) return;
        await api.post(`/mobile-manager/chats/${selectedChat.customer?.customer_id}/reopen`);
        setChatStatus('open');
        fetchChats();
    };

    if (loading) return <div className="text-white p-8 font-black uppercase tracking-widest">Loading Chats...</div>;

    return (
        <>
        <div className="h-[calc(100vh-160px)] flex gap-0 rounded-3xl overflow-hidden border border-slate-700/50 shadow-2xl">

            {/* ── Sidebar / Chat List ── */}
            <div className={`w-full lg:w-80 bg-[#111B21] flex flex-col border-r border-slate-700/30 ${selectedChat ? 'hidden lg:flex' : 'flex'}`}>
                <div className="p-5 border-b border-slate-700/30 bg-[#202C33] flex items-center justify-between">
                    <h2 className="text-base font-black text-white uppercase tracking-wider">Conversations</h2>
                    {chats.reduce((s, c) => s + (c.unread_count || 0), 0) > 0 && (
                        <span className="bg-[#25D366] text-black text-[11px] font-black px-2 py-0.5 rounded-full animate-pulse">
                            {chats.reduce((s, c) => s + (c.unread_count || 0), 0)}
                        </span>
                    )}
                </div>
                <div className="flex-1 overflow-y-auto custom-scrollbar">
                    {chats.length === 0 && (
                        <div className="p-8 text-center text-slate-500 text-sm">No conversations yet.</div>
                    )}
                    {chats.map((chat) => {
                        const isActive = selectedChat?.customer.customer_id === chat.customer.customer_id;
                        const lastMsg = chat.last_message;
                        const hasImg = lastMsg?.image_url && !lastMsg?.message;
                        const unread = chat.unread_count || 0;
                        return (
                            <button
                                key={chat.customer.customer_id}
                                onClick={() => handleSelectChat(chat)}
                                className={`w-full flex items-center gap-3 px-4 py-4 transition-all border-b border-slate-800/60 text-left
                                    ${isActive ? 'bg-[#2A3942]' : 'hover:bg-[#1F2C33]'}`}
                            >
                                {/* Avatar with unread dot */}
                                <div className="relative shrink-0">
                                    <div className="w-12 h-12 rounded-full bg-[#128C7E] flex items-center justify-center text-white font-bold text-lg uppercase">
                                        {chat.customer?.full_name?.[0] || '?'}
                                    </div>
                                    {unread > 0 && !isActive && (
                                        <span className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-[#25D366] rounded-full border-2 border-[#111B21]" />
                                    )}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex justify-between items-center">
                                        <p className={`truncate ${unread > 0 && !isActive ? 'font-bold text-white' : 'font-semibold text-white'}`}>
                                            {chat.customer?.full_name || 'Unknown'}
                                        </p>
                                        {/* Show unread badge OR timestamp */}
                                        {unread > 0 && !isActive ? (
                                            <span className="shrink-0 ml-2 bg-[#25D366] text-black text-[10px] font-black min-w-[20px] h-5 rounded-full flex items-center justify-center px-1.5">
                                                {unread}
                                            </span>
                                        ) : (
                                            lastMsg && <span className="text-[10px] text-slate-400 shrink-0 ml-2">{formatTime(lastMsg.created_at)}</span>
                                        )}
                                    </div>
                                    <p className={`text-xs truncate mt-0.5 ${unread > 0 && !isActive ? 'text-white font-semibold' : 'text-slate-400'}`}>
                                        {hasImg ? '📷 Photo' : (lastMsg?.message || 'No messages yet')}
                                    </p>
                                    {chat.chat_status === 'closed' && (
                                        <span className="text-[9px] font-bold text-orange-400 uppercase tracking-widest">Closed</span>
                                    )}
                                </div>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* ── Chat Area ── */}
            <div
                className={`flex-1 flex flex-col ${!selectedChat ? 'hidden lg:flex items-center justify-center bg-[#0D1418]' : 'flex'}`}
                style={selectedChat ? { backgroundImage: 'radial-gradient(circle at 1px 1px, #1F2C33 1px, transparent 0)', backgroundSize: '24px 24px', backgroundColor: '#0B141A' } : { backgroundColor: '#0D1418' }}
            >
                {selectedChat ? (
                    <>
                        {/* Header */}
                        <div className="flex items-center gap-3 px-4 py-3 bg-[#202C33] border-b border-slate-700/30 shrink-0">
                            <button onClick={() => setSelectedChat(null)} className="lg:hidden p-1 text-slate-400">
                                <ChevronLeft size={22} />
                            </button>
                            <div className="w-10 h-10 rounded-full bg-[#128C7E] flex items-center justify-center text-white font-bold text-base uppercase">
                                {selectedChat.customer?.full_name?.[0] || '?'}
                            </div>
                            <div className="flex-1">
                                <p className="font-semibold text-white capitalize leading-tight">{selectedChat.customer?.full_name}</p>
                                <p className={`text-xs font-semibold ${chatStatus === 'closed' ? 'text-orange-400' : 'text-[#25D366]'}`}>
                                    {chatStatus === 'closed' ? 'Chat Closed' : 'Active'}
                                </p>
                            </div>
                            {chatStatus === 'closed' ? (
                                <button onClick={handleReopenChat}
                                    className="px-3 py-1.5 bg-[#128C7E] hover:bg-[#25D366] text-white text-xs font-bold uppercase rounded-lg transition-all">
                                    Reopen
                                </button>
                            ) : (
                                <button onClick={handleEndChat}
                                    className="px-3 py-1.5 bg-red-600/70 hover:bg-red-500 text-white text-xs font-bold uppercase rounded-lg transition-all">
                                    End Chat
                                </button>
                            )}
                        </div>

                        {chatStatus === 'closed' && (
                            <div className="flex items-center gap-2 px-4 py-2 bg-orange-500/10 border-b border-orange-500/20 text-orange-400 text-xs font-semibold">
                                🔒 This conversation is closed.
                            </div>
                        )}

                        {/* Messages */}
                        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-0 custom-scrollbar relative">
                            {messages.map((msg, i) => {
                                const prev = messages[i - 1];
                                const showDate = !prev || !isSameDay(prev.created_at, msg.created_at);
                                return (
                                    <div key={msg.id}>
                                        {showDate && <DateSeparator date={msg.created_at} />}
                                        <ChatBubble msg={msg} onImport={setImportMsg} />
                                    </div>
                                );
                            })}
                            <div ref={msgEndRef} />
                        </div>

                        {/* New message indicator */}
                        {hasNewMsg && (
                            <div className="absolute bottom-24 left-1/2 -translate-x-1/2 z-10">
                                <button onClick={() => { scrollToBottom(true); }}
                                    className="flex items-center gap-2 bg-[#128C7E] text-white text-xs font-bold px-4 py-2 rounded-full shadow-lg">
                                    ↓ New messages
                                </button>
                            </div>
                        )}

                        {/* Input */}
                        {chatStatus === 'closed' ? (
                            <div className="px-4 py-4 bg-[#202C33] text-center text-orange-400 text-xs font-bold uppercase tracking-wider border-t border-slate-700/30">
                                Chat is closed — Click "Reopen" to continue messaging
                            </div>
                        ) : (
                            <form onSubmit={handleSendMessage} className="px-3 py-3 bg-[#202C33] border-t border-slate-700/30 flex flex-col gap-2 shrink-0">
                                {imagePreview && (
                                    <div className="relative w-20 h-20">
                                        <img src={imagePreview} className="w-20 h-20 object-cover rounded-xl border border-slate-600" alt="preview" />
                                        <button type="button" onClick={clearImage}
                                            className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center">
                                            <X size={10} />
                                        </button>
                                    </div>
                                )}
                                <div className="flex items-center gap-2">
                                    <input type="file" accept="image/*" ref={fileInputRef} onChange={handleImageSelect} className="hidden" />
                                    <button type="button" onClick={() => fileInputRef.current?.click()}
                                        className="w-10 h-10 rounded-full bg-[#128C7E]/20 hover:bg-[#128C7E]/40 flex items-center justify-center text-[#128C7E] transition-all">
                                        <Image size={18} />
                                    </button>
                                    <input
                                        type="text"
                                        placeholder="Message…"
                                        className="flex-1 bg-[#2A3942] border-none rounded-full px-5 py-2.5 text-white text-sm outline-none placeholder-slate-400"
                                        value={newMessage}
                                        onChange={(e) => setNewMessage(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
                                    />
                                    <button type="submit" disabled={sending}
                                        className="w-10 h-10 rounded-full bg-[#128C7E] hover:bg-[#25D366] disabled:opacity-50 flex items-center justify-center text-white transition-all">
                                        <Send size={18} />
                                    </button>
                                </div>
                            </form>
                        )}
                    </>
                ) : (
                    <div className="text-center space-y-4 opacity-20">
                        <MessageCircle size={64} className="text-slate-400 mx-auto" />
                        <p className="text-slate-400 font-bold uppercase tracking-widest text-sm">Select a conversation</p>
                    </div>
                )}
            </div>
        </div>

        {/* Import Product Modal */}
        {importMsg && (
            <ImportProductModal msg={importMsg} onClose={() => setImportMsg(null)} />
        )}
        </>
    );
};

export default MobileChat;
