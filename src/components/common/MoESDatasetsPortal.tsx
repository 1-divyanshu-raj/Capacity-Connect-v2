import React, { useState } from 'react';
import { 
  Database, 
  Waves, 
  CloudRain, 
  Compass, 
  Snowflake, 
  ExternalLink, 
  Download, 
  RefreshCw, 
  Activity, 
  Layers, 
  Radio, 
  Search, 
  Check, 
  Copy,
  SlidersHorizontal
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid, 
  Legend 
} from 'recharts';
import { useTheme } from '../../context/ThemeContext';

interface DatasetItem {
  id: string;
  title: string;
  organization: 'INCOIS' | 'IMD' | 'NCMRWF' | 'NCPOR';
  category: string;
  description: string;
  spatial_coverage: string;
  temporal_resolution: string;
  formats: string[];
  live_status: 'online' | 'streaming' | 'daily_batch';
  latency: string;
  parameters: string[];
  api_endpoint: string;
  source_institution: string;
}

const DATASETS: DatasetItem[] = [
  {
    id: 'ds-incois-01',
    title: 'INCOIS Real-Time Oceanographic Buoy & Swell Telemetry',
    organization: 'INCOIS',
    category: 'Ocean State & Coastal Hazard',
    description: 'In-situ telemetry streaming from moored ocean buoys (MB & BD series) across the Arabian Sea and Bay of Bengal. Features directional significant wave height, sea surface temperature (SST), sea surface salinity, and surface current velocity vectors.',
    spatial_coverage: 'Indian Ocean Basin (5°S - 25°N, 60°E - 95°E)',
    temporal_resolution: '30-minute sampling intervals',
    formats: ['NetCDF-4', 'GeoJSON', 'CSV', 'OPeNDAP'],
    live_status: 'streaming',
    latency: '12 seconds',
    parameters: ['Significant Wave Height (SWH)', 'Sea Surface Temp (SST)', 'Current Speed & Dir', 'Wave Period (Tz)'],
    api_endpoint: 'https://data.incois.gov.in/telemetry/v2/ocean_state/stream.nc',
    source_institution: 'Indian National Centre for Ocean Information Services, Hyderabad'
  },
  {
    id: 'ds-incois-02',
    title: 'Indian Ocean Tsunami Early Warning Bottom Pressure Recorder (BPR) Telemetry',
    organization: 'INCOIS',
    category: 'Tsunami & Geohazards',
    description: 'Acoustic bottom pressure recorder data measuring sea-level anomalies in deep ocean waters along the Sunda and Makran subduction zones. Ingested in real-time by ITEWC to confirm tsunami generation.',
    spatial_coverage: 'Bay of Bengal & Arabian Sea Deep Trenches (4,000m+ depth)',
    temporal_resolution: '1-minute triggered tsunami mode / 15-minute standard',
    formats: ['NetCDF-4', 'SEED / miniSEED', 'JSON Streams'],
    live_status: 'online',
    latency: '3 seconds (VSAT)',
    parameters: ['Seafloor Pressure (dbar)', 'Water Column Height Anomaly', 'Seismic Arrival Trigger'],
    api_endpoint: 'https://itewc.incois.gov.in/api/v1/bpr/telemetry_feed',
    source_institution: 'National Tsunami Early Warning Centre, MoES'
  },
  {
    id: 'ds-imd-01',
    title: 'IMD High-Resolution Gridded Rainfall (0.25° x 0.25° Spatial Grid)',
    organization: 'IMD',
    category: 'Meteorological & Hydrology',
    description: 'Daily gridded rainfall data over the Indian mainland compiled from over 3,500 rain gauge stations using Shepard interpolation method. The benchmark gold standard for monsoon tracking and climatological model calibration.',
    spatial_coverage: 'India Mainland (6.5°N - 38.5°N, 66.5°E - 100°E)',
    temporal_resolution: 'Daily 03:00 UTC compilation',
    formats: ['NetCDF-4', 'GRIB2', 'GeoTIFF', 'CSV'],
    live_status: 'daily_batch',
    latency: 'Updated daily at 08:30 IST',
    parameters: ['Daily Accumulated Rainfall (mm)', 'Rainfall Anomaly (%)', 'Standardized Precipitation Index'],
    api_endpoint: 'https://www.imdpune.gov.in/api/gridded_rain/v1/daily_india_025.nc',
    source_institution: 'India Meteorological Department, Climate Research & Services, Pune'
  },
  {
    id: 'ds-imd-02',
    title: 'IMD Doppler Weather Radar (DWR) 3D Reflectivity & Radial Velocity Feeds',
    organization: 'IMD',
    category: 'Radar Nowcasting',
    description: 'Network-wide volumetric radar sweeps from 37 Doppler Weather Radars (S-band, C-band, and X-band) across coastal and mainland centers. Essential for nowcasting thunderstorms, squalls, and tropical cyclone eye tracking.',
    spatial_coverage: 'Pan-India 250km radial coverage per station',
    temporal_resolution: '10-minute volume scan cycles',
    formats: ['HDF5 (ODIM_H5)', 'BUFR', 'GeoTIFF Max-Z'],
    live_status: 'streaming',
    latency: '45 seconds post-scan',
    parameters: ['Reflectivity (dBZ)', 'Radial Velocity (m/s)', 'Spectral Width', 'Dual-Pol Differential Reflectivity (ZDR)'],
    api_endpoint: 'https://dwr.imd.gov.in/radar_api/v2/volume_sweep/composite.h5',
    source_institution: 'India Meteorological Department HQ, New Delhi'
  },
  {
    id: 'ds-ncmrwf-01',
    title: 'NCMRWF Global Unified Model (NCUM) 12km Forecast Telemetry',
    organization: 'NCMRWF',
    category: 'Numerical Weather Prediction',
    description: 'Global 10-day deterministic forecast outputs generated on the MoES Pratyush & Mihir high-performance computing clusters using 4D-Var data assimilation. Ingests millions of satellite radiances and sounding profiles daily.',
    spatial_coverage: 'Global grid (12km horizontal resolution, 70 vertical levels)',
    temporal_resolution: 'Runs 4 times daily (00Z, 06Z, 12Z, 18Z cycles)',
    formats: ['GRIB2', 'NetCDF-4', 'OpenDAP WCS'],
    live_status: 'online',
    latency: 'Available within 2.5 hours of synoptic hour',
    parameters: ['Mean Sea Level Pressure', 'Geopotential Height (500 hPa)', '2m Temperature', 'Wind Vectors (U/V)'],
    api_endpoint: 'https://ncmrwf.gov.in/thredds/dodsC/NCUM_GLB_12KM/latest.nc',
    source_institution: 'National Centre for Medium Range Weather Forecasting, Noida'
  },
  {
    id: 'ds-ncpor-01',
    title: 'NCPOR Antarctic & Arctic Long-Term Cryospheric Observational Archive',
    organization: 'NCPOR',
    category: 'Polar & Cryosphere',
    description: 'Continuous meteorological and glaciological time series from Maitri and Bharati stations in Antarctica, Himadri station in Ny-Ålesund (Arctic), and the Chandra Basin glaciological field site in the Western Himalayas.',
    spatial_coverage: 'Larsemann Hills, Schirmacher Oasis, Svalbard, & Western Himalayas',
    temporal_resolution: '10-minute Automatic Weather Station (AWS) records',
    formats: ['NetCDF-4', 'CSV', 'ASCII Grid'],
    live_status: 'streaming',
    latency: 'Satellite uplink relay (Iridium)',
    parameters: ['Ice Surface Temperature', 'Albedo & Radiation Balance', 'Snow Accumulation (Sonic Ranger)', 'Ice Velocity'],
    api_endpoint: 'https://npdc.ncpor.res.in/polar_data/api/v1/cryosphere/telemetry.csv',
    source_institution: 'National Centre for Polar and Ocean Research, Vasco da Gama, Goa'
  }
];

// 24-Hour Telemetry Mock Time Series for Live Visualizer
const TELEMETRY_TIME_SERIES = [
  { time: '00:00', waveHeight: 1.8, sst: 28.6, windSpeed: 14, iceAlbedo: 0.78, rainfall: 0.2 },
  { time: '03:00', waveHeight: 1.9, sst: 28.5, windSpeed: 16, iceAlbedo: 0.79, rainfall: 0.4 },
  { time: '06:00', waveHeight: 2.1, sst: 28.4, windSpeed: 19, iceAlbedo: 0.81, rainfall: 1.2 },
  { time: '09:00', waveHeight: 2.4, sst: 28.7, windSpeed: 22, iceAlbedo: 0.76, rainfall: 4.8 },
  { time: '12:00', waveHeight: 2.7, sst: 29.2, windSpeed: 25, iceAlbedo: 0.72, rainfall: 8.5 },
  { time: '15:00', waveHeight: 2.6, sst: 29.0, windSpeed: 23, iceAlbedo: 0.74, rainfall: 6.2 },
  { time: '18:00', waveHeight: 2.3, sst: 28.8, windSpeed: 18, iceAlbedo: 0.77, rainfall: 2.1 },
  { time: '21:00', waveHeight: 2.0, sst: 28.6, windSpeed: 15, iceAlbedo: 0.78, rainfall: 0.6 }
];

export const MoESDatasetsPortal: React.FC = () => {
  const { isDark } = useTheme();
  const [selectedOrg, setSelectedOrg] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedEndpointId, setCopiedEndpointId] = useState<string | null>(null);
  const [downloadNotice, setDownloadNotice] = useState<string | null>(null);
  const [activeTelemetryMetric, setActiveTelemetryMetric] = useState<'wave_sst' | 'rainfall_wind' | 'cryo'>('wave_sst');

  const filteredDatasets = DATASETS.filter(ds => {
    const matchesOrg = selectedOrg === 'ALL' || ds.organization === selectedOrg;
    const q = (searchQuery || '').trim().toLowerCase();
    const matchesSearch = !q ||
      (ds.title || '').toLowerCase().includes(q) ||
      (ds.category || '').toLowerCase().includes(q) ||
      (ds.parameters || []).some(p => p && p.toLowerCase().includes(q));
    return matchesOrg && matchesSearch;
  });

  const handleCopyEndpoint = (id: string, endpoint: string) => {
    navigator.clipboard.writeText(endpoint);
    setCopiedEndpointId(id);
    setTimeout(() => setCopiedEndpointId(null), 2500);
  };

  const handleTriggerDownload = (title: string, format: string) => {
    setDownloadNotice(`Generating verified ${format} data package for "${title}"... (Download initiated)`);
    setTimeout(() => setDownloadNotice(null), 4000);
  };

  // High contrast theme colors for chart lines
  const primaryLineColor = isDark ? '#00b4d8' : '#03045e';
  const secondaryLineColor = isDark ? '#00a896' : '#0077b6';
  const tertiaryLineColor = isDark ? '#ffb703' : '#d97706';
  const axisColor = isDark ? '#cbd5e1' : '#334155';
  const gridColor = isDark ? 'rgba(255, 255, 255, 0.15)' : 'rgba(15, 23, 42, 0.12)';

  return (
    <div className="space-y-6">
      {/* Top Banner Card */}
      <div className="liquid-glass-card rounded-3xl border border-slate-200/90 dark:border-slate-800 p-6 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-slate-100 dark:border-slate-800">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-cyan-500/10 dark:bg-cyan-500/20 text-cyan-700 dark:text-cyan-400 border border-cyan-500/20">
                <Database className="w-5 h-5" />
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white font-display">
                MoES Open Datasets & Observation Telemetry
              </h2>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300 max-w-3xl leading-relaxed">
              Official data access hub connecting training cohorts, research scientists, and operational meteorologists to live atmospheric, oceanic, polar, and geophysical datasets governed by the Ministry of Earth Sciences.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-emerald-500/10 dark:bg-emerald-500/20 border border-emerald-500/30 text-emerald-800 dark:text-emerald-300 text-xs font-bold">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>4 Data Portals Connected</span>
            </div>
          </div>
        </div>

        {/* Telemetry Metric Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-6">
          <div className="p-4 rounded-2xl bg-slate-50/90 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-cyan-700 dark:text-cyan-400">INCOIS Moored Buoys</span>
              <Waves className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
            </div>
            <p className="text-2xl font-black text-slate-900 dark:text-white mt-1 font-display">142 Active</p>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">Arabian Sea & Bay of Bengal</p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50/90 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-teal-700 dark:text-teal-400">IMD Doppler Radars</span>
              <CloudRain className="w-4 h-4 text-teal-600 dark:text-teal-400" />
            </div>
            <p className="text-2xl font-black text-slate-900 dark:text-white mt-1 font-display">37 Stations</p>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">Volumetric sweeps every 10m</p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50/90 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-amber-700 dark:text-amber-400">NCMRWF Forecast HPC</span>
              <Compass className="w-4 h-4 text-amber-600 dark:text-amber-400" />
            </div>
            <p className="text-2xl font-black text-slate-900 dark:text-white mt-1 font-display">4 Cycles/Day</p>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">Global 12km NCUM models</p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50/90 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-indigo-700 dark:text-indigo-400">NCPOR Polar Stations</span>
              <Snowflake className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            </div>
            <p className="text-2xl font-black text-slate-900 dark:text-white mt-1 font-display">3 Overwintering</p>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">Maitri, Bharati & Himadri</p>
          </div>
        </div>
      </div>

      {/* Interactive Telemetry Chart Viewer */}
      <div className="liquid-glass-card rounded-3xl border border-slate-200/90 dark:border-slate-800 p-6 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Radio className="w-4 h-4 text-cyan-600 dark:text-cyan-400 animate-pulse" />
              <span className="text-xs font-bold uppercase tracking-wider text-cyan-700 dark:text-cyan-400">
                Live Sensor Telemetry Stream (24-Hour Observation)
              </span>
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white mt-0.5">
              Oceanic, Atmospheric & Cryospheric Synchronized Telemetry
            </h3>
          </div>

          <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700">
            <button
              onClick={() => setActiveTelemetryMetric('wave_sst')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeTelemetryMetric === 'wave_sst'
                  ? 'bg-cyan-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
              }`}
            >
              INCOIS Wave & SST
            </button>
            <button
              onClick={() => setActiveTelemetryMetric('rainfall_wind')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeTelemetryMetric === 'rainfall_wind'
                  ? 'bg-cyan-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
              }`}
            >
              IMD Rain & Wind
            </button>
            <button
              onClick={() => setActiveTelemetryMetric('cryo')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeTelemetryMetric === 'cryo'
                  ? 'bg-cyan-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
              }`}
            >
              NCPOR Polar Albedo
            </button>
          </div>
        </div>

        {/* Chart */}
        <div className="h-72 w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={TELEMETRY_TIME_SERIES} margin={{ top: 10, right: 30, left: 0, bottom: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
              <XAxis dataKey="time" stroke={axisColor} tick={{ fontSize: 11, fill: axisColor }} />
              <YAxis stroke={axisColor} tick={{ fontSize: 11, fill: axisColor }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: isDark ? '#0f172a' : '#ffffff',
                  borderColor: isDark ? '#334155' : '#cbd5e1',
                  borderRadius: '12px',
                  color: isDark ? '#f8fafc' : '#0f172a',
                  fontSize: '12px'
                }}
              />
              <Legend verticalAlign="top" wrapperStyle={{ paddingBottom: '12px', fontSize: '12px' }} />

              {activeTelemetryMetric === 'wave_sst' && (
                <>
                  <Line 
                    type="monotone" 
                    dataKey="waveHeight" 
                    name="Wave Height (m) [INCOIS BD08]" 
                    stroke={primaryLineColor} 
                    strokeWidth={2.5} 
                    dot={{ r: 4, fill: primaryLineColor }} 
                    isAnimationActive={false}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="sst" 
                    name="Sea Surface Temp (°C) [INCOIS Buoy]" 
                    stroke={tertiaryLineColor} 
                    strokeWidth={2} 
                    dot={{ r: 4, fill: tertiaryLineColor }} 
                    isAnimationActive={false}
                  />
                </>
              )}

              {activeTelemetryMetric === 'rainfall_wind' && (
                <>
                  <Line 
                    type="monotone" 
                    dataKey="rainfall" 
                    name="Accumulated Rain (mm) [IMD DWR]" 
                    stroke={secondaryLineColor} 
                    strokeWidth={2.5} 
                    dot={{ r: 4, fill: secondaryLineColor }} 
                    isAnimationActive={false}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="windSpeed" 
                    name="Sustained Wind (kt) [IMD Coastal]" 
                    stroke={primaryLineColor} 
                    strokeWidth={2} 
                    dot={{ r: 4, fill: primaryLineColor }} 
                    isAnimationActive={false}
                  />
                </>
              )}

              {activeTelemetryMetric === 'cryo' && (
                <>
                  <Line 
                    type="monotone" 
                    dataKey="iceAlbedo" 
                    name="Surface Ice Albedo (Ratio) [NCPOR Maitri AWS]" 
                    stroke={primaryLineColor} 
                    strokeWidth={2.5} 
                    dot={{ r: 4, fill: primaryLineColor }} 
                    isAnimationActive={false}
                  />
                </>
              )}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Download Alert Notice */}
      {downloadNotice && (
        <div className="p-3.5 rounded-2xl bg-cyan-50 dark:bg-cyan-950/60 border border-cyan-200 dark:border-cyan-800 text-xs text-cyan-800 dark:text-cyan-200 flex items-center gap-2 animate-in fade-in">
          <Check className="w-4 h-4 text-cyan-600 shrink-0" />
          <span>{downloadNotice}</span>
        </div>
      )}

      {/* Organization Filters & Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-2">
          {['ALL', 'INCOIS', 'IMD', 'NCMRWF', 'NCPOR'].map(org => (
            <button
              key={org}
              onClick={() => setSelectedOrg(org)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-colors ${
                selectedOrg === org
                  ? 'bg-cyan-600 text-white shadow-xs'
                  : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
            >
              {org === 'ALL' ? 'All Institutes' : org}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-72">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search datasets, formats, or sensors..."
            className="w-full pl-9 pr-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
        </div>
      </div>

      {/* Dataset Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredDatasets.map(dataset => (
          <div
            key={dataset.id}
            className="liquid-glass-card rounded-3xl border border-slate-200/90 dark:border-slate-800 p-6 flex flex-col justify-between space-y-4 shadow-sm hover:border-cyan-500/40 transition-colors"
          >
            <div className="space-y-3">
              {/* Institution and Live Status */}
              <div className="flex items-center justify-between gap-2">
                <span className="px-2.5 py-0.5 rounded-lg text-[10px] font-bold tracking-wider uppercase bg-cyan-50 dark:bg-cyan-950/60 text-cyan-700 dark:text-cyan-300 border border-cyan-200 dark:border-cyan-800">
                  {dataset.organization}
                </span>

                <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span>{dataset.latency}</span>
                </div>
              </div>

              <div>
                <h4 className="text-base font-bold text-slate-900 dark:text-white font-display">
                  {dataset.title}
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  {dataset.source_institution}
                </p>
              </div>

              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                {dataset.description}
              </p>

              {/* Spatial and Temporal Coverage */}
              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 space-y-1.5 text-xs text-slate-700 dark:text-slate-300">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 dark:text-slate-400 font-medium">Coverage:</span>
                  <span className="font-semibold text-right">{dataset.spatial_coverage}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 dark:text-slate-400 font-medium">Cadence:</span>
                  <span className="font-semibold text-right">{dataset.temporal_resolution}</span>
                </div>
              </div>

              {/* Parameters Pills */}
              <div className="space-y-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                  Observed Parameters:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {dataset.parameters.map((param, idx) => (
                    <span 
                      key={idx}
                      className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                    >
                      {param}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Formats & Actions */}
            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-3">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">Formats:</span>
                  {dataset.formats.map(fmt => (
                    <button
                      key={fmt}
                      onClick={() => handleTriggerDownload(dataset.title, fmt)}
                      className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 hover:bg-cyan-50 dark:bg-slate-800 dark:hover:bg-cyan-950/60 text-slate-700 dark:text-slate-300 hover:text-cyan-700 dark:hover:text-cyan-300 border border-slate-200 dark:border-slate-700 transition-colors flex items-center gap-1"
                    >
                      <Download className="w-3 h-3" />
                      <span>{fmt}</span>
                    </button>
                  ))}
                </div>

                <button
                  onClick={() => handleCopyEndpoint(dataset.id, dataset.api_endpoint)}
                  className="px-2.5 py-1 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex items-center gap-1.5"
                  title="Copy API endpoint for Python/xarray"
                >
                  {copiedEndpointId === dataset.id ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-500" />
                      <span className="text-emerald-600 dark:text-emerald-400 font-bold">Copied URL</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 text-slate-400" />
                      <span>Copy API URL</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
