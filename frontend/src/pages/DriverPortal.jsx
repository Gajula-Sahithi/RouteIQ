import React, { useState, useEffect } from 'react';
import { ref, onValue, update } from 'firebase/database';
import { db } from '../firebase';
import { useAuth } from '../context/AuthContext';
import Layout from '../components/Layout';
import ShipmentMap from '../components/ShipmentMap';
import { 
  Navigation, MapPin, AlertTriangle, Send, 
  Route, MessageSquare, Map, X
} from 'lucide-react';

const DriverPortal = () => {
    const { user } = useAuth();
    const [myShipments, setMyShipments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [problemReport, setProblemReport] = useState({});
    const [showReportForm, setShowReportForm] = useState({});
    const [showMap, setShowMap] = useState(null);

    useEffect(() => {
        if (!user) return;

        const shipmentsRef = ref(db, 'shipments');
        const unsubscribe = onValue(shipmentsRef, (snapshot) => {
            const data = snapshot.val();
            if (data) {
                // Filter shipments by driver email (case-insensitive match)
                const userEmail = user.email?.toLowerCase();
                const filtered = Object.values(data).filter(s => {
                    const shipmentDriverEmail = s.driverEmail?.toLowerCase();
                    return shipmentDriverEmail === userEmail;
                });
                setMyShipments(filtered);
            } else {
                setMyShipments([]);
            }
            setLoading(false);
        });

        return () => unsubscribe();
    }, [user]);

    const updateStatus = async (shipmentId, status) => {
        const shipmentRef = ref(db, `shipments/${shipmentId}`);
        await update(shipmentRef, { 
            status: status,
            lastStatusUpdate: new Date().toISOString()
        });
    };

    const reportProblem = async (shipmentId) => {
        if (!problemReport[shipmentId]?.trim()) return;
        
        const shipmentRef = ref(db, `shipments/${shipmentId}`);
        await update(shipmentRef, { 
            driverProblem: problemReport[shipmentId],
            problemReportedAt: new Date().toISOString(),
            status: 'AT_RISK'
        });
        
        setProblemReport({ ...problemReport, [shipmentId]: '' });
        setShowReportForm({ ...showReportForm, [shipmentId]: false });
    };

    return (
        <Layout>
            <div className="space-y-8 pb-20 max-w-2xl mx-auto">
                <div>
                    <h1 className="text-3xl font-black text-[var(--text-primary)] tracking-tighter mb-1">Field Operations</h1>
                    <p className="text-[var(--text-tertiary)] text-sm font-medium">Assigned logistics modules for {user?.displayName}</p>
                </div>

                {loading ? (
                    <div className="flex justify-center py-20">
                        <div className="w-8 h-8 border-4 border-[var(--accent-primary)] border-t-transparent rounded-full animate-spin"></div>
                    </div>
                ) : myShipments.length === 0 ? (
                    <div className="card-premium p-12 text-center space-y-4">
                        <div className="w-16 h-16 rounded-full bg-[var(--bg-tertiary)] border border-[var(--border-primary)] flex items-center justify-center mx-auto text-[var(--text-muted)]">
                            <Navigation className="w-8 h-8" />
                        </div>
                        <h3 className="text-[var(--text-primary)] font-black uppercase tracking-widest text-xs">No Active Assignments</h3>
                        <p className="text-[var(--text-secondary)] text-[10px] uppercase font-bold tracking-tighter">Your roster is currently clear. Contact HQ for relocation.</p>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {myShipments.map(s => (
                            <div key={s.id} className="card-premium p-0 overflow-hidden border-l-4 border-l-[var(--accent-primary)]">
                                <div className="p-6 bg-[var(--bg-tertiary)]/50 flex justify-between items-start">
                                    <div>
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="px-2 py-0.5 bg-[var(--accent-primary)]/10 text-[var(--accent-primary)] text-[9px] font-black uppercase tracking-widest rounded">Active Asset</span>
                                            <h2 className="text-lg font-black text-[var(--text-primary)]">{s.id}</h2>
                                        </div>
                                        <p className="text-[10px] font-bold text-[var(--text-tertiary)] uppercase tracking-widest">{s.cargo}</p>
                                    </div>
                                    <div className={`px-3 py-1 rounded text-[10px] font-black uppercase tracking-widest border ${
                                        s.status === 'AT_RISK' ? 'text-[var(--error)] border-rose-500/20 bg-[var(--error)]/10' : 'text-[var(--success)] border-emerald-500/20 bg-[var(--success)]/10'
                                    }`}>
                                        {s.status.replace('_', ' ')}
                                    </div>
                                </div>

                                <div className="p-6 space-y-6">
                                    {/* Route Information */}
                                    <div>
                                        <div className="flex justify-between items-center mb-3">
                                            <p className="text-[9px] font-black text-[var(--text-secondary)] uppercase tracking-widest flex items-center gap-2">
                                                <Route className="w-3.5 h-3.5" />
                                                Route Information
                                            </p>
                                            <button
                                                onClick={() => setShowMap(s.id)}
                                                className="flex items-center gap-1 text-[9px] text-[var(--accent-primary)] hover:text-[var(--accent-hover)] font-black uppercase tracking-widest"
                                            >
                                                <Map className="w-3 h-3" />
                                                View Route
                                            </button>
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-1">
                                                <p className="text-[9px] font-black text-[var(--text-tertiary)] uppercase tracking-widest">Origin</p>
                                                <div className="flex items-center gap-2 text-[var(--text-primary)]">
                                                    <MapPin className="w-3.5 h-3.5 text-[var(--accent-primary)]" />
                                                    <span className="text-sm font-bold">{s.origin}</span>
                                                </div>
                                            </div>
                                            <div className="space-y-1">
                                                <p className="text-[9px] font-black text-[var(--text-tertiary)] uppercase tracking-widest">Destination</p>
                                                <div className="flex items-center gap-2 text-[var(--text-primary)]">
                                                    <Navigation className="w-3.5 h-3.5 text-[var(--accent-primary)]" />
                                                    <span className="text-sm font-bold">{s.destination}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Rerouting Alert */}
                                    {(s.status === 'AT_RISK' || s.reroutedByManager) && (
                                        <div className="bg-[var(--error)]/5 border border-rose-500/20 rounded-xl p-4 flex gap-4">
                                            <AlertTriangle className="w-5 h-5 text-[var(--error)] shrink-0" />
                                            <div>
                                                <h4 className="text-[10px] font-black text-[var(--error)] uppercase tracking-widest">Reroute Alert</h4>
                                                <p className="text-xs text-[var(--text-primary)] font-medium mt-1 italic">{s.riskReason || s.driverProblem || 'Route has been modified by Manager'}</p>
                                            </div>
                                        </div>
                                    )}

                                    {/* Problem Report to Manager/Admin */}
                                    <div>
                                        <p className="text-[9px] font-black text-[var(--text-secondary)] uppercase tracking-widest mb-3 flex items-center gap-2">
                                            <MessageSquare className="w-3.5 h-3.5" />
                                            Report Problem to HQ
                                        </p>
                                        {showReportForm[s.id] ? (
                                            <div className="space-y-3">
                                                <textarea
                                                    value={problemReport[s.id] || ''}
                                                    onChange={(e) => setProblemReport({ ...problemReport, [s.id]: e.target.value })}
                                                    placeholder="Describe the problem (e.g., road blocked, vehicle breakdown, weather conditions)..."
                                                    className="w-full bg-[var(--bg-tertiary)] border border-[var(--border-primary)] rounded-lg px-4 py-3 text-sm text-[var(--text-primary)] outline-none resize-none h-24"
                                                />
                                                <div className="flex gap-2">
                                                    <button 
                                                        onClick={() => reportProblem(s.id)}
                                                        className="flex-1 bg-[var(--accent-primary)] hover:bg-[var(--accent-hover)] text-white font-black uppercase text-[10px] py-3 rounded-xl transition-all flex items-center justify-center gap-2"
                                                    >
                                                        <Send className="w-4 h-4" /> Send Report
                                                    </button>
                                                    <button 
                                                        onClick={() => setShowReportForm({ ...showReportForm, [s.id]: false })}
                                                        className="px-4 py-3 bg-[var(--bg-tertiary)] border border-[var(--border-primary)] text-[var(--text-primary)] font-black uppercase text-[10px] rounded-xl transition-all"
                                                    >
                                                        Cancel
                                                    </button>
                                                </div>
                                            </div>
                                        ) : (
                                            <button 
                                                onClick={() => setShowReportForm({ ...showReportForm, [s.id]: true })}
                                                className="w-full bg-[var(--bg-tertiary)] border border-[var(--border-primary)] hover:border-[var(--border-hover)] text-[var(--text-primary)] font-black uppercase text-[10px] py-3 rounded-xl transition-all flex items-center justify-center gap-2"
                                            >
                                                <MessageSquare className="w-4 h-4" /> Report Problem
                                            </button>
                                        )}
                                    </div>

                                    {/* Transport Status Update */}
                                    <div>
                                        <p className="text-[9px] font-black text-[var(--text-secondary)] uppercase tracking-widest mb-3">Transport Status</p>
                                        <div className="grid grid-cols-2 gap-3">
                                            <button 
                                                onClick={() => updateStatus(s.id, 'IN_TRANSIT')}
                                                disabled={s.status === 'IN_TRANSIT' || s.status === 'DELIVERED'}
                                                className="bg-[var(--bg-tertiary)] border border-[var(--border-primary)] hover:border-[var(--accent-primary)] disabled:opacity-50 text-[var(--text-primary)] font-black uppercase text-[10px] py-3 rounded-xl transition-all flex items-center justify-center gap-2"
                                            >
                                                In Transit
                                            </button>
                                            <button 
                                                onClick={() => updateStatus(s.id, 'DELIVERED')}
                                                disabled={s.status === 'DELIVERED'}
                                                className="bg-[var(--accent-primary)] hover:bg-[var(--accent-hover)] disabled:opacity-50 text-white font-black uppercase text-[10px] py-3 rounded-xl transition-all flex items-center justify-center gap-2"
                                            >
                                                Delivered
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Route Map Modal */}
                {showMap && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                        <div className="card-premium p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <h3 className="text-xl font-black text-[var(--text-primary)] tracking-tighter mb-1">
                                        Route Navigation
                                    </h3>
                                    <p className="text-sm text-[var(--text-tertiary)]">
                                        Follow this route to complete your shipment
                                    </p>
                                </div>
                                <button 
                                    onClick={() => setShowMap(null)}
                                    className="p-2 hover:bg-[var(--bg-hover)] rounded-lg transition-colors"
                                >
                                    <X className="w-5 h-5 text-[var(--text-secondary)]" />
                                </button>
                            </div>
                            
                            {myShipments.find(s => s.id === showMap) && (
                                <div className="space-y-4">
                                    <ShipmentMap 
                                        origin={myShipments.find(s => s.id === showMap).originLat && myShipments.find(s => s.id === showMap).originLng ? {
                                            lat: myShipments.find(s => s.id === showMap).originLat,
                                            lng: myShipments.find(s => s.id === showMap).originLng
                                        } : myShipments.find(s => s.id === showMap).origin}
                                        destination={myShipments.find(s => s.id === showMap).destLat && myShipments.find(s => s.id === showMap).destLng ? {
                                            lat: myShipments.find(s => s.id === showMap).destLat,
                                            lng: myShipments.find(s => s.id === showMap).destLng
                                        } : myShipments.find(s => s.id === showMap).destination}
                                        currentLocation={myShipments.find(s => s.id === showMap).currentLat && myShipments.find(s => s.id === showMap).currentLng ? {
                                            lat: myShipments.find(s => s.id === showMap).currentLat,
                                            lng: myShipments.find(s => s.id === showMap).currentLng
                                        } : null}
                                        transportType={myShipments.find(s => s.id === showMap).transportType}
                                        shipmentId={showMap}
                                    />
                                    
                                    {myShipments.find(s => s.id === showMap).rerouteApproved && (
                                        <div className="bg-[var(--warning)]/10 border border-[var(--warning)]/20 rounded-lg p-4">
                                            <div className="flex items-start gap-3">
                                                <AlertTriangle className="w-5 h-5 text-[var(--warning)] shrink-0 mt-0.5" />
                                                <div>
                                                    <h4 className="text-[10px] font-black text-[var(--warning)] uppercase tracking-widest mb-1">Route Updated</h4>
                                                    <p className="text-xs text-[var(--text-primary)]">
                                                        Your route has been rerouted by Manager. Reason: {myShipments.find(s => s.id === showMap).riskReason || 'Safety concern or route optimization'}
                                                    </p>
                                                    <p className="text-[9px] text-[var(--text-tertiary)] mt-1">
                                                        Please follow the new route shown on the map above.
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </Layout>
    );
};

export default DriverPortal;
