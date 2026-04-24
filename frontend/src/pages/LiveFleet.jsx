import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { ref, onValue } from 'firebase/database';
import { db } from '../firebase';
import Layout from '../components/Layout';
import { useTheme } from '../context/ThemeContext';
import { 
  Truck, Plane, Anchor, Train, 
  MapPin, Navigation, Info, Maximize2, 
  Search, Crosshair, Activity, AlertTriangle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// Fix for leaflet marker icons in React
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Component to handle map center changes
const MapController = ({ center, zoom }) => {
  const map = useMap();
  useEffect(() => {
    if (center) {
      map.setView(center, zoom || 10, { animate: true });
    }
  }, [center, zoom, map]);
  return null;
};

const LiveFleet = () => {
  const [shipments, setShipments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedShipment, setSelectedShipment] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const { isDark } = useTheme();

  useEffect(() => {
    const shipmentsRef = ref(db, 'shipments');
    const unsubscribe = onValue(shipmentsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const list = Object.values(data).filter(s => s.currentLat && s.currentLng);
        setShipments(list);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const getTransportIcon = (type) => {
    switch (type) {
      case 'Air': return Plane;
      case 'Sea': return Anchor;
      case 'Rail': return Train;
      default: return Truck;
    }
  };

  const getMarkerIcon = (shipment) => {
    const color = shipment.status === 'AT_RISK' ? '#FF9F2E' : 
                  (shipment.status === 'DELAYED' ? '#FF3355' : '#2B5EFF');
    
    return L.divIcon({
      className: 'custom-fleet-icon',
      html: `
        <div style="position: relative;">
          <div style="background-color: ${color}; width: 16px; height: 16px; border-radius: 50%; border: 3px solid #FFFFFF; box-shadow: 0 0 15px ${color};"></div>
          ${shipment.status !== 'ON_TRACK' ? `<div style="position: absolute; top: -4px; right: -4px; width: 8px; height: 8px; background: white; border-radius: 50%; border: 2px solid ${color};"></div>` : ''}
        </div>
      `,
      iconSize: [24, 24],
      iconAnchor: [12, 12]
    });
  };

  const filteredShipments = shipments.filter(s => 
    s.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.carrier?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const stats = {
    total: shipments.length,
    active: shipments.filter(s => s.status === 'ON_TRACK').length,
    risk: shipments.filter(s => ['AT_RISK', 'DELAYED'].includes(s.status)).length
  };

  return (
    <Layout>
      <div className="h-[calc(100vh-160px)] flex flex-col space-y-8">
        {/* Header Control Bar */}
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 animate-in fade-in slide-in-from-top-4 duration-700">
          <div>
            <h1 className="text-4xl font-l1-hero text-text-primary tracking-wide uppercase">Fleet Operations</h1>
            <p className="font-l5-micro text-accent tracking-[0.4em] mt-1 italic">Real-time Global Asset Telemetry</p>
          </div>

          <div className="flex items-center gap-4 w-full md:w-auto">
             <div className="flex-1 clay-surface !px-4 !py-2 flex items-center gap-3">
                <Search className="w-4 h-4 text-text-muted" />
                <input 
                  type="text" 
                  placeholder="Trace Asset ID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="bg-transparent border-none outline-none text-xs text-text-primary placeholder:text-text-muted font-l4-body w-full md:w-48"
                />
             </div>
             <div className="clay-surface !px-6 !py-2 flex items-center gap-3">
                <div className="flex items-center gap-2">
                   <div className="w-2 h-2 rounded-full bg-teal animate-pulse"></div>
                   <span className="font-l5-micro text-text-primary uppercase tracking-widest">{stats.total} Active</span>
                </div>
             </div>
          </div>
        </header>

        {/* Main Grid */}
        <div className="flex-1 grid grid-cols-1 xl:grid-cols-4 gap-8 min-h-0 overflow-hidden">
          
          {/* Side Registry Panel */}
          <div className="xl:col-span-1 clay-card !p-0 flex flex-col overflow-hidden ring-1 ring-border/10">
             <div className="p-6 border-b border-border/10 bg-surface/10 flex justify-between items-center">
                <h3 className="font-l5-micro text-text-muted uppercase tracking-widest">Asset Registry</h3>
                <Activity className="w-4 h-4 text-accent" />
             </div>
             
             <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-3">
                {loading ? (
                  <div className="text-center py-10 opacity-50 italic font-l5-micro text-xs">Awaiting signal lock...</div>
                ) : filteredShipments.length === 0 ? (
                  <div className="text-center py-10 text-text-muted opacity-50 font-l5-micro text-xs italic">No matching telemetry</div>
                ) : (
                  filteredShipments.map(s => {
                    const TransportIcon = getTransportIcon(s.transportType);
                    return (
                      <motion.div
                        key={s.id}
                        layoutId={s.id}
                        onClick={() => setSelectedShipment(s)}
                        className={`clay-surface !p-4 border-none ring-1 transition-all cursor-pointer group ${
                          selectedShipment?.id === s.id ? 'ring-accent bg-accent/5' : 'ring-border/20 bg-surface/20 hover:ring-accent/40'
                        }`}
                      >
                         <div className="flex justify-between items-center mb-3">
                            <p className="text-sm font-l2-card text-text-primary tracking-tight">{s.id}</p>
                            <div className={`w-2 h-2 rounded-full ${s.status === 'ON_TRACK' ? 'bg-teal' : s.status === 'DELAYED' ? 'bg-danger shadow-[0_0_8px_var(--color-danger)]' : 'bg-warn shadow-[0_0_8px_var(--color-warn)]'}`}></div>
                         </div>
                         <div className="flex items-center gap-3">
                            <div className="p-1.5 rounded bg-surface/50 border border-border/20">
                               <TransportIcon className="w-3.5 h-3.5 text-text-muted group-hover:text-accent" />
                            </div>
                            <div>
                               <p className="text-[10px] font-l5-micro text-text-muted uppercase tracking-widest leading-none">{s.carrier}</p>
                               <div className="flex items-center gap-2 mt-1">
                                  <span className="text-[10px] font-bold text-text-primary opacity-60 uppercase">{s.origin}</span>
                                  <ArrowRight className="w-2.5 h-2.5 text-accent" />
                                  <span className="text-[10px] font-bold text-text-primary opacity-60 uppercase">{s.destination}</span>
                               </div>
                            </div>
                         </div>
                      </motion.div>
                    );
                  })
                )}
             </div>

             {/* Quick Health Status */}
             <div className="p-4 border-t border-border/10 bg-surface/10 grid grid-cols-2 gap-2">
                <div className="clay-surface !p-3 flex flex-col items-center">
                   <p className="text-[9px] font-l5-micro text-text-muted uppercase mb-1">Risk Level</p>
                   <p className={`text-lg font-l1-hero ${stats.risk > 0 ? 'text-warn' : 'text-teal'}`}>{stats.risk}</p>
                </div>
                <div className="clay-surface !p-3 flex flex-col items-center text-center">
                   <p className="text-[9px] font-l5-micro text-text-muted uppercase mb-1">Tracking</p>
                   <p className="text-lg font-l1-hero text-accent">{((stats.active / stats.total) * 100 || 0).toFixed(0)}%</p>
                </div>
             </div>
          </div>

          {/* Map Section */}
          <div className="xl:col-span-3 clay-card !p-1 relative overflow-hidden ring-1 ring-border/10">
             <MapContainer 
                center={[20.5937, 78.9629]} 
                zoom={5} 
                className="w-full h-full rounded-[var(--clay-radius)] z-0"
                style={{ background: isDark ? '#0B0E20' : '#F0F4FF' }}
             >
                <TileLayer
                  url={isDark 
                    ? "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                    : "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"}
                  attribution='&copy; CARTO'
                />
                
                <MapController 
                  center={selectedShipment ? [selectedShipment.currentLat, selectedShipment.currentLng] : null} 
                  zoom={selectedShipment ? 7 : null}
                />

                {shipments.map((s) => (
                  <Marker 
                    key={s.id}
                    position={[s.currentLat, s.currentLng]} 
                    icon={getMarkerIcon(s)}
                    eventHandlers={{
                      click: () => setSelectedShipment(s),
                    }}
                  >
                    <Popup className="premium-popup">
                      <div className="p-4 min-w-[260px] bg-card text-text-primary rounded-2xl shadow-clay border border-border overflow-hidden">
                        <div className="flex justify-between items-start mb-4 border-b border-border/20 pb-4">
                           <div>
                              <p className="font-l5-micro text-text-muted mb-1 uppercase tracking-widest">Asset Trace</p>
                              <p className="text-sm font-l2-card text-accent tracking-tight">{s.id}</p>
                           </div>
                           <div className={`px-2.5 py-1 rounded-lg font-l5-micro !tracking-normal uppercase ${
                             s.status === 'ON_TRACK' ? 'bg-teal/10 text-teal border border-teal/20' : 
                             s.status === 'DELAYED' ? 'bg-danger/10 text-danger border border-danger/20' : 
                             'bg-warn/10 text-warn border border-warn/20'
                           }`}>
                              {s.status?.replace('_', ' ')}
                           </div>
                        </div>

                        <div className="space-y-4 font-l4-body">
                           <div className="flex items-start gap-4">
                              <MapPin className="w-4 h-4 text-accent mt-0.5" />
                              <div className="flex-1">
                                 <p className="text-[10px] text-text-muted font-l5-micro uppercase tracking-widest mb-1">Route Corridor</p>
                                 <p className="text-[11px] font-black uppercase text-text-primary">
                                    {s.origin} <ArrowRight className="inline w-2.5 h-2.5 mx-1 opacity-50" /> {s.destination}
                                 </p>
                              </div>
                           </div>

                           <div className="flex items-center justify-between p-3 bg-surface/30 rounded-xl border border-border/10">
                              <div className="flex items-center gap-3">
                                 <Navigation className="w-4 h-4 text-text-muted" />
                                 <span className="font-l3-data text-[11px] text-accent">
                                    {s.currentLat.toFixed(4)}, {s.currentLng.toFixed(4)}
                                 </span>
                              </div>
                              <span className="font-l5-micro text-[9px] text-text-muted italic">LIVE GPS</span>
                           </div>

                           <div className="grid grid-cols-2 gap-3 pt-2">
                              <div>
                                 <p className="text-[9px] text-text-muted uppercase tracking-widest mb-1">Carrier</p>
                                 <p className="text-xs font-bold text-text-primary">{s.carrier}</p>
                              </div>
                              <div>
                                 <p className="text-[9px] text-text-muted uppercase tracking-widest mb-1">Mode</p>
                                 <p className="text-xs font-bold text-text-primary">{s.transportType}</p>
                              </div>
                           </div>
                        </div>

                        {s.status !== 'ON_TRACK' && (
                          <div className="mt-4 pt-4 border-t border-border/20 flex items-center gap-2 text-warn">
                             <AlertTriangle className="w-3.5 h-3.5" />
                             <span className="font-l5-micro text-[9px] uppercase tracking-widest">Active Intelligence Warning</span>
                          </div>
                        )}
                      </div>
                    </Popup>
                  </Marker>
                ))}
             </MapContainer>

             {/* UI Overlay Controls */}
             <div className="absolute top-6 left-6 z-[1000] flex flex-col gap-3">
                <button 
                  onClick={() => setSelectedShipment(null)}
                  className="clay-card !p-3 bg-surface/80 backdrop-blur-md border-none ring-1 ring-border/20 text-text-muted hover:text-accent transition-all group"
                  title="Reset World View"
                >
                   <Crosshair className="w-5 h-5 group-hover:rotate-45 transition-transform" />
                </button>
             </div>

             <div className="absolute bottom-10 right-10 z-[1000]">
                <div className="clay-card !bg-surface/90 backdrop-blur-xl border-none ring-1 ring-border/20 p-6 min-w-[200px]">
                   <p className="font-l5-micro text-text-muted mb-4 tracking-[0.2em]">Operational Legend</p>
                   <div className="space-y-4">
                     <div className="flex items-center gap-3">
                       <div className="w-2.5 h-2.5 rounded-full bg-teal shadow-[0_0_10px_var(--color-teal)]"></div>
                       <span className="text-[11px] font-l2-card text-text-primary tracking-tight">Active Operation</span>
                     </div>
                     <div className="flex items-center gap-3">
                       <div className="w-2.5 h-2.5 rounded-full bg-warn shadow-[0_0_10px_var(--color-warn)]"></div>
                       <span className="text-[11px] font-l2-card text-text-primary tracking-tight">Intelligence alert</span>
                     </div>
                     <div className="flex items-center gap-3">
                       <div className="w-2.5 h-2.5 rounded-full bg-danger shadow-[0_0_10px_var(--color-danger)]"></div>
                       <span className="text-[11px] font-l2-card text-text-primary tracking-tight">Protocol Disruption</span>
                     </div>
                   </div>
                </div>
             </div>
          </div>

        </div>
      </div>
    </Layout>
  );
};

const ArrowRight = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
  </svg>
);

export default LiveFleet;
