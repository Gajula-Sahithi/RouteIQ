import React, { useState, useEffect } from 'react';
import { ref, onValue, update, remove } from 'firebase/database';
import { db } from '../firebase';
import Layout from '../components/Layout';
import { 
    CheckCircle, XCircle, Truck, MapPin, User, Calendar, 
    AlertCircle, Package, ArrowRight, Clock, Filter, Search,
    CheckCircle2, X
} from 'lucide-react';

const AdminShipmentApproval = () => {
    const [shipments, setShipments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('PENDING'); // 'ALL', 'PENDING', 'APPROVED', 'REJECTED'
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedShipment, setSelectedShipment] = useState(null);

    useEffect(() => {
        const shipmentsRef = ref(db, 'shipments');
        const unsubscribe = onValue(shipmentsRef, (snapshot) => {
            const data = snapshot.val();
            if (data) {
                const shipmentList = Object.entries(data).map(([id, info]) => ({
                    id,
                    ...info
                }));
                setShipments(shipmentList);
            } else {
                setShipments([]);
            }
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const handleApprove = async (shipmentId) => {
        const shipmentRef = ref(db, `shipments/${shipmentId}`);
        await update(shipmentRef, {
            status: 'ON_TRACK',
            approvedAt: new Date().toISOString(),
            requiresApproval: false,
            lastUpdated: new Date().toISOString()
        });
        setSelectedShipment(null);
    };

    const handleReject = async (shipmentId) => {
        const shipmentRef = ref(db, `shipments/${shipmentId}`);
        await update(shipmentRef, {
            status: 'REJECTED',
            rejectedAt: new Date().toISOString(),
            lastUpdated: new Date().toISOString()
        });
        setSelectedShipment(null);
    };

    const handleDelete = async (shipmentId) => {
        if (window.confirm('Are you sure you want to delete this shipment?')) {
            await remove(ref(db, `shipments/${shipmentId}`));
            setSelectedShipment(null);
        }
    };

    const filteredShipments = shipments.filter(s => {
        // Filter by status
        if (filter === 'PENDING') return s.status === 'PENDING_APPROVAL' || s.requiresApproval;
        if (filter === 'APPROVED') return s.status === 'ON_TRACK';
        if (filter === 'REJECTED') return s.status === 'REJECTED';
        
        // Filter by search
        if (searchTerm) {
            const search = searchTerm.toLowerCase();
            return (
                s.id?.toLowerCase().includes(search) ||
                s.origin?.toLowerCase().includes(search) ||
                s.destination?.toLowerCase().includes(search) ||
                s.createdByName?.toLowerCase().includes(search)
            );
        }
        return true;
    });

    const getStatusColor = (status) => {
        switch (status) {
            case 'ON_TRACK': return 'text-emerald-400 bg-[var(--success)]/10 border-emerald-500/30';
            case 'PENDING_APPROVAL': return 'text-amber-400 bg-[var(--warning)]/10 border-amber-500/30';
            case 'REJECTED': return 'text-rose-400 bg-[var(--error)]/10 border-rose-500/30';
            case 'AT_RISK': return 'text-red-400 bg-red-500/10 border-red-500/30';
            default: return 'text-[var(--text-muted)] bg-zinc-500/10 border-zinc-500/30';
        }
    };

    const stats = {
        pending: shipments.filter(s => s.status === 'PENDING_APPROVAL' || s.requiresApproval).length,
        approved: shipments.filter(s => s.status === 'ON_TRACK').length,
        rejected: shipments.filter(s => s.status === 'REJECTED').length,
        total: shipments.length
    };

    return (
        <Layout>
            <div className="space-y-8 pb-20">
                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
                    <div>
                        <h1 className="text-3xl font-black text-[var(--text-primary)] tracking-tighter mb-1">Shipment Approval</h1>
                        <p className="text-[var(--text-tertiary)] text-sm font-medium">Review and approve pending logistics entries</p>
                    </div>
                    
                    {/* Stats */}
                    <div className="flex gap-4">
                        <div className="bg-[var(--bg-tertiary)]/50 border border-[var(--border-primary)] rounded-xl px-4 py-2">
                            <span className="text-[10px] font-black text-[var(--text-tertiary)] uppercase tracking-widest">Pending</span>
                            <p className="text-2xl font-black text-amber-400">{stats.pending}</p>
                        </div>
                        <div className="bg-[var(--bg-tertiary)]/50 border border-[var(--border-primary)] rounded-xl px-4 py-2">
                            <span className="text-[10px] font-black text-[var(--text-tertiary)] uppercase tracking-widest">Approved</span>
                            <p className="text-2xl font-black text-emerald-400">{stats.approved}</p>
                        </div>
                    </div>
                </div>

                {/* Filters */}
                <div className="flex flex-col md:flex-row gap-4 items-center">
                    <div className="flex items-center gap-2 bg-[var(--bg-tertiary)]/50 border border-[var(--border-primary)] rounded-xl p-1">
                        {['ALL', 'PENDING', 'APPROVED', 'REJECTED'].map((f) => (
                            <button
                                key={f}
                                onClick={() => setFilter(f)}
                                className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-tighter transition-all ${
                                    filter === f 
                                        ? 'bg-blue-600 text-[var(--text-primary)]' 
                                        : 'text-[var(--text-tertiary)] hover:text-[var(--text-primary)]'
                                }`}
                            >
                                {f}
                            </button>
                        ))}
                    </div>

                    <div className="flex items-center gap-3 max-w-md bg-[var(--bg-tertiary)] border border-[var(--border-primary)] rounded-xl px-4 py-3 flex-1">
                        <Search className="w-5 h-5 text-[var(--text-secondary)]" />
                        <input 
                            type="text" 
                            placeholder="Search shipments..." 
                            className="bg-transparent border-none outline-none text-sm text-[var(--text-primary)] placeholder:text-[var(--text-secondary)] w-full"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                {/* Shipments List */}
                <div className="card-premium p-0 overflow-hidden">
                    <div className="p-6 border-b border-[var(--border-primary)] bg-[var(--bg-tertiary)]/50 flex items-center gap-3">
                        <CheckCircle className="w-5 h-5 text-blue-500" />
                        <h3 className="text-sm font-black text-[var(--text-primary)] uppercase tracking-widest">
                            {filter === 'ALL' ? 'All Shipments' : `${filter} Shipments`}
                        </h3>
                        <span className="ml-auto text-xs text-[var(--text-tertiary)] font-bold">{filteredShipments.length} entries</span>
                    </div>

                    {loading ? (
                        <div className="p-12 text-center text-[var(--text-secondary)] font-bold uppercase tracking-widest animate-pulse">
                            Loading Shipments...
                        </div>
                    ) : filteredShipments.length === 0 ? (
                        <div className="p-12 text-center">
                            <div className="w-16 h-16 rounded-full bg-[var(--bg-tertiary)] border border-[var(--border-primary)] flex items-center justify-center mx-auto text-zinc-700 mb-4">
                                <Package className="w-8 h-8" />
                            </div>
                            <h3 className="text-[var(--text-primary)] font-black uppercase tracking-widest text-xs mb-2">No Shipments Found</h3>
                            <p className="text-[var(--text-secondary)] text-[10px] uppercase font-bold tracking-tighter">
                                {filter === 'PENDING' ? 'No pending approvals at this time.' : 'No shipments match your criteria.'}
                            </p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-[var(--bg-tertiary)]/30 text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-widest border-b border-[var(--border-primary)]">
                                        <th className="px-6 py-4">Shipment ID</th>
                                        <th className="px-6 py-4">Created By</th>
                                        <th className="px-6 py-4">Route</th>
                                        <th className="px-6 py-4">Cargo</th>
                                        <th className="px-6 py-4">Status</th>
                                        <th className="px-6 py-4 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-zinc-900">
                                    {filteredShipments.map((s) => (
                                        <tr key={s.id} className="hover:bg-[var(--bg-tertiary)]/40 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-full bg-[var(--bg-tertiary)] border border-[var(--border-primary)] flex items-center justify-center">
                                                        <Truck className="w-5 h-5 text-[var(--text-secondary)]" />
                                                    </div>
                                                    <span className="text-sm font-bold text-[var(--text-primary)]">{s.id}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2 text-[var(--text-muted)]">
                                                    <User className="w-3.5 h-3.5" />
                                                    <span className="text-xs">{s.createdByName || 'Unknown'}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2 text-zinc-300 text-xs">
                                                    <MapPin className="w-3.5 h-3.5 text-[var(--text-tertiary)]" />
                                                    {s.origin}
                                                    <ArrowRight className="w-3 h-3 text-[var(--text-secondary)]" />
                                                    {s.destination}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-[var(--text-muted)] text-xs">
                                                {s.cargo || 'N/A'}
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`px-2.5 py-1 rounded-sm text-[9px] font-black uppercase tracking-[0.15em] border ${getStatusColor(s.status)}`}>
                                                    {s.status?.replace('_', ' ') || 'UNKNOWN'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                {s.status === 'PENDING_APPROVAL' || s.requiresApproval ? (
                                                    <div className="flex justify-end gap-2">
                                                        <button
                                                            onClick={() => setSelectedShipment(s)}
                                                            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-[var(--text-primary)] rounded-md text-[10px] font-black uppercase tracking-tighter transition-all"
                                                        >
                                                            Review
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <button
                                                        onClick={() => setSelectedShipment(s)}
                                                        className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-[var(--text-muted)] rounded-md text-[10px] font-black uppercase tracking-tighter transition-all"
                                                    >
                                                        View
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>

            {/* Detail Modal */}
            {selectedShipment && (
                <div className="fixed inset-0 bg-[var(--bg-primary)]/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-[var(--bg-tertiary)] border border-[var(--border-primary)] rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="p-6 border-b border-[var(--border-primary)] flex justify-between items-center">
                            <h2 className="text-xl font-black text-[var(--text-primary)]">Shipment Details</h2>
                            <button 
                                onClick={() => setSelectedShipment(null)}
                                className="w-8 h-8 rounded-lg bg-zinc-800 hover:bg-zinc-700 flex items-center justify-center text-[var(--text-muted)]"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                        
                        <div className="p-6 space-y-6">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-[var(--bg-tertiary)]/50 border border-[var(--border-primary)] rounded-xl p-4">
                                    <span className="text-[10px] font-black text-[var(--text-tertiary)] uppercase tracking-widest">Shipment ID</span>
                                    <p className="text-lg font-bold text-[var(--text-primary)] mt-1">{selectedShipment.id}</p>
                                </div>
                                <div className="bg-[var(--bg-tertiary)]/50 border border-[var(--border-primary)] rounded-xl p-4">
                                    <span className="text-[10px] font-black text-[var(--text-tertiary)] uppercase tracking-widest">Status</span>
                                    <span className={`inline-block px-2.5 py-1 rounded-sm text-[9px] font-black uppercase tracking-[0.15em] border mt-2 ${getStatusColor(selectedShipment.status)}`}>
                                        {selectedShipment.status?.replace('_', ' ')}
                                    </span>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div className="flex items-center gap-4 p-4 bg-[var(--bg-tertiary)]/50 border border-[var(--border-primary)] rounded-xl">
                                    <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center">
                                        <User className="w-5 h-5 text-blue-500" />
                                    </div>
                                    <div>
                                        <span className="text-[10px] font-black text-[var(--text-tertiary)] uppercase tracking-widest">Created By</span>
                                        <p className="text-[var(--text-primary)] font-bold">{selectedShipment.createdByName}</p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-4 p-4 bg-[var(--bg-tertiary)]/50 border border-[var(--border-primary)] rounded-xl">
                                    <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center">
                                        <MapPin className="w-5 h-5 text-[var(--text-muted)]" />
                                    </div>
                                    <div className="flex-1">
                                        <span className="text-[10px] font-black text-[var(--text-tertiary)] uppercase tracking-widest">Route</span>
                                        <div className="flex items-center gap-2 mt-1">
                                            <span className="text-[var(--text-primary)] font-bold">{selectedShipment.origin}</span>
                                            <ArrowRight className="w-4 h-4 text-[var(--text-secondary)]" />
                                            <span className="text-[var(--text-primary)] font-bold">{selectedShipment.destination}</span>
                                        </div>
                                    </div>
                                </div>

                                {selectedShipment.cargo && (
                                    <div className="flex items-center gap-4 p-4 bg-[var(--bg-tertiary)]/50 border border-[var(--border-primary)] rounded-xl">
                                        <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center">
                                            <Package className="w-5 h-5 text-[var(--text-muted)]" />
                                        </div>
                                        <div>
                                            <span className="text-[10px] font-black text-[var(--text-tertiary)] uppercase tracking-widest">Cargo</span>
                                            <p className="text-[var(--text-primary)] font-bold">{selectedShipment.cargo}</p>
                                            {selectedShipment.weight && (
                                                <p className="text-xs text-[var(--text-tertiary)]">Weight: {selectedShipment.weight} kg</p>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {selectedShipment.notes && (
                                    <div className="p-4 bg-[var(--warning)]/5 border border-amber-500/20 rounded-xl">
                                        <span className="text-[10px] font-black text-[var(--warning)] uppercase tracking-widest">Driver Notes</span>
                                        <p className="text-zinc-300 text-sm mt-1">{selectedShipment.notes}</p>
                                    </div>
                                )}
                            </div>

                            {/* Action Buttons */}
                            {(selectedShipment.status === 'PENDING_APPROVAL' || selectedShipment.requiresApproval) && (
                                <div className="flex gap-4 pt-4 border-t border-[var(--border-primary)]">
                                    <button
                                        onClick={() => handleReject(selectedShipment.id)}
                                        className="flex-1 bg-rose-600 hover:bg-[var(--error)] text-[var(--text-primary)] font-bold py-4 rounded-xl transition-all flex items-center justify-center gap-2"
                                    >
                                        <XCircle className="w-5 h-5" />
                                        Reject Shipment
                                    </button>
                                    <button
                                        onClick={() => handleApprove(selectedShipment.id)}
                                        className="flex-1 bg-emerald-600 hover:bg-[var(--success)] text-[var(--text-primary)] font-bold py-4 rounded-xl transition-all flex items-center justify-center gap-2"
                                    >
                                        <CheckCircle2 className="w-5 h-5" />
                                        Approve Shipment
                                    </button>
                                </div>
                            )}
                            
                            {selectedShipment.status !== 'PENDING_APPROVAL' && !selectedShipment.requiresApproval && (
                                <button
                                    onClick={() => handleDelete(selectedShipment.id)}
                                    className="w-full bg-zinc-800 hover:bg-rose-600 text-[var(--text-muted)] hover:text-[var(--text-primary)] font-bold py-3 rounded-xl transition-all"
                                >
                                    Delete Shipment
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </Layout>
    );
};

export default AdminShipmentApproval;
