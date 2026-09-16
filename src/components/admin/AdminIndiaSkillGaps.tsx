import React, { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import { IndiaSkillGapArea, SkillGapField } from '../../types';
import { 
  BarChart, 
  Bar, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  CartesianGrid, 
  Legend,
  RadarChart, 
  PolarGrid, 
  PolarAngleAxis, 
  PolarRadiusAxis, 
  Radar 
} from 'recharts';
import { 
  TrendingUp, 
  MapPin, 
  AlertTriangle, 
  Layers, 
  Compass, 
  GraduationCap, 
  Users, 
  CheckCircle2, 
  Building2,
  ArrowUpRight,
  Filter
} from 'lucide-react';

export const AdminIndiaSkillGaps: React.FC = () => {
  const [data, setData] = useState<{
    regions: IndiaSkillGapArea[];
    fields: SkillGapField[];
    nationalSummary: {
      totalWorkforceDemand: number;
      totalAvailableWorkforce: number;
      averageDeficitPercentage: number;
      topDeficitFields: string[];
      highPriorityRegions: string[];
    };
  } | null>(null);

  const [loading, setLoading] = useState(true);
  const [selectedRegionId, setSelectedRegionId] = useState<string>('all');
  const [chartMetric, setChartMetric] = useState<'workforce' | 'deficit'>('workforce');

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        setLoading(true);
        const res = await api.getAdminAnalytics();
        setData(res);
      } catch (err) {
        console.error('Failed to load India skill gap analytics:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchAnalytics();
  }, []);

  if (loading || !data) {
    return (
      <div className="text-center py-20 text-slate-500 dark:text-slate-400 text-sm">
        Loading national skill gap models and regional telemetry...
      </div>
    );
  }

  // Active region data
  const activeRegion = selectedRegionId === 'all' 
    ? null 
    : data.regions.find(r => r.region_id === selectedRegionId);

  // Prepare chart dataset
  const fieldChartData = data.fields.map(f => ({
    field: f.field_name.replace(' & ', '\n& '),
    demand: f.demand_thousands,
    supply: f.supply_thousands,
    deficit: f.deficit_percentage,
    deficitThousands: f.demand_thousands - f.supply_thousands,
    priority: f.priority_level
  }));

  // Regional comparisons
  const regionChartData = data.regions.map(r => ({
    region: r.region_name.replace(' India', ''),
    demand: r.total_demand_thousands,
    supply: r.current_workforce_thousands,
    gapPercentage: r.skill_gap_percentage,
    centers: r.training_centers_count
  }));

  return (
    <div id="admin-india-skill-gaps" className="space-y-6">
      {/* Top Banner */}
      <div className="rounded-3xl p-6 sm:p-8 bg-gradient-to-r from-emerald-900/40 via-teal-900/30 to-blue-900/40 dark:from-emerald-950/60 dark:via-teal-950/50 dark:to-blue-950/60 border border-emerald-300/30 dark:border-emerald-700/40 shadow-xl backdrop-blur-md relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/10 dark:bg-emerald-400/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-400/30">
              <TrendingUp className="w-3.5 h-3.5" />
              National Workforce Intelligence
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 dark:text-white font-display">
              Skill Gaps Across Fields & Areas Across India
            </h1>
            <p className="text-sm text-slate-600 dark:text-slate-300 max-w-2xl leading-relaxed">
              Real-time regional macroeconomic telemetry comparing technical industry workforce demand against qualified graduate supply across all 6 administrative zones in India.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="px-4 py-3 rounded-2xl bg-white/80 dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800 shadow-sm text-center min-w-[110px]">
              <div className="text-2xl font-black text-rose-600 dark:text-rose-400 font-display">
                {data.nationalSummary.averageDeficitPercentage}%
              </div>
              <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">Avg Skill Deficit</div>
            </div>
            <div className="px-4 py-3 rounded-2xl bg-white/80 dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800 shadow-sm text-center min-w-[110px]">
              <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 font-display">
                {(data.nationalSummary.totalWorkforceDemand / 1000).toFixed(1)}M
              </div>
              <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">Workforce Demand</div>
            </div>
          </div>
        </div>
      </div>

      {/* Region Selector Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 p-1.5 scrollbar-none">
        <button
          onClick={() => setSelectedRegionId('all')}
          className={`px-4 py-2 rounded-2xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-2 ${
            selectedRegionId === 'all'
              ? 'bg-emerald-600 text-white shadow-md shadow-emerald-500/20'
              : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:border-emerald-400'
          }`}
        >
          <Compass className="w-3.5 h-3.5" />
          All India (National Overview)
        </button>

        {data.regions.map(r => (
          <button
            key={r.region_id}
            onClick={() => setSelectedRegionId(r.region_id)}
            className={`px-4 py-2 rounded-2xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-2 ${
              selectedRegionId === r.region_id
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-500/20'
                : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:border-emerald-400'
            }`}
          >
            <MapPin className="w-3.5 h-3.5" />
            {r.region_name} ({r.skill_gap_percentage}%)
          </button>
        ))}
      </div>

      {/* Selected Region Highlight Card (if single region picked) */}
      {activeRegion && (
        <div className="p-6 rounded-3xl bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950/40 dark:to-teal-950/30 border border-emerald-200 dark:border-emerald-800/60 shadow-sm animate-in fade-in duration-150">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-300">
                Regional Deep Dive Profile
              </span>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                {activeRegion.region_name}
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-300 mt-1">
                States covered: <strong className="text-slate-800 dark:text-slate-200">{activeRegion.states_covered.join(', ')}</strong>
              </p>
            </div>

            <div className="flex items-center gap-4">
              <div className="text-right">
                <div className="text-xs font-bold text-slate-500">Skill Deficit Gap</div>
                <div className="text-2xl font-black text-rose-600 dark:text-rose-400">
                  {activeRegion.skill_gap_percentage}%
                </div>
              </div>
              <div className="text-right pl-4 border-l border-emerald-200 dark:border-emerald-800/60">
                <div className="text-xs font-bold text-slate-500">Active Centers</div>
                <div className="text-2xl font-black text-emerald-700 dark:text-emerald-300">
                  {activeRegion.training_centers_count}
                </div>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-emerald-200/60 dark:border-emerald-800/60">
            <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
              Top Deficit Fields in this Region:
            </span>
            <div className="flex flex-wrap gap-2 mt-2">
              {activeRegion.top_deficit_fields.map((f, i) => (
                <span key={i} className="text-xs font-semibold px-3 py-1 rounded-xl bg-white/90 dark:bg-slate-900/90 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800/60 flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 text-rose-500" />
                  {f}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Main Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Chart 1: Field Breakdown (Demand vs Supply) */}
        <div className="lg:col-span-8 p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                Industry Field Metrics
              </span>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Workforce Demand vs Available Talent by Specialization
              </h3>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setChartMetric('workforce')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors ${
                  chartMetric === 'workforce' 
                    ? 'bg-emerald-600 text-white' 
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                }`}
              >
                Volume (000s)
              </button>
              <button
                onClick={() => setChartMetric('deficit')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors ${
                  chartMetric === 'deficit' 
                    ? 'bg-emerald-600 text-white' 
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                }`}
              >
                Deficit %
              </button>
            </div>
          </div>

          <div className="h-80 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              {chartMetric === 'workforce' ? (
                <BarChart data={fieldChartData} margin={{ top: 10, right: 10, left: -10, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                  <XAxis 
                    dataKey="field" 
                    tick={{ fontSize: 10, fill: '#888' }} 
                    interval={0}
                    angle={-15}
                    textAnchor="end"
                  />
                  <YAxis tick={{ fontSize: 11, fill: '#888' }} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#0f172a', 
                      borderRadius: '12px', 
                      border: '1px solid #334155',
                      color: '#f8fafc',
                      fontSize: '12px'
                    }} 
                  />
                  <Legend verticalAlign="top" wrapperStyle={{ paddingBottom: '10px', fontSize: '12px' }} />
                  <Bar dataKey="demand" name="Annual Demand (000s)" fill="#3b82f6" radius={[6, 6, 0, 0]} />
                  <Bar dataKey="supply" name="Qualified Supply (000s)" fill="#10b981" radius={[6, 6, 0, 0]} />
                </BarChart>
              ) : (
                <BarChart data={fieldChartData} margin={{ top: 10, right: 10, left: -10, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                  <XAxis 
                    dataKey="field" 
                    tick={{ fontSize: 10, fill: '#888' }} 
                    interval={0}
                    angle={-15}
                    textAnchor="end"
                  />
                  <YAxis unit="%" tick={{ fontSize: 11, fill: '#888' }} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#0f172a', 
                      borderRadius: '12px', 
                      border: '1px solid #334155',
                      color: '#f8fafc',
                      fontSize: '12px'
                    }} 
                  />
                  <Bar dataKey="deficit" name="Talent Deficit %" fill="#f43f5e" radius={[6, 6, 0, 0]} />
                </BarChart>
              )}
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Regional Skill Gap Radar */}
        <div className="lg:col-span-4 p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-sm space-y-4 flex flex-col justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-teal-600 dark:text-teal-400">
              Regional Zonal Radar
            </span>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Skill Gap Deficit by Zone
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Distribution of talent deficit percentages across all six geographical zones in India.
            </p>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={regionChartData}>
                <PolarGrid strokeOpacity={0.2} />
                <PolarAngleAxis dataKey="region" tick={{ fontSize: 10, fill: '#888' }} />
                <PolarRadiusAxis angle={30} domain={[0, 70]} tick={{ fontSize: 9, fill: '#888' }} />
                <Radar name="Deficit %" dataKey="gapPercentage" stroke="#10b981" fill="#10b981" fillOpacity={0.4} />
              </RadarChart>
            </ResponsiveContainer>
          </div>

          <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 text-center">
            <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
              Highest Deficit Zone: <strong className="text-rose-600 dark:text-rose-400">North-Eastern (64%)</strong>
            </span>
          </div>
        </div>
      </div>

      {/* Detailed Fields Cards List */}
      <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              National Priority Field Catalog
            </h3>
            <p className="text-xs text-slate-500">
              Granular breakdown of strategic domains requiring subsidized training cohorts under Skill India Mission.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {data.fields.map(f => (
            <div 
              key={f.field_id}
              className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 flex flex-col justify-between space-y-3"
            >
              <div>
                <div className="flex items-center justify-between gap-1 mb-2">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md uppercase ${
                    f.priority_level === 'Critical' 
                      ? 'bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
                      : f.priority_level === 'High'
                      ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800'
                      : 'bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800'
                  }`}>
                    {f.priority_level} Priority
                  </span>
                  <span className="text-xs font-black text-rose-600 dark:text-rose-400">
                    {f.deficit_percentage}% Deficit
                  </span>
                </div>

                <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                  {f.field_name}
                </h4>
              </div>

              <div className="space-y-1.5 text-xs text-slate-500 dark:text-slate-400 pt-2 border-t border-slate-200/60 dark:border-slate-700/60">
                <div className="flex justify-between">
                  <span>Workforce Demand:</span>
                  <strong className="text-slate-800 dark:text-slate-200">{f.demand_thousands},000</strong>
                </div>
                <div className="flex justify-between">
                  <span>Current Supply:</span>
                  <strong className="text-slate-800 dark:text-slate-200">{f.supply_thousands},000</strong>
                </div>
                <div className="flex justify-between text-rose-600 dark:text-rose-400 font-bold">
                  <span>Shortfall:</span>
                  <span>{f.demand_thousands - f.supply_thousands},000 positions</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
