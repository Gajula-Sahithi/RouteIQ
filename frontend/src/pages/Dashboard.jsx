import React, { useState, useEffect } from 'react';
import { ref, onValue } from 'firebase/database';
import { db } from '../firebase';
import Layout from '../components/Layout';
import { 
  TrendingUp, ShieldCheck, Zap, Activity, Filter, Search, 
  MapPin, Clock, ArrowRight, Anchor, Truck, Plane, Database
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const Dashboard = () => {
  const [shipments, setShipments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('ALL');
  const [searchTerm] = useState('');

  useEffect(() => {
    const shipmentsRef = ref(db, 'shipments');
    const unsubscribe = onValue(shipmentsRef, (snapshot) => {
       const data = snapshot.val();
       if (data) setShipments(Object.values(data));
       setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const stats = [
    { label: 'Network Integrity', value: '48.2%', delta: '+2.1%', icon: ShieldCheck, color: 'text-accent' },
    { label: 'Active Corridors', value: shipments.length, delta: '0', icon: Activity, color: 'text-violet' },
    { label: 'Risk Mitigation', value: '94%', delta: '+12%', icon: Zap, color: 'text-teal' },
  ];

  const getStatusStyle = (status) => {
    switch (status) {
      case 'ON_TRACK': return 'text-teal bg-teal/10 border-teal/20';
      case 'DELAYED': return 'text-danger bg-danger/10 border-danger/20';
      case 'AT_RISK': return 'text-warn bg-warn/10 border-warn/20';
      default: return 'text-text-muted bg-surface/30 border-border';
    }
  };

  const getModeIcon = (carrier) => {
    if (carrier?.toLowerCase().includes('maersk')) return Anchor;
    if (carrier?.toLowerCase().includes('fedex')) return Plane;
    return Truck;
  };

  const filteredShipments = shipments.filter(s => {
    const matchesFilter = filter === 'ALL' || s.status === filter;
    return matchesFilter;
  });

  return (
    <Layout>
      <div className="space-y-12 pb-20">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
           <div className="animate-in fade-in slide-in-from-left-4 duration-700">
              <h1 className="text-4xl font-l1-hero text-text-primary tracking-wider mb-2 uppercase">Global Overview</h1>
              <p className="text-text-muted font-l4-body text-sm flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-teal animate-pulse"></span>
                Real-time spatial monitoring engine active
              </p>
           </div>
           
           <div className="flex items-center gap-3">
              <div className="clay-card !bg-surface/20 !px-4 !py-2.5 flex items-center gap-3 border-none ring-1 ring-border/20">
                 <Search className="w-4 h-4 text-text-muted" />
                 <input 
                    type="text" 
                    placeholder="Search asset ID..." 
                    className="bg-transparent border-none outline-none text-xs text-text-primary placeholder:text-text-muted w-40 font-l4-body"
                 />
              </div>
           </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {stats.map((stat, i) => (
            <div key={i} className="clay-card p-7 group hover:-translate-y-1 duration-300">
               <div className="flex justify-between items-start mb-6">
                  <div className={`p-3 rounded-xl clay-surface !border-none ${stat.color} bg-opacity-10`}>
                    <stat.icon className="w-5 h-5" />
                  </div>
                  <span className="font-l5-micro text-text-muted">{stat.label}</span>
               </div>
               <div className="flex items-end justify-between">
                  <h4 className="text-5xl font-l1-hero text-text-primary tracking-wide leading-none">{stat.value}</h4>
                  <div className="text-right">
                    <p className="text-[10px] font-l3-data text-teal mb-0.5">{stat.delta}</p>
                    <p className="text-[10px] font-l5-micro text-text-muted">vs LAST CYCLE</p>
                  </div>
               </div>
            </div>
          ))}
        </div>

        {/* Assets Table */}
        <div className="clay-card !p-0 overflow-hidden ring-1 ring-border/10">
          <div className="p-8 border-b border-border/10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-surface/10">
             <h3 className="text-lg font-l2-card text-text-primary flex items-center gap-3">
                <div className="p-2 rounded-lg bg-accent/10 border border-accent/20">
                  <Database className="w-4 h-4 text-accent" />
                </div>
                Asset Registry
             </h3>
             <div className="flex clay-surface bg-surface/20 p-1.5 ring-1 ring-border/10">
                {['ALL', 'ON_TRACK', 'AT_RISK', 'DELAYED'].map(f => (
                  <button 
                    key={f}
                    onClick={() => setFilter(f)}
                    className={`px-4 py-2 rounded-xl text-[10px] font-l5-micro transition-all ${filter === f ? 'clay-card !bg-accent text-white border-none' : 'text-text-muted hover:text-text-primary'}`}
                  >
                    {f.replace('_', ' ')}
                  </button>
                ))}
             </div>
          </div>

          <div className="overflow-x-auto">
            <table className="table-clay">
              <thead>
                <tr>
                  <th>Asset ID & Carrier</th>
                  <th>Route Corridors</th>
                  <th className="text-center">Protocol Status</th>
                  <th>Intelligence Analysis</th>
                  <th className="text-right">Conf.</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/5">
                {loading ? (
                   [...Array(5)].map((_, i) => (
                     <tr key={i} className="animate-pulse">
                        <td colSpan={5} className="px-6 py-8 bg-surface/10"></td>
                     </tr>
                   ))
                ) : (
                <AnimatePresence>
                  {filteredShipments.map((shipment) => {
                    const ModeIcon = getModeIcon(shipment.carrier);
                    return (
                      <motion.tr 
                        key={shipment.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="group transition-colors"
                      >
                        <td className="px-6 py-6 font-l4-body">
                           <div className="flex items-center gap-4">
                              <div className="w-12 h-12 clay-card !p-0 flex items-center justify-center bg-surface/40">
                                 <ModeIcon className="w-6 h-6 text-text-muted group-hover:text-accent transition-colors" />
                              </div>
                              <div>
                                 <p className="text-sm font-l2-card text-text-primary tracking-tight">{shipment.id}</p>
                                 <p className="font-l5-micro text-text-muted mt-1">{shipment.carrier || 'Global Fleet'}</p>
                              </div>
                           </div>
                        </td>
                        <td className="px-6 py-6 font-l4-body">
                           <div className="flex items-center gap-3 text-text-primary font-medium">
                              <span className="text-xs uppercase">{shipment.origin}</span>
                              <ArrowRight className="w-3 h-3 text-accent" />
                              <span className="text-xs uppercase">{shipment.destination}</span>
                           </div>
                           <div className="flex items-center gap-2 mt-2.5">
                              <span className={`px-2 py-0.5 rounded-lg font-l5-micro !tracking-normal ${
                                shipment.transportType === 'Road' ? 'bg-blue-500/10 text-blue-500' :
                                shipment.transportType === 'Rail' ? 'bg-purple-500/10 text-purple-500' :
                                shipment.transportType === 'Air' ? 'bg-cyan-500/10 text-cyan-500' :
                                shipment.transportType === 'Sea' ? 'bg-teal-500/10 text-teal-500' :
                                'bg-text-muted/10 text-text-muted'
                              }`}>
                                {shipment.transportType || 'Standard'}
                              </span>
                              {shipment.currentLat && (
                                <span className="font-l5-micro text-teal lowercase italic opacity-80">
                                  gps telemetry active
                                </span>
                              )}
                           </div>
                        </td>
                        <td className="px-6 py-6 text-center">
                           <span className={`px-3 py-1.5 rounded-lg font-l5-micro border !tracking-[0.1em] ${getStatusStyle(shipment.status)}`}>
                              {shipment.status?.replace('_', ' ') || 'STANDBY'}
                           </span>
                        </td>
                        <td className="px-6 py-6 max-w-xs">
                           <p className="text-xs text-text-muted font-l4-body leading-relaxed line-clamp-2">
                              {shipment.riskReason || "No volatility detected. Optimized transit expected."}
                           </p>
                        </td>
                        <td className="px-6 py-6 text-right font-l3-data text-accent">
                           {shipment.confidence || '0.94'}
                        </td>
                      </motion.tr>
                    );
                  })}
                </AnimatePresence>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Dashboard;
