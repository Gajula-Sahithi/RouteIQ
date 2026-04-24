import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { ref, onValue } from 'firebase/database';
import { db } from '../firebase';
import Layout from '../components/Layout';
import { useTheme } from '../context/ThemeContext';
import { Shield, MapPin, Navigation, Info, Maximize2 } from 'lucide-react';

// Fix for leaflet marker icons in React
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const Heatmap = () => {
  const [shipments, setShipments] = useState([]);
  const { isDark } = useTheme();

  useEffect(() => {
    const shipmentsRef = ref(db, 'shipments');
    const unsubscribe = onValue(shipmentsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) setShipments(Object.values(data));
    });
    return () => unsubscribe();
  }, []);

  const getMarkerIcon = (status) => {
    // Standardizing on design system palette
    const color = status === 'AT_RISK' ? '#FF9F2E' : (status === 'DELAYED' ? '#FF3355' : '#2B5EFF');
    return L.divIcon({
      className: 'custom-div-icon',
      html: `<div style="background-color: ${color}; width: 14px; height: 14px; border-radius: 50%; border: 3px solid #FFFFFF; box-shadow: 0 0 20px ${color}"></div>`,
      iconSize: [28, 28],
      iconAnchor: [14, 14]
    });
  };

  return (
    <Layout>
      <div className="h-full flex flex-col space-y-10 pb-10">
        <header className="flex justify-between items-center animate-in fade-in slide-in-from-left-4 duration-700">
          <div>
            <h1 className="text-4xl font-l1-hero text-text-primary tracking-wide uppercase">Spatial Analysis</h1>
            <p className="font-l5-micro text-accent tracking-[0.4em] mt-1">Real-time GPS Telemetry Grid</p>
          </div>
          
          <div className="flex items-center gap-6">
            <div className="clay-surface !px-6 !py-3 flex items-center gap-3">
               <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-teal shadow-[0_0_12px_var(--color-teal)]"></div>
                  <span className="font-l5-micro text-text-muted">Protocol Active</span>
               </div>
            </div>
          </div>
        </header>

        <div className="flex-1 grid grid-cols-1 xl:grid-cols-4 gap-10 min-h-[700px]">
          {/* Map Container - 3/4 width */}
          <div className="xl:col-span-3 clay-card !p-1 relative overflow-hidden ring-1 ring-border/10">
            <MapContainer 
              center={[20, 0]} 
              zoom={2.5} 
              className="w-full h-full rounded-[var(--clay-radius)] z-0"
              style={{ background: isDark ? '#0B0E20' : '#F0F4FF' }}
            >
              <TileLayer
                url={isDark 
                  ? "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                  : "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"}
                attribution='&copy; CARTO'
              />
              {shipments.map((shipment) => (
                <React.Fragment key={shipment.id}>
                  <Marker 
                    position={[shipment.currentLat, shipment.currentLng]} 
                    icon={getMarkerIcon(shipment.status)}
                  >
                    <Popup className="premium-popup">
                      <div className="p-4 min-w-[240px] bg-card text-text-primary rounded-2xl shadow-clay border border-border">
                        <div className="flex justify-between items-start mb-4 border-b border-border-muted pb-4">
                           <div>
                              <p className="font-l5-micro text-text-muted mb-1">Asset Trace</p>
                              <p className="text-sm font-l2-card tracking-tight">{shipment.id}</p>
                           </div>
                           <span className={`px-2.5 py-1 rounded-lg font-l5-micro !tracking-normal ${shipment.status === 'ON_TRACK' ? 'bg-accent/10 text-accent' : 'bg-danger/10 text-danger'}`}>
                              {shipment.status?.replace('_', ' ')}
                           </span>
                        </div>
                        <div className="space-y-4 font-l4-body">
                           <div className="flex items-center gap-4">
                              <MapPin className="w-4 h-4 text-accent" />
                              <p className="text-[11px] font-bold uppercase tracking-tight opacity-80">{shipment.origin} &rarr; {shipment.destination}</p>
                           </div>
                           <div className="flex items-center gap-4">
                              <Navigation className="w-4 h-4 text-text-muted" />
                              <p className="font-l3-data text-xs text-accent">{shipment.currentLat.toFixed(4)}, {shipment.currentLng.toFixed(4)}</p>
                           </div>
                        </div>
                      </div>
                    </Popup>
                  </Marker>
                  {shipment.status !== 'ON_TRACK' && (
                    <Circle 
                      center={[shipment.currentLat, shipment.currentLng]} 
                      radius={400000} 
                      pathOptions={{ 
                        color: shipment.status === 'AT_RISK' ? 'var(--color-warn)' : 'var(--color-danger)', 
                        fillOpacity: 0.08, 
                        weight: 1,
                        dashArray: '8, 8'
                      }}
                    />
                  )}
                </React.Fragment>
              ))}
            </MapContainer>
            
            {/* Overlay Map Controls */}
            <div className="absolute top-8 left-8 z-[1000] flex flex-col gap-3">
               <button className="clay-card !p-3 bg-surface/80 backdrop-blur-md border-none ring-1 ring-border/20 text-text-muted hover:text-accent transition-all">
                  <Maximize2 className="w-6 h-6" />
               </button>
            </div>

            <div className="absolute bottom-12 right-12 z-[1000]">
               <div className="clay-card !bg-surface/90 backdrop-blur-xl border-none ring-1 ring-border/20 p-8 min-w-[240px]">
                  <p className="font-l5-micro text-text-muted mb-6 tracking-[0.3em]">Telemetry Legend</p>
                  <div className="space-y-5">
                    <div className="flex items-center gap-4">
                      <div className="w-3 h-3 rounded-full bg-accent shadow-[0_0_12px_var(--color-accent)]"></div>
                      <span className="text-[12px] font-l2-card text-text-primary tracking-tight">On Track Protocol</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="w-3 h-3 rounded-full bg-warn shadow-[0_0_12px_var(--color-warn)]"></div>
                      <span className="text-[12px] font-l2-card text-text-primary tracking-tight">Intelligence Warning</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="w-3 h-3 rounded-full bg-danger shadow-[0_0_12px_var(--color-danger)]"></div>
                      <span className="text-[12px] font-l2-card text-text-primary tracking-tight">Critical Disruption</span>
                    </div>
                  </div>
               </div>
            </div>
          </div>

          {/* Side Info - 1/4 width */}
          <div className="xl:col-span-1 flex flex-col gap-10">
            <div className="clay-card p-8">
               <h3 className="font-l5-micro text-text-muted mb-8 flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-accent/10">
                    <Info className="w-4 h-4 text-accent" />
                  </div>
                  System Metrics
               </h3>
               <div className="space-y-8">
                  <div className="clay-surface !p-6 border-none ring-1 ring-border/20 bg-surface/30">
                     <p className="font-l5-micro text-text-muted mb-2 tracking-widest leading-none">Global Coverage</p>
                     <p className="text-4xl font-l1-hero text-text-primary tracking-wide">98.4<span className="text-base font-l4-body text-accent ml-1">%</span></p>
                  </div>
                  <div className="clay-surface !p-6 border-none ring-1 ring-border/20 bg-surface/30">
                     <p className="font-l5-micro text-text-muted mb-2 tracking-widest leading-none">Satellite Fixed</p>
                     <p className="text-4xl font-l1-hero text-text-primary tracking-wide">24 <span className="text-[12px] font-l3-data text-teal ml-2 px-2 py-0.5 clay-card !bg-teal/10 !border-none tracking-normal">LOCK</span></p>
                  </div>
               </div>
            </div>

            <div className="clay-card p-8 flex-1">
               <h3 className="font-l5-micro text-text-muted mb-8 uppercase tracking-[0.2em]">Live Risk Polling</h3>
               <div className="space-y-4">
                  {shipments.filter(s => s.status !== 'ON_TRACK').slice(0, 5).map(s => (
                    <div key={s.id} className="clay-surface !p-4 border-none ring-1 ring-border/10 hover:ring-accent/40 bg-surface/20 transition-all cursor-pointer group">
                       <div className="flex justify-between items-center">
                          <p className="text-sm font-l2-card text-text-primary tracking-tight">{s.id}</p>
                          <span className="font-l5-micro text-warn !tracking-normal">POLL-ACTIVE</span>
                       </div>
                       <div className="flex items-center gap-2 mt-2 opacity-60">
                          <span className="font-l5-micro text-[9px]">{s.carrier}</span>
                          <span className="w-1 h-1 rounded-full bg-border"></span>
                          <span className="font-l5-micro text-[9px]">{s.destination}</span>
                       </div>
                    </div>
                  ))}
                  {shipments.filter(s => s.status !== 'ON_TRACK').length === 0 && (
                    <div className="text-center py-10">
                       <p className="font-l5-micro text-text-muted italic lowercase">no anomalies in pool</p>
                    </div>
                  )}
               </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Heatmap;
