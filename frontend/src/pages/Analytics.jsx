import React, { useState, useEffect } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, AreaChart, Area
} from 'recharts';
import { ref, onValue } from 'firebase/database';
import { db } from '../firebase';
import Layout from '../components/Layout';
import { BarChart3, ChevronDown, Activity, Shield } from 'lucide-react';

const Analytics = () => {
  const [shipments, setShipments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const shipmentsRef = ref(db, 'shipments');
    const unsubscribe = onValue(shipmentsRef, (snapshot) => {
       const data = snapshot.val();
       if (data) setShipments(Object.values(data));
       setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const statusData = [
    { name: 'On Track', value: shipments.filter(s => s.status === 'ON_TRACK').length },
    { name: 'At Risk', value: shipments.filter(s => s.status === 'AT_RISK').length },
    { name: 'Delayed', value: shipments.filter(s => s.status === 'DELAYED').length },
  ];

  const riskTrendData = [
    { name: 'Mon', risk: 12 }, { name: 'Tue', risk: 18 }, { name: 'Wed', risk: 25 },
    { name: 'Thu', risk: 45 }, { name: 'Fri', risk: 38 }, { name: 'Sat', risk: 65 }, { name: 'Sun', risk: 55 },
  ];

  const emissionsData = shipments.map(s => ({
    name: s.id,
    co2: (s.riskScore * 0.5) + 120
  })).slice(0, 5);

  const COLORS = ['#2B5EFF', '#FF3355', '#FF9F2E']; // Signal Blue, Alert Red, Caution Amber

  return (
    <Layout>
      <div className="space-y-12 pb-20">
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8 clay-card !bg-surface/20 !p-10 border-none ring-1 ring-border/20">
          <div className="animate-in fade-in slide-in-from-top-4 duration-700">
            <h1 className="text-4xl font-l1-hero text-text-primary tracking-wide uppercase mb-1">Performance Terminal</h1>
            <p className="font-l5-micro text-accent tracking-[0.4em] mb-1">Cross-corridor metric synthesis</p>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 gap-12">
             {[
               { label: 'Network Safety', value: '34.2%', color: 'text-accent' },
               { label: 'Efficacy Ratio', value: '98.5%', color: 'text-text-primary' },
               { label: 'Carbon intensity', value: '0.82', color: 'text-text-muted' },
             ].map((stat, i) => (
               <div key={i} className="flex flex-col gap-2">
                  <p className="font-l5-micro text-text-muted">{stat.label}</p>
                  <h4 className={`text-4xl font-l1-hero ${stat.color} leading-none tracking-wider`}>{stat.value}</h4>
               </div>
             ))}
          </div>
        </header>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-10">
          <div className="xl:col-span-2 clay-card !p-10 flex flex-col min-h-[500px]">
            <div className="flex justify-between items-center mb-12">
               <div>
                  <h3 className="text-base font-l2-card text-text-primary uppercase tracking-tight">Risk Forecast Matrix</h3>
                  <p className="font-l5-micro text-text-muted mt-1 lowercase italic">rolling 7-day protocol cluster</p>
               </div>
               <button className="clay-surface !px-4 !py-2 !rounded-xl !border-border/30 text-[10px] font-l5-micro text-text-muted hover:text-accent transition-colors">
                  Cycle Window Filter <ChevronDown className="w-3 h-3 inline ml-1" />
               </button>
            </div>
            <div className="flex-1">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={riskTrendData}>
                  <defs>
                    <linearGradient id="colorRisk" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--color-accent)" stopOpacity={0.15}/>
                      <stop offset="95%" stopColor="var(--color-accent)" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="6 6" stroke="var(--color-border)" vertical={false} />
                  <XAxis dataKey="name" stroke="var(--color-text-muted)" fontSize={11} fontWeight={600} dy={15} axisLine={false} tickLine={false} opacity={0.6} />
                  <YAxis stroke="var(--color-text-muted)" fontSize={11} fontWeight={600} dx={-15} axisLine={false} tickLine={false} opacity={0.6} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'var(--color-card)', border: 'var(--clay-border)', borderRadius: '16px', boxShadow: 'var(--clay-shadow)', padding: '12px' }} 
                    labelStyle={{ fontFamily: 'var(--font-heading)', fontWeight: 800, color: 'var(--color-text-primary)', marginBottom: '4px' }}
                    itemStyle={{ fontFamily: 'var(--font-data)', fontSize: '12px', color: 'var(--color-accent)' }}
                  />
                  <Area type="monotone" dataKey="risk" stroke="var(--color-accent)" fillOpacity={1} fill="url(#colorRisk)" strokeWidth={3} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="clay-card !p-10 flex flex-col items-center min-h-[500px]">
            <div className="w-full mb-12 text-center md:text-left">
              <h3 className="text-base font-l2-card text-text-primary uppercase tracking-tight">Asset Dispersion</h3>
              <p className="font-l5-micro text-text-muted mt-1 lowercase italic">protocol efficacy analysis</p>
            </div>
            <div className="flex-1 w-full relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusData}
                    innerRadius="65%"
                    outerRadius="85%"
                    paddingAngle={8}
                    dataKey="value"
                    stroke="none"
                    cornerRadius={8}
                  >
                    {statusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'var(--color-card)', border: 'var(--clay-border)', borderRadius: '16px', boxShadow: 'var(--clay-shadow)' }} 
                  />
                  <Legend verticalAlign="bottom" iconType="circle" align="center" wrapperStyle={{ fontFamily: 'var(--font-micro)', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.1em', paddingTop: '40px' }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none mb-10">
                 <p className="font-l5-micro text-text-muted leading-none">Total Assets</p>
                 <h4 className="text-4xl font-l1-hero text-text-primary leading-none mt-2">{shipments.length}</h4>
              </div>
            </div>
          </div>
        </div>

        <div className="clay-card !p-10 flex flex-col h-[500px]">
            <div className="mb-12">
               <h3 className="text-base font-l2-card text-text-primary uppercase">Environment Index</h3>
               <p className="font-l5-micro text-text-muted mt-1 lowercase italic">CO2 exhaust tracking telemetry</p>
            </div>
            <div className="flex-1">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={emissionsData}>
                  <CartesianGrid strokeDasharray="6 6" stroke="var(--color-border)" vertical={false} />
                  <XAxis dataKey="name" stroke="var(--color-text-muted)" fontSize={11} fontWeight={600} dy={15} axisLine={false} tickLine={false} opacity={0.6} />
                  <YAxis stroke="var(--color-text-muted)" fontSize={11} fontWeight={600} dx={-15} axisLine={false} tickLine={false} opacity={0.6} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'var(--color-card)', border: 'var(--clay-border)', borderRadius: '16px', boxShadow: 'var(--clay-shadow)' }}
                    cursor={{fill: 'var(--color-surface)', opacity: 0.2}}
                  />
                  <Bar dataKey="co2" fill="var(--color-accent)" radius={[8, 8, 0, 0]} barSize={32} />
                </BarChart>
              </ResponsiveContainer>
            </div>
        </div>
      </div>
    </Layout>
  );
};

export default Analytics;
