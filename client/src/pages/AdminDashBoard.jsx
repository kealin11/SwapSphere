import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuth from '../hooks/useAuth';

// ─── Re-use the same base URL your existing api.js uses ───────────────────────
// Adjust this import to wherever your axios instance / API helpers live
import axios from 'axios';

const API_BASE = 'https://swapsphere-backend-bg1p.onrender.com/api';

function adminAPI(token) {
const headers = { Authorization: `Bearer ${token}` };
return {
getUsers: () => axios.get(`${API_BASE}/admin/users`, { headers }),
blockUser: (id) => axios.patch(`${API_BASE}/admin/users/${id}/block`, {}, { headers }),
unblockUser: (id) => axios.patch(`${API_BASE}/admin/users/${id}/unblock`, {}, { headers }),
deleteUser: (id) => axios.delete(`${API_BASE}/admin/users/${id}`, { headers }),
getListings: () => axios.get(`${API_BASE}/admin/listings`, { headers }),
deleteListing:(id) => axios.delete(`${API_BASE}/admin/listings/${id}`, { headers }),
getOrders: () => axios.get(`${API_BASE}/admin/orders`, { headers }),
};
}

// ─── Small reusable stat card ──────────────────────────────────────────────────
function StatCard({ label, value, color = 'text-gray-900' }) {
return (
<div className="rounded-lg bg-white p-6 shadow-md">
<p className="text-sm text-gray-500 font-semibold">{label}</p>
<p className={`mt-2 text-3xl font-bold ${color}`}>{value}</p>
</div>
);
}

// ─── Toast ─────────────────────────────────────────────────────────────────────
function Toast({ message, type, onClose }) {
useEffect(() => {
const t = setTimeout(onClose, 3500);
return () => clearTimeout(t);
}, [onClose]);

return (
<div
className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 rounded-lg px-5 py-3 shadow-xl text-white text-sm font-semibold
${type === 'success' ? 'bg-green-600' : 'bg-red-600'}`}
>
<span>{type === 'success' ? '✓' : '✕'}</span>
<span>{message}</span>
<button onClick={onClose} className="ml-2 opacity-70 hover:opacity-100">✕</button>
</div>
);
}

// ─── Confirm modal ─────────────────────────────────────────────────────────────
function ConfirmModal({ message, onConfirm, onCancel }) {
return (
<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
<div className="bg-white rounded-xl shadow-2xl p-8 max-w-sm w-full mx-4">
<p className="text-gray-800 font-semibold text-lg mb-6">{message}</p>
<div className="flex gap-3">
<button
onClick={onConfirm}
className="flex-1 rounded-lg bg-red-600 text-white py-2 font-semibold hover:bg-red-700 transition"
>
Confirm
</button>
<button
onClick={onCancel}
className="flex-1 rounded-lg bg-gray-100 text-gray-700 py-2 font-semibold hover:bg-gray-200 transition"
>
Cancel
</button>
</div>
</div>
</div>
);
}

// ═══════════════════════════════════════════════════════════════════════════════
export default function AdminDashboard() {
const navigate = useNavigate();
const { user, logout } = useAuth();
const token = localStorage.getItem('token'); // adjust if you store JWT differently
const api = adminAPI(token);

// ── State ──────────────────────────────────────────────────────────────────
const [activeTab, setActiveTab] = useState('overview');
const [users, setUsers] = useState([]);
const [listings, setListings] = useState([]);
const [orders, setOrders] = useState([]);
const [loading, setLoading] = useState(true);
const [toast, setToast] = useState(null);
const [confirm, setConfirm] = useState(null); // { message, onConfirm }
const [search, setSearch] = useState('');

const showToast = (message, type = 'success') => setToast({ message, type });

// ── Fetch all data ─────────────────────────────────────────────────────────
const fetchAll = useCallback(async () => {
setLoading(true);
try {
const [u, l, o] = await Promise.allSettled([
api.getUsers(),
api.getListings(),
api.getOrders(),
]);
if (u.status === 'fulfilled') setUsers(u.value.data.users ?? []);
if (l.status === 'fulfilled') setListings(l.value.data.listings ?? []);
if (o.status === 'fulfilled') setOrders(o.value.data.orders ?? []);
} catch (err) {
showToast('Failed to load data', 'error');
} finally {
setLoading(false);
}
}, []); // eslint-disable-line

useEffect(() => { fetchAll(); }, [fetchAll]);

// ── Actions ────────────────────────────────────────────────────────────────
const handleBlockToggle = (u) => {
const isBlocked = u.status === 'blocked';
setConfirm({
message: `${isBlocked ? 'Unblock' : 'Block'} ${u.name}?`,
onConfirm: async () => {
setConfirm(null);
try {
isBlocked ? await api.unblockUser(u.id) : await api.blockUser(u.id);
setUsers((prev) =>
prev.map((x) =>
x.id === u.id ? { ...x, status: isBlocked ? 'active' : 'blocked' } : x
)
);
showToast(`User ${isBlocked ? 'unblocked' : 'blocked'} successfully`);
} catch {
showToast('Action failed', 'error');
}
},
});
};

const handleDeleteUser = (u) => {
setConfirm({
message: `Permanently remove ${u.name}? This cannot be undone.`,
onConfirm: async () => {
setConfirm(null);
try {
await api.deleteUser(u.id);
setUsers((prev) => prev.filter((x) => x.id !== u.id));
showToast('User removed');
} catch {
showToast('Failed to remove user', 'error');
}
},
});
};

const handleDeleteListing = (l) => {
setConfirm({
message: `Remove listing "${l.title}"?`,
onConfirm: async () => {
setConfirm(null);
try {
await api.deleteListing(l.id);
setListings((prev) => prev.filter((x) => x.id !== l.id));
showToast('Listing removed');
} catch {
showToast('Failed to remove listing', 'error');
}
},
});
};

const handleLogout = () => { logout(); navigate('/login', { replace: true }); };

// ── Derived stats ──────────────────────────────────────────────────────────
const totalUsers = users.length;
const blockedUsers = users.filter((u) => u.status === 'blocked').length;
const activeListings = listings.filter((l) => l.status !== 'sold').length;
const totalRevenue = orders.reduce((sum, o) => sum + (Number(o.amount) || 0), 0);

// ── Filtered lists ─────────────────────────────────────────────────────────
const filteredUsers = users.filter(
(u) =>
u.name?.toLowerCase().includes(search.toLowerCase()) ||
u.email?.toLowerCase().includes(search.toLowerCase())
);

const filteredListings = listings.filter(
(l) =>
l.title?.toLowerCase().includes(search.toLowerCase()) ||
l.seller_name?.toLowerCase().includes(search.toLowerCase())
);

// ── Tab definitions ────────────────────────────────────────────────────────
const tabs = [
{ id: 'overview', label: 'Overview' },
{ id: 'users', label: `Users (${totalUsers})` },
{ id: 'listings', label: `Listings (${listings.length})` },
{ id: 'orders', label: `Orders (${orders.length})` },
];

// ═══════════════════════════════════════════════════════════════════════════
return (
<div className="min-h-screen bg-gray-100">

{/* ── Top Nav ─────────────────────────────────────────────────────────── */}
<header className="bg-white shadow-sm sticky top-0 z-40">
<div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
<div className="flex items-center gap-3">
<div className="h-8 w-8 rounded-lg bg-red-600 flex items-center justify-center">
<svg className="h-5 w-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
</svg>
</div>
<div>
<span className="font-bold text-gray-900 text-lg">SwapSphere SA</span>
<span className="ml-2 text-xs bg-red-100 text-red-700 font-bold px-2 py-0.5 rounded-full uppercase tracking-wide">
Admin
</span>
</div>
</div>
<div className="flex items-center gap-4">
<span className="text-sm text-gray-600 hidden sm:block">
Logged in as <span className="font-semibold text-gray-900">{user?.name}</span>
</span>
<button
onClick={handleLogout}
className="rounded-lg bg-gray-100 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-200 transition"
>
Logout
</button>
</div>
</div>
</header>

<main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">

{/* ── Page heading ────────────────────────────────────────────────── */}
<div className="mb-8">
<h1 className="text-4xl font-bold text-gray-900">Admin Dashboard</h1>
<p className="mt-2 text-gray-600">Full site control — manage users, listings, and orders.</p>
</div>

{/* ── Tabs ────────────────────────────────────────────────────────── */}
<div className="mb-8 flex gap-1 bg-white rounded-xl p-1 shadow-md w-fit">
{tabs.map((t) => (
<button
key={t.id}
onClick={() => { setActiveTab(t.id); setSearch(''); }}
className={`px-5 py-2 rounded-lg text-sm font-semibold transition
${activeTab === t.id
? 'bg-red-600 text-white shadow'
: 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'}`}
>
{t.label}
</button>
))}
</div>

{/* ── Loading ─────────────────────────────────────────────────────── */}
{loading && (
<div className="rounded-lg bg-white p-8 shadow-md animate-pulse space-y-4">
{[...Array(4)].map((_, i) => <div key={i} className="h-10 bg-gray-200 rounded" />)}
</div>
)}

{!loading && (
<>
{/* ════════════════ OVERVIEW TAB ════════════════ */}
{activeTab === 'overview' && (
<div className="space-y-8">
<div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
<StatCard label="Total Users" value={totalUsers} />
<StatCard label="Blocked Users" value={blockedUsers} color="text-red-600" />
<StatCard label="Active Listings" value={activeListings} color="text-blue-600"/>
<StatCard label="Total Revenue" value={`R${totalRevenue.toFixed(2)}`} color="text-green-600" />
</div>

{/* Recent users preview */}
<div className="rounded-lg bg-white shadow-md overflow-hidden">
<div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
<h2 className="font-bold text-gray-900 text-lg">Recent Users</h2>
<button onClick={() => setActiveTab('users')}
className="text-sm text-red-600 font-semibold hover:underline">
View All →
</button>
</div>
<table className="w-full text-sm">
<thead className="bg-gray-50">
<tr>
{['Name', 'Email', 'Role', 'Status'].map((h) => (
<th key={h} className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wide">{h}</th>
))}
</tr>
</thead>
<tbody className="divide-y divide-gray-100">
{users.slice(0, 5).map((u) => (
<tr key={u.id} className="hover:bg-gray-50">
<td className="px-6 py-3 font-semibold text-gray-900">{u.name}</td>
<td className="px-6 py-3 text-gray-600">{u.email}</td>
<td className="px-6 py-3">
<span className={`px-2 py-0.5 rounded-full text-xs font-bold uppercase
${u.role === 'admin' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'}`}>
{u.role}
</span>
</td>
<td className="px-6 py-3">
<span className={`px-2 py-0.5 rounded-full text-xs font-bold uppercase
${u.status === 'blocked' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
{u.status ?? 'active'}
</span>
</td>
</tr>
))}
</tbody>
</table>
</div>
</div>
)}

{/* ════════════════ USERS TAB ════════════════ */}
{activeTab === 'users' && (
<div className="space-y-4">
<input
type="text"
placeholder="Search users by name or email…"
value={search}
onChange={(e) => setSearch(e.target.value)}
className="w-full max-w-md rounded-lg border border-gray-200 px-4 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-red-500"
/>
<div className="rounded-lg bg-white shadow-md overflow-x-auto">
<table className="w-full text-sm min-w-[700px]">
<thead className="bg-gray-50">
<tr>
{['Name', 'Email', 'Role', 'Status', 'Wallet Balance', 'Actions'].map((h) => (
<th key={h} className="px-5 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wide">{h}</th>
))}
</tr>
</thead>
<tbody className="divide-y divide-gray-100">
{filteredUsers.map((u) => (
<tr key={u.id} className={`hover:bg-gray-50 ${u.status === 'blocked' ? 'opacity-60' : ''}`}>
<td className="px-5 py-3 font-semibold text-gray-900">{u.name}</td>
<td className="px-5 py-3 text-gray-600">{u.email}</td>
<td className="px-5 py-3">
<span className={`px-2 py-0.5 rounded-full text-xs font-bold uppercase
${u.role === 'admin' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'}`}>
{u.role}
</span>
</td>
<td className="px-5 py-3">
<span className={`px-2 py-0.5 rounded-full text-xs font-bold uppercase
${u.status === 'blocked' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
{u.status ?? 'active'}
</span>
</td>
<td className="px-5 py-3 font-semibold text-gray-900">
R{Number(u.wallet_balance || 0).toFixed(2)}
</td>
<td className="px-5 py-3">
{u.role !== 'admin' && (
<div className="flex gap-2">
<button
onClick={() => handleBlockToggle(u)}
className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition
${u.status === 'blocked'
? 'bg-green-100 text-green-700 hover:bg-green-200'
: 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'}`}
>
{u.status === 'blocked' ? 'Unblock' : 'Block'}
</button>
<button
onClick={() => handleDeleteUser(u)}
className="rounded-lg bg-red-100 px-3 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-200 transition"
>
Remove
</button>
</div>
)}
{u.role === 'admin' && (
<span className="text-xs text-gray-400 italic">Protected</span>
)}
</td>
</tr>
))}
{filteredUsers.length === 0 && (
<tr><td colSpan={6} className="px-5 py-8 text-center text-gray-400">No users found</td></tr>
)}
</tbody>
</table>
</div>
</div>
)}

{/* ════════════════ LISTINGS TAB ════════════════ */}
{activeTab === 'listings' && (
<div className="space-y-4">
<input
type="text"
placeholder="Search listings by title or seller…"
value={search}
onChange={(e) => setSearch(e.target.value)}
className="w-full max-w-md rounded-lg border border-gray-200 px-4 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-red-500"
/>
<div className="rounded-lg bg-white shadow-md overflow-x-auto">
<table className="w-full text-sm min-w-[700px]">
<thead className="bg-gray-50">
<tr>
{['Title', 'Seller', 'Category', 'Price', 'Status', 'Actions'].map((h) => (
<th key={h} className="px-5 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wide">{h}</th>
))}
</tr>
</thead>
<tbody className="divide-y divide-gray-100">
{filteredListings.map((l) => (
<tr key={l.id} className="hover:bg-gray-50">
<td className="px-5 py-3 font-semibold text-gray-900 max-w-[180px] truncate">{l.title}</td>
<td className="px-5 py-3 text-gray-600">{l.seller_name}</td>
<td className="px-5 py-3 text-gray-600">{l.category}</td>
<td className="px-5 py-3 font-semibold text-blue-600">R{Number(l.price).toFixed(2)}</td>
<td className="px-5 py-3">
<span className={`px-2 py-0.5 rounded-full text-xs font-bold uppercase
${l.status === 'sold' ? 'bg-gray-100 text-gray-600'
: l.status === 'active' ? 'bg-green-100 text-green-700'
: 'bg-yellow-100 text-yellow-700'}`}>
{l.status}
</span>
</td>
<td className="px-5 py-3">
<button
onClick={() => handleDeleteListing(l)}
className="rounded-lg bg-red-100 px-3 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-200 transition"
>
Remove
</button>
</td>
</tr>
))}
{filteredListings.length === 0 && (
<tr><td colSpan={6} className="px-5 py-8 text-center text-gray-400">No listings found</td></tr>
)}
</tbody>
</table>
</div>
</div>
)}

{/* ════════════════ ORDERS TAB ════════════════ */}
{activeTab === 'orders' && (
<div className="rounded-lg bg-white shadow-md overflow-x-auto">
<table className="w-full text-sm min-w-[800px]">
<thead className="bg-gray-50">
<tr>
{['Order ID', 'Listing', 'Buyer', 'Seller', 'Amount', 'Status', 'Date'].map((h) => (
<th key={h} className="px-5 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wide">{h}</th>
))}
</tr>
</thead>
<tbody className="divide-y divide-gray-100">
{orders.map((o) => (
<tr key={o.id} className="hover:bg-gray-50">
<td className="px-5 py-3 text-gray-500 font-mono text-xs">#{o.id}</td>
<td className="px-5 py-3 font-semibold text-gray-900 max-w-[150px] truncate">{o.listing_title}</td>
<td className="px-5 py-3 text-gray-600">{o.buyer_name}</td>
<td className="px-5 py-3 text-gray-600">{o.seller_name}</td>
<td className="px-5 py-3 font-semibold text-green-600">R{Number(o.amount).toFixed(2)}</td>
<td className="px-5 py-3">
<span className={`px-2 py-0.5 rounded-full text-xs font-bold uppercase
${o.status === 'completed' ? 'bg-green-100 text-green-700'
: o.status === 'pending' ? 'bg-yellow-100 text-yellow-700'
: 'bg-gray-100 text-gray-600'}`}>
{o.status}
</span>
</td>
<td className="px-5 py-3 text-gray-500 text-xs">
{new Date(o.created_at).toLocaleDateString('en-ZA')}
</td>
</tr>
))}
{orders.length === 0 && (
<tr><td colSpan={7} className="px-5 py-8 text-center text-gray-400">No orders found</td></tr>
)}
</tbody>
</table>
</div>
)}
</>
)}
</main>

{/* ── Confirm Modal ─────────────────────────────────────────────────────── */}
{confirm && (
<ConfirmModal
message={confirm.message}
onConfirm={confirm.onConfirm}
onCancel={() => setConfirm(null)}
/>
)}

{/* ── Toast ─────────────────────────────────────────────────────────────── */}
{toast && (
<Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
)}
</div>
);
}
