const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');

const DEFAULT_PASSWORD_HASH = bcrypt.hashSync('TraineeSecure2026!', 10);
const TRAINER_PASSWORD_HASH = bcrypt.hashSync('TrainerSecure2026!', 10);
const ADMIN_PASSWORD_HASH = bcrypt.hashSync('AdminMaster2026!', 10);

function generateSyntheticFaceVector(seed) {
  const vec = [];
  let sumSq = 0;
  for (let i = 0; i < 128; i++) {
    const val = Math.sin((seed + 1) * (i + 1) * 0.17) * 0.5 + Math.cos((seed + 2) * (i + 1) * 0.23) * 0.5;
    vec.push(val);
    sumSq += val * val;
  }
  const norm = Math.sqrt(sumSq) || 1;
  return vec.map(v => Number((v / norm).toFixed(6)));
}

const alexId = 'usr-trainee-001';
const sharmaId = 'usr-trainer-001';
const sarahId = 'usr-admin-001';
const marcusId = 'usr-admin-pending-002';
const priyaTraineeId = 'usr-trainee-priya';
const vikramTraineeId = 'usr-trainee-vikram';

const moesCourses = [
  {
    id: 'crs-ocean-001',
    title: 'Operational Oceanography & Coastal Dynamics',
    description: 'Master real-time ocean state forecasting, coastal storm surge modeling, Argo float telemetry, tsunami propagation physics, and INCOIS coastal advisory and high-wave alerting systems.',
    category: 'Ocean Sciences & INCOIS',
    level: 'Intermediate',
    trainer_id: sharmaId,
    trainer_name: 'Dr. Priya Sharma',
    duration_hours: 36,
    capacity: 60,
    enrolled_count: 28,
    status: 'published',
    cover_image: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=800&auto=format&fit=crop',
    skills_acquired: ['INCOIS Advisory Systems', 'Argo Float Telemetry', 'Storm Surge Modeling', 'Tidal Harmonics', 'Satellite Altimetry'],
    created_at: new Date(Date.now() - 14 * 86400000).toISOString(),
    modules: [
      {
        id: 'mod-c1-1',
        title: 'Ocean State Forecasting & Coastal Hazard Early Warning',
        duration_minutes: 90,
        type: 'video',
        content: 'Overview of INCOIS multi-hazard coastal early warning architecture, significant wave height (SWH) buoy telemetry, and swell surge prediction along Indian shorelines.'
      },
      {
        id: 'mod-c1-2',
        title: 'Argo Float Profiling, CTD Sensors & Telemetry Networks',
        duration_minutes: 110,
        type: 'reading',
        content: 'Autonomous buoyancy engines, CTD (Conductivity, Temperature, Depth) calibrations, Iridium satellite telemetry transmission, and global Argo quality control pipelines.'
      },
      {
        id: 'mod-c1-3',
        title: 'Hydrodynamic Wave Modeling & Nearshore Coastal Dynamics',
        duration_minutes: 130,
        type: 'practical',
        content: 'Simulating nearshore circulation, bathymetric refraction, breaker zone shoaling, and sediment transport using coupled hydrodynamic models.'
      },
      {
        id: 'mod-c1-4',
        title: 'Tsunami Propagation Physics & INCOIS Advisory Protocols',
        duration_minutes: 95,
        type: 'assignment',
        content: 'Deep ocean shallow-water wave equations, Bottom Pressure Recorder (BPR) inversion, and standard operating procedures for coastal evacuation bulletins.'
      }
    ]
  },
  {
    id: 'crs-deepsea-002',
    title: 'Deep Ocean Mission & Marine Resources Exploration',
    description: 'Engineering and scientific curriculum for Samudrayaan crewed submersible operations, polymetallic nodules surveying, ocean thermal energy conversion (OTEC), and hydrothermal vent biogeochemistry.',
    category: 'Deep Ocean Mission & NIOT',
    level: 'Advanced',
    trainer_id: sharmaId,
    trainer_name: 'Dr. Priya Sharma',
    duration_hours: 42,
    capacity: 45,
    enrolled_count: 22,
    status: 'published',
    cover_image: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?q=80&w=800&auto=format&fit=crop',
    skills_acquired: ['Samudrayaan Submersible Systems', 'Polymetallic Nodule Survey', 'Sub-Bottom Profiling', 'Hydrothermal Geochemistry', 'Deep Sea Pressure Vessels'],
    created_at: new Date(Date.now() - 20 * 86400000).toISOString(),
    modules: [
      {
        id: 'mod-c2-1',
        title: 'Samudrayaan MATSYA-6000 Submersible System Architecture',
        duration_minutes: 120,
        type: 'video',
        content: 'Titanium personnel sphere structural mechanics, syntactic foam buoyancy, 600 bar hydrostatic life support systems, and underwater acoustic communication.'
      },
      {
        id: 'mod-c2-2',
        title: 'Seafloor Bathymetry, Acoustic Multibeam & Sub-Bottom Profiling',
        duration_minutes: 100,
        type: 'reading',
        content: 'Multibeam echo sounder backscatter processing, side-scan sonar interpretation, and high-resolution digital terrain modeling of the Central Indian Basin.'
      },
      {
        id: 'mod-c2-3',
        title: 'Deep-Sea Mineral Extraction & Polymetallic Nodule Assessment',
        duration_minutes: 140,
        type: 'practical',
        content: 'Resource appraisal methodologies for copper, nickel, and cobalt nodules; tracked underwater seabed collector vehicle robotics; and benthic environmental impact baselines.'
      }
    ]
  },
  {
    id: 'crs-weather-003',
    title: 'Numerical Weather Prediction & Monsoon Modeling',
    description: 'High-resolution dynamical forecasting utilizing NCUM models, Doppler weather radar ingestion, cloud microphysics, satellite radiances (INSAT-3D), and extreme precipitation alert systems.',
    category: 'Atmospheric Sciences & IMD/NCMRWF',
    level: 'Advanced',
    trainer_id: sharmaId,
    trainer_name: 'Dr. Priya Sharma',
    duration_hours: 40,
    capacity: 50,
    enrolled_count: 32,
    status: 'published',
    cover_image: 'https://images.unsplash.com/photo-1534088568595-a066f410bcda?q=80&w=800&auto=format&fit=crop',
    skills_acquired: ['NCUM Unified Model', 'Doppler Weather Radar (DWR)', 'INSAT-3D Radiance Data', 'Monsoon Dynamics', 'Ensemble Forecasts'],
    created_at: new Date(Date.now() - 28 * 86400000).toISOString(),
    modules: [
      {
        id: 'mod-c3-1',
        title: 'Dynamical Atmospheric Thermodynamics & Primitive Equations',
        duration_minutes: 90,
        type: 'video',
        content: 'Hydrostatic vs non-hydrostatic core equations, convective parameterizations, planetary boundary layer dynamics, and monsoon trough physics.'
      },
      {
        id: 'mod-c3-2',
        title: 'Doppler Weather Radar Ingestion & Velocity De-aliasing',
        duration_minutes: 110,
        type: 'practical',
        content: 'Radial velocity nyquist unwrapping, reflectivity attenuation correction, dual-polarization hydrometeor classification, and nowcasting flash flood cells.'
      },
      {
        id: 'mod-c3-3',
        title: 'Satellite Radiance Data Assimilation in NCMRWF Global Models',
        duration_minutes: 125,
        type: 'reading',
        content: '4D-Var assimilation cycles, INSAT-3DR sounder radiances, cloud-cleared brightness temperatures, and high-performance computing parallel scaling.'
      }
    ]
  },
  {
    id: 'crs-polar-004',
    title: 'Polar Sciences & Cryosphere Research',
    description: 'Antarctic ice-sheet mass balance, Maitri and Bharati station logistics, Arctic Svalbard sea-ice extent dynamics, and Himalayan third-pole glacial melt telemetry under NCPOR guidance.',
    category: 'Polar Sciences & NCPOR',
    level: 'Intermediate',
    trainer_id: sharmaId,
    trainer_name: 'Dr. Priya Sharma',
    duration_hours: 32,
    capacity: 40,
    enrolled_count: 19,
    status: 'published',
    cover_image: 'https://images.unsplash.com/photo-1483921020237-2ff51e8e4b22?q=80&w=800&auto=format&fit=crop',
    skills_acquired: ['Cryospheric Mass Balance', 'Ice Core Paleoclimatology', 'Bharati/Maitri Station Operations', 'SAR Sea Ice Mapping', 'Himalayan Glacial Runoff'],
    created_at: new Date(Date.now() - 30 * 86400000).toISOString(),
    modules: [
      {
        id: 'mod-c4-1',
        title: 'Antarctic Ice Sheet Dynamics & Glaciological Field Stations',
        duration_minutes: 85,
        type: 'video',
        content: 'Ice flow velocity interferometry, grounding line migration, operational life support in Larsemann Hills (Bharati) and Schirmacher Oasis (Maitri).'
      },
      {
        id: 'mod-c4-2',
        title: 'Ice Core Stratigraphy & Past Climate Reconstructions',
        duration_minutes: 95,
        type: 'reading',
        content: 'Stable oxygen isotope ratios (d18O), trapped greenhouse gas atmospheric paleorecords, volcanic aerosol tephra layers, and cryo-chamber analytical protocols.'
      },
      {
        id: 'mod-c4-3',
        title: 'Himalayan Glacial Lake Outburst Flood (GLOF) Monitoring',
        duration_minutes: 105,
        type: 'practical',
        content: 'Satellite optical and synthetic aperture radar (SAR) monitoring of proglacial lakes, moraine dam stability assessment, and automated early warning sirens.'
      }
    ]
  },
  {
    id: 'crs-seismo-005',
    title: 'Seismology & Tsunami Early Warning Systems',
    description: 'Real-time seismic network monitoring across the Indian subcontinent, moment magnitude calculation, seabed bottom pressure recorder (BPR) telemetry, and coastal inundation warning dissemination.',
    category: 'Geosciences & NCS/ITEWC',
    level: 'Intermediate',
    trainer_id: sharmaId,
    trainer_name: 'Dr. Priya Sharma',
    duration_hours: 35,
    capacity: 50,
    enrolled_count: 34,
    status: 'published',
    cover_image: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?q=80&w=800&auto=format&fit=crop',
    skills_acquired: ['Broadband Seismometry', 'Moment Magnitude (Mw) Inversion', 'Bottom Pressure Recorder Telemetry', 'Tsunami Inundation Mapping', 'Focal Mechanism Analysis'],
    created_at: new Date(Date.now() - 35 * 86400000).toISOString(),
    modules: [
      {
        id: 'mod-c5-1',
        title: 'Broadband Seismic Network Operations & Signal Deconvolution',
        duration_minutes: 90,
        type: 'video',
        content: 'Instrumentation transfer functions, digital telemetry packet transmission via VSAT, and broadband sensor self-noise PSD calculation.'
      },
      {
        id: 'mod-c5-2',
        title: 'Real-Time Hypocenter Location & Moment Magnitude Computation',
        duration_minutes: 115,
        type: 'reading',
        content: 'Travel-time arrival picking, P-wave first motion polarities, fast centroid moment tensor (W-phase) inversion for megathrust subduction events.'
      },
      {
        id: 'mod-c5-3',
        title: 'Indian Ocean Tsunami Early Warning Centre (ITEWC) Architecture',
        duration_minutes: 130,
        type: 'practical',
        content: 'Pre-computed scenario database indexing, real-time sea-level gauge assimilation, tsunami travel time calculation, and threat matrix dissemination.'
      }
    ]
  },
  {
    id: 'crs-climate-006',
    title: 'Climate Change Science & Earth System Science',
    description: 'Coupled climate models (IPCC CMIP6 projections), biogeochemical carbon cycles, ocean acidification, sea level rise dynamics, and regional climate vulnerability assessments for the Indian subcontinent.',
    category: 'Climate Sciences & CCCR/IITM',
    level: 'Advanced',
    trainer_id: sharmaId,
    trainer_name: 'Dr. Priya Sharma',
    duration_hours: 38,
    capacity: 50,
    enrolled_count: 25,
    status: 'published',
    cover_image: 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?q=80&w=800&auto=format&fit=crop',
    skills_acquired: ['Coupled Climate Models (AOGCM)', 'IPCC CMIP6 Analysis', 'Biogeochemical Carbon Cycles', 'Sea Level Rise Projections', 'Downscaled Climate Modeling'],
    created_at: new Date(Date.now() - 40 * 86400000).toISOString(),
    modules: [
      {
        id: 'mod-c6-1',
        title: 'Earth System Feedback Mechanisms & Carbon Cycle Budgets',
        duration_minutes: 100,
        type: 'video',
        content: 'Air-sea carbon dioxide flux, biological ocean carbon pump, terrestrial biosphere feedbacks, and global radiative forcing calculations.'
      },
      {
        id: 'mod-c6-2',
        title: 'Downscaled Regional Climate Projections for South Asia',
        duration_minutes: 120,
        type: 'practical',
        content: 'Statistical and dynamical downscaling of CMIP6 models, extremes indices (heatwave days, heavy precipitation frequency), and drought spell modeling.'
      },
      {
        id: 'mod-c6-3',
        title: 'Ocean Acidification, Marine Heatwaves & Coral Bleaching',
        duration_minutes: 95,
        type: 'reading',
        content: 'Aragonite saturation states, degree heating weeks (DHW) calculation from NOAA/INCOIS satellite telemetry, and Gulf of Mannar coral reef impact assessments.'
      }
    ]
  }
];

const moesAssessments = [
  {
    id: 'asm-ocean-01',
    course_id: 'crs-ocean-001',
    course_title: 'Operational Oceanography & Coastal Dynamics',
    title: 'Operational Oceanography & INCOIS Advisory Certification Assessment',
    description: 'Evaluate your understanding of ocean state forecasting, coastal high-wave alerts, CTD profiling, and tsunami physics.',
    time_limit_minutes: 20,
    passing_score: 75,
    created_at: new Date(Date.now() - 10 * 86400000).toISOString(),
    questions: [
      {
        id: 'q1',
        question: 'Which sensor package on an Argo float measures salinity indirectly via electrical conductivity?',
        options: ['Doppler Current Profiler', 'CTD (Conductivity, Temperature, Depth) sensor', 'Transmissometer', 'Pyranometer'],
        correct_index: 1,
        explanation: 'CTD instruments measure electrolytic conductivity, temperature, and pressure, from which seawater salinity and density are derived via the TEOS-10 equation of state.'
      },
      {
        id: 'q2',
        question: 'In deep water, what governs the phase velocity of a tsunami wave?',
        options: [
          'Wave amplitude and surface wind stress',
          'Square root of the product of gravitational acceleration and ocean depth (sqrt(g*d))',
          'Coriolis parameter and sea surface temperature',
          'Atmospheric pressure differential across the storm center'
        ],
        correct_index: 1,
        explanation: 'Because tsunami wavelengths (100-500 km) vastly exceed ocean depth (4-5 km), tsunamis act as shallow-water waves where c = sqrt(g*d), traveling at ~700-800 km/h in the open ocean.'
      },
      {
        id: 'q3',
        question: 'What is the primary indicator used by INCOIS to issue High Wave Alerts for coastal fishermen?',
        options: [
          'Significant Wave Height (SWH) exceeding critical operational thresholds',
          'Barometric pressure drop below 1013 hPa',
          'Surface water chlorophyll-a concentration',
          'Subsurface acoustic attenuation'
        ],
        correct_index: 0,
        explanation: 'Significant Wave Height (SWH), defined as the mean height of the highest third of waves, is the core metric for maritime high wave advisories.'
      }
    ]
  },
  {
    id: 'asm-deepsea-02',
    course_id: 'crs-deepsea-002',
    course_title: 'Deep Ocean Mission & Marine Resources Exploration',
    title: 'Deep Ocean Mission & Submersible Engineering Exam',
    description: 'Assessment covering Samudrayaan MATSYA-6000 systems, polymetallic nodule bathymetry, and benthic ecosystems.',
    time_limit_minutes: 20,
    passing_score: 75,
    created_at: new Date(Date.now() - 15 * 86400000).toISOString(),
    questions: [
      {
        id: 'q1',
        question: 'What material is primarily used to construct the personnel sphere of the MATSYA-6000 crewed submersible to resist 600 bar hydrostatic pressure?',
        options: ['Aerospace grade Titanium alloy (Ti-6Al-4V)', 'Reinforced Carbon Fiber', 'Austenitic Stainless Steel 316L', 'High-Density Polyethylene'],
        correct_index: 0,
        explanation: 'High-strength titanium alloy (Ti-6Al-4V) provides the critical strength-to-weight ratio and corrosion resistance required to withstand extreme pressure at 6,000 meters depth.'
      },
      {
        id: 'q2',
        question: 'Polymetallic nodules in the Central Indian Ocean Basin are predominantly rich in which key strategic minerals?',
        options: [
          'Nickel, Copper, Cobalt, and Manganese',
          'Uranium and Thorium',
          'Gold and Platinum group elements only',
          'Bauxite and Aluminum silicates'
        ],
        correct_index: 0,
        explanation: 'Polymetallic nodules are authigenic deposits exceptionally rich in manganese, iron, nickel, copper, and cobalt essential for green transition batteries and electronics.'
      }
    ]
  },
  {
    id: 'asm-weather-03',
    course_id: 'crs-weather-003',
    course_title: 'Numerical Weather Prediction & Monsoon Modeling',
    title: 'Numerical Weather Prediction & Doppler Radar Assessment',
    description: 'Exam on NCUM dynamics, Doppler radar reflectivity, velocity de-aliasing, and monsoon forecasting.',
    time_limit_minutes: 25,
    passing_score: 75,
    created_at: new Date(Date.now() - 12 * 86400000).toISOString(),
    questions: [
      {
        id: 'q1',
        question: 'Why must Doppler Weather Radar (DWR) data undergo velocity de-aliasing before assimilation into numerical models?',
        options: [
          'To resolve Doppler dilemma ambiguous velocities exceeding the Nyquist velocity interval',
          'To convert radar frequency from S-band to X-band',
          'To remove rain gauge calibration drift',
          'To align radar beams with geostationary satellite longitude'
        ],
        correct_index: 0,
        explanation: 'The Doppler dilemma limits maximum unambiguous velocity (Vmax = lambda * PRF / 4); radial velocities exceeding this wrap around and must be unwrapped (de-aliased).'
      },
      {
        id: 'q2',
        question: 'In India Meteorological Department (IMD) cyclone forecasting, what is the primary diagnostic used to estimate central core pressure and sustained wind speed from satellite images?',
        options: [
          'Dvorak Technique using infrared cloud pattern analysis',
          'Surface soil moisture microwave radiometry',
          'Tide gauge anomaly subtraction',
          'Upper tropospheric ozone concentration'
        ],
        correct_index: 0,
        explanation: 'The Dvorak technique relates satellite cloud system patterns (curved banding, central dense overcast, eye temperature) to tropical cyclone T-numbers and maximum sustained wind speeds.'
      }
    ]
  },
  {
    id: 'asm-polar-04',
    course_id: 'crs-polar-004',
    course_title: 'Polar Sciences & Cryosphere Research',
    title: 'Polar Sciences & Cryospheric Dynamics Assessment',
    description: 'Assessment on Antarctic ice sheet dynamics, Bharati/Maitri station operations, and Himalayan glaciology.',
    time_limit_minutes: 20,
    passing_score: 75,
    created_at: new Date(Date.now() - 18 * 86400000).toISOString(),
    questions: [
      {
        id: 'q1',
        question: 'India operates two year-round permanent scientific research stations in Antarctica named:',
        options: ['Maitri and Bharati', 'Dakshin Gangotri and Himadri', 'IndARC and IndOOS', 'Sagar Nidhi and Sagar Kanya'],
        correct_index: 0,
        explanation: 'Maitri (established 1989 in Schirmacher Oasis) and Bharati (commissioned 2012 in Larsemann Hills) are Indias active overwintering Antarctic stations. (Himadri is in the Arctic).'
      },
      {
        id: 'q2',
        question: 'In ice core paleoclimatology, how does the ratio of stable oxygen isotopes (d18O) correlate with past temperatures at the time of precipitation?',
        options: [
          'More negative d18O values indicate colder atmospheric condensation temperatures',
          'd18O values are completely independent of temperature',
          'Higher d18O always correlates directly with glacial maximum cold spells',
          'd18O only measures oceanic salinity, not temperature'
        ],
        correct_index: 0,
        explanation: 'Preferential rainout of heavier 18O isotopes during Rayleigh distillation causes snow condensing in colder polar air masses to be progressively depleted in 18O (more negative d18O).'
      }
    ]
  },
  {
    id: 'asm-seismo-05',
    course_id: 'crs-seismo-005',
    course_title: 'Seismology & Tsunami Early Warning Systems',
    title: 'Seismology & Tsunami Warning Operations Assessment',
    description: 'Test your proficiency in broadband seismogram interpretation, Mw calculation, and ITEWC warning protocols.',
    time_limit_minutes: 20,
    passing_score: 75,
    created_at: new Date(Date.now() - 8 * 86400000).toISOString(),
    questions: [
      {
        id: 'q1',
        question: 'Why does Moment Magnitude (Mw) not saturate for giant megathrust earthquakes like the Gutenberg-Richter local magnitude (ML) does?',
        options: [
          'Because Mw is directly proportional to the physical seismic moment (M0 = shear modulus * rupture area * slip distance)',
          'Because Mw only measures high-frequency P-wave acceleration',
          'Because Mw is calculated from air pressure shockwaves',
          'Because Mw ignores deep rupture geometries'
        ],
        correct_index: 0,
        explanation: 'Moment magnitude is based on the physical seismic moment (M0), accounting for the full spectral energy across the entire physical rupture surface without peak-amplitude saturation.'
      },
      {
        id: 'q2',
        question: 'At the Indian National Tsunami Early Warning Centre (ITEWC) in INCOIS, within how many minutes of an undersea earthquake must the first advisory bulletin be issued?',
        options: ['10 minutes', '60 minutes', '45 minutes', '120 minutes'],
        correct_index: 0,
        explanation: 'ITEWC SOP mandates preliminary earthquake detection, epicenter determination, magnitude estimation, and initial threat assessment bulletin issuance within 10 minutes of occurrence.'
      }
    ]
  },
  {
    id: 'asm-climate-06',
    course_id: 'crs-climate-006',
    course_title: 'Climate Change Science & Earth System Science',
    title: 'Climate Change Science & Earth System Science Assessment',
    description: 'Exam on coupled climate models, IPCC CMIP6 scenarios, and marine climate impacts.',
    time_limit_minutes: 20,
    passing_score: 75,
    created_at: new Date(Date.now() - 14 * 86400000).toISOString(),
    questions: [
      {
        id: 'q1',
        question: 'What is the chemical mechanism causing ocean acidification due to anthropogenic carbon dioxide emissions?',
        options: [
          'CO2 dissolves in seawater forming carbonic acid (H2CO3), releasing H+ ions and reducing carbonate ion (CO3 2-) concentration',
          'CO2 reacts with sea salt to produce hydrochloric acid',
          'Atmospheric ozone depletion allows ultraviolet rays to acidify surface currents',
          'Underwater geothermal vents releasing sulfur dioxide'
        ],
        correct_index: 0,
        explanation: 'CO2 + H2O <-> H2CO3 <-> H+ + HCO3-. The excess H+ ions bind with carbonate ions (CO3 2-), reducing aragonite saturation needed for calcifying marine organisms.'
      }
    ]
  }
];

const moesAssignments = [
  {
    id: 'asg-ocean-01',
    course_id: 'crs-ocean-001',
    course_title: 'Operational Oceanography & Coastal Dynamics',
    title: 'Assignment 1: INCOIS Real-Time Wave & SST Forecast Validation Study',
    description: 'Download 7-day numerical wave model outputs (WAM/WAVEWATCH III) from INCOIS and perform statistical skill scoring against deployed offshore moored buoy observations (MB11 and BD08). Submit your validation report with bias, RMSE, and scatter plots.',
    due_date: new Date(Date.now() + 5 * 86400000).toISOString(),
    total_points: 100,
    rubric: [
      { criteria: 'Data Preprocessing & Buoy Ingestion', max_points: 25, description: 'Correct NetCDF parsing, time-series alignment, and quality control filtering.' },
      { criteria: 'Statistical Skill Metrics (Bias, RMSE, Scatter Index)', max_points: 35, description: 'Rigorous calculation of statistical wave model skill scores.' },
      { criteria: 'Extreme Event Case Analysis', max_points: 25, description: 'Detailed analysis of high wave swell event propagation across the shelf.' },
      { criteria: 'Code Cleanliness & Visualizations', max_points: 15, description: 'Production-ready Python code with clear publication-standard oceanographic plots.' }
    ],
    created_at: new Date(Date.now() - 6 * 86400000).toISOString()
  },
  {
    id: 'asg-deepsea-01',
    course_id: 'crs-deepsea-002',
    course_title: 'Deep Ocean Mission & Marine Resources Exploration',
    title: 'Assignment 2: Deep Ocean Mission Polymetallic Nodule Survey & Bathymetric Grid',
    description: 'Process raw multibeam echo sounder backscatter and bathymetry data from the Central Indian Ocean Basin. Generate 50m spatial resolution terrain grids and delineate high-density polymetallic nodule resource zones.',
    due_date: new Date(Date.now() + 8 * 86400000).toISOString(),
    total_points: 100,
    rubric: [
      { criteria: 'Multibeam Sound Velocity Correction', max_points: 30, description: 'Applying CTD sound velocity profiles to eliminate ray bending artifacts.' },
      { criteria: 'Acoustic Backscatter Classification', max_points: 35, description: 'Segmenting hard substrate / nodule fields from soft pelagic sediment.' },
      { criteria: 'Benthic Bathymetric Mapping & Slopes', max_points: 35, description: 'Producing contour maps and slope stability analysis for submersible navigation.' }
    ],
    created_at: new Date(Date.now() - 5 * 86400000).toISOString()
  },
  {
    id: 'asg-weather-01',
    course_id: 'crs-weather-003',
    course_title: 'Numerical Weather Prediction & Monsoon Modeling',
    title: 'Assignment 3: Doppler Radar Velocity De-Aliasing & Monsoon Depression Trajectory',
    description: 'Implement a two-dimensional velocity de-aliasing algorithm in Python on raw IMD S-band radar volume data during a severe monsoon depression over the Bay of Bengal.',
    due_date: new Date(Date.now() + 10 * 86400000).toISOString(),
    total_points: 100,
    created_at: new Date(Date.now() - 7 * 86400000).toISOString()
  },
  {
    id: 'asg-polar-01',
    course_id: 'crs-polar-004',
    course_title: 'Polar Sciences & Cryosphere Research',
    title: 'Assignment 4: Antarctic Maitri-Bharati Ice Shelf Calving & Albedo Analysis',
    description: 'Analyze multi-temporal Sentinel-1 SAR and MODIS optical datasets to compute ice-flow velocities and surface albedo variations near the Schirmacher Oasis and Larsemann Hills.',
    due_date: new Date(Date.now() + 12 * 86400000).toISOString(),
    total_points: 100,
    created_at: new Date(Date.now() - 4 * 86400000).toISOString()
  },
  {
    id: 'asg-seismo-01',
    course_id: 'crs-seismo-005',
    course_title: 'Seismology & Tsunami Early Warning Systems',
    title: 'Assignment 5: Indian Ocean Tsunami Inundation Modeling & Travel Time Isochrone Mapping',
    description: 'Simulate tsunami wave propagation for a hypothetical Mw 8.7 megathrust earthquake in the Andaman-Sumatra subduction zone using TUNAMI-N2 shallow-water solver. Produce coastal arrival time isochrones and inundation hazard maps for Chennai and Visakhapatnam.',
    due_date: new Date(Date.now() + 14 * 86400000).toISOString(),
    total_points: 100,
    created_at: new Date(Date.now() - 10 * 86400000).toISOString()
  }
];

const moesSubmissions = [
  {
    id: 'sub-alex-01',
    assignment_id: 'asg-ocean-01',
    assignment_title: 'Assignment 1: INCOIS Real-Time Wave & SST Forecast Validation Study',
    course_id: 'crs-ocean-001',
    course_title: 'Operational Oceanography & Coastal Dynamics',
    user_id: alexId,
    user_name: 'Alex Rivera',
    user_email: 'alex.trainee@capacityconnect.org',
    submitted_at: new Date(Date.now() - 2 * 86400000).toISOString(),
    file_name: 'incois_wave_validation_analysis.py',
    file_size: '345 KB',
    file_type: 'text/x-python',
    notes: 'Parsed NetCDF outputs from INCOIS THREDDS server and verified against moored buoy BD08. Computed RMSE: 0.18m, Scatter Index: 0.12, Correlation: 0.94.',
    status: 'graded',
    score: 95,
    grader_feedback: 'Outstanding validation pipeline with rigorous statistical scoring and clear oceanic wave spectral plots.',
    graded_by: 'ai',
    ai_report: {
      score_estimate: 95,
      rubric_evaluations: [
        { criteria: 'Data Preprocessing & Buoy Ingestion', points: 25, max_points: 25, reasoning: 'Clean xarray and pandas ingestion with proper handling of missing buoy flags.' },
        { criteria: 'Statistical Skill Metrics', points: 34, max_points: 35, reasoning: 'Comprehensive calculation of Bias (-0.04m), RMSE (0.18m), SI (0.12), and Nash-Sutcliffe efficiency.' },
        { criteria: 'Extreme Event Case Analysis', points: 23, max_points: 25, reasoning: 'Well-documented capture of 3.8m swell event in Bay of Bengal with accurate peak lag identification.' },
        { criteria: 'Code Cleanliness & Visualizations', points: 13, max_points: 15, reasoning: 'Publication-quality matplotlib oceanographic timeseries and Taylor diagram.' }
      ],
      key_strengths: [
        'Robust statistical scoring adhering to WMO oceanographic forecast validation guidelines.',
        'High execution efficiency using vectorized NumPy and xarray operations.'
      ],
      areas_for_improvement: [
        'Include directional wave spreading validation in addition to significant wave height.'
      ],
      summary: 'High-caliber research analysis directly applicable to operational ocean state advisory workflows at INCOIS.',
      graded_at: new Date(Date.now() - 1 * 86400000).toISOString(),
      model_used: 'Gemini 3.8 Flash (Server-Side Evaluation)'
    }
  }
];

const moesExperiments = [
  {
    id: 'exp-001',
    course_id: 'crs-ocean-001',
    course_title: 'Operational Oceanography & Coastal Dynamics',
    user_id: alexId,
    user_name: 'Alex Rivera',
    user_email: 'alex.trainee@capacityconnect.org',
    title: 'CTD Profiler Calibration & Sound Velocity Stratification in Arabian Sea',
    description: 'Demonstration of laboratory calibration procedures for Sea-Bird SBE-911plus CTD conductivity and temperature cells, followed by sound velocity profile (SVP) calculation using Chen-Millero formulation.',
    video_url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
    video_format: 'mp4',
    duration_seconds: 195,
    lab_parameters: 'Salinity standard: IAPSO P-series seawater, Temperature bath: 0.001°C stability, Depth rating: 6800m',
    status: 'approved',
    score: 96,
    trainer_feedback: 'Impeccable sensor calibration technique. Sound speed profile calculation accurately captured the SOFAR acoustic channel axis at 1,150m.',
    reviewed_by: 'Dr. Priya Sharma',
    reviewed_at: new Date(Date.now() - 2 * 86400000).toISOString(),
    created_at: new Date(Date.now() - 4 * 86400000).toISOString()
  },
  {
    id: 'exp-002',
    course_id: 'crs-weather-003',
    course_title: 'Numerical Weather Prediction & Monsoon Modeling',
    user_id: priyaTraineeId,
    user_name: 'Priya Patel',
    user_email: 'priya.patel@capacityconnect.org',
    title: 'Doppler Weather Radar S-Band Beam Echo De-Aliasing under Extreme Monsoon Cells',
    description: 'Live console recording of IMD Chennai S-band radar data processing, displaying radial velocity unfolding under 45 m/s squall line conditions.',
    video_url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
    video_format: 'webm',
    duration_seconds: 220,
    lab_parameters: 'Radar: IMD S-Band 2.8 GHz, PRF: 1200/900 dual-PRF, Elevation angle: 0.5° - 19.5°',
    status: 'approved',
    score: 93,
    trainer_feedback: 'Clear demonstration of dual-PRF phase unfolding. Dual-polarization hydrometeor classification was well explained.',
    reviewed_by: 'Dr. Priya Sharma',
    reviewed_at: new Date(Date.now() - 3 * 86400000).toISOString(),
    created_at: new Date(Date.now() - 5 * 86400000).toISOString()
  },
  {
    id: 'exp-003',
    course_id: 'crs-deepsea-002',
    course_title: 'Deep Ocean Mission & Marine Resources Exploration',
    user_id: alexId,
    user_name: 'Alex Rivera',
    user_email: 'alex.trainee@capacityconnect.org',
    title: 'Sub-Bottom Profiler Acoustic Reflection Telemetry for Deep Sea Bed Sediment',
    description: 'Hydroacoustic lab simulation utilizing chirp sub-bottom profiler (2-7 kHz) penetrating 40m of soft pelagic sediment overlaying basaltic basement in the Central Indian Basin.',
    video_url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4',
    video_format: 'mov',
    duration_seconds: 280,
    lab_parameters: 'Chirp pulse: 2-7 kHz linear FM, Sampling: 50 kHz, Depth: 5200m simulated',
    status: 'under_review',
    created_at: new Date(Date.now() - 1 * 86400000).toISOString()
  },
  {
    id: 'exp-004',
    course_id: 'crs-seismo-005',
    course_title: 'Seismology & Tsunami Early Warning Systems',
    user_id: vikramTraineeId,
    user_name: 'Vikramaditya Rao',
    user_email: 'vikram.rao@capacityconnect.org',
    title: 'Broadband Seismometer Triaxial Huddle Test & Instrumental Self-Noise PSD Calculation',
    description: 'Laboratory huddle test comparing three Streckeisen STS-2.5 broadband seismometers installed on isolated seismic pier to compute coherence and Peterson New Low Noise Model (NLNM) baselines.',
    video_url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyBlazes.mp4',
    video_format: 'mkv',
    duration_seconds: 210,
    lab_parameters: 'Sensors: 3x STS-2.5 broadband, Digitizer: 24-bit 100 sps, Duration: 48 hours noise record',
    status: 'under_review',
    created_at: new Date(Date.now() - 1 * 86400000).toISOString()
  },
  {
    id: 'exp-005',
    course_id: 'crs-polar-004',
    course_title: 'Polar Sciences & Cryosphere Research',
    title: 'Ice Core Density & Electrical Conductivity Measurement (ECM) Cryo-Chamber Experiment',
    description: 'Cryo-facility experiment at -20°C demonstrating continuous high-resolution electrical conductivity profiling of Antarctic Maitri firn ice cores to detect historic volcanic acidity peaks.',
    video_url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerMeltdowns.mp4',
    video_format: 'mp4',
    duration_seconds: 180,
    lab_parameters: 'Chamber temperature: -20°C, Voltage: 1250V DC micro-probe, Core diameter: 100mm',
    status: 'approved',
    score: 95,
    trainer_feedback: 'Excellent cold room safety protocol adherence. Acidity peaks accurately matched the 1815 Tambora volcanic marker horizon.',
    reviewed_by: 'Dr. Priya Sharma',
    reviewed_at: new Date(Date.now() - 4 * 86400000).toISOString(),
    created_at: new Date(Date.now() - 6 * 86400000).toISOString()
  }
];

const moesUsers = [
  {
    id: sarahId,
    email: 'sarah.admin@capacityconnect.org',
    full_name: 'Sarah Chen',
    name: 'Sarah Chen',
    role: 'admin',
    phone: '+91 98765 43210',
    organization: 'Ministry of Earth Sciences (MoES), Govt. of India',
    department: 'Directorate of Capacity Building & Human Resource Development',
    status: 'active',
    avatar_url: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=200&auto=format&fit=crop',
    has_biometrics: true,
    password_hash: ADMIN_PASSWORD_HASH,
    created_at: new Date(Date.now() - 60 * 86400000).toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: sharmaId,
    email: 'dr.sharma@capacityconnect.org',
    full_name: 'Dr. Priya Sharma',
    name: 'Dr. Priya Sharma',
    role: 'trainer',
    phone: '+91 98111 22334',
    organization: 'Indian National Centre for Ocean Information Services (INCOIS), MoES',
    department: 'Operational Oceanography & Advisory Services Division',
    status: 'active',
    avatar_url: 'https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?q=80&w=200&auto=format&fit=crop',
    has_biometrics: true,
    password_hash: TRAINER_PASSWORD_HASH,
    created_at: new Date(Date.now() - 45 * 86400000).toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: alexId,
    email: 'alex.trainee@capacityconnect.org',
    full_name: 'Alex Rivera',
    name: 'Alex Rivera',
    role: 'trainee',
    phone: '+91 99555 66778',
    organization: 'Indian National Centre for Ocean Information Services (INCOIS), MoES',
    department: 'Ocean Observation & Computational Modeling Wing',
    status: 'active',
    avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=200&auto=format&fit=crop',
    has_biometrics: true,
    password_hash: DEFAULT_PASSWORD_HASH,
    created_at: new Date(Date.now() - 25 * 86400000).toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: priyaTraineeId,
    email: 'priya.patel@capacityconnect.org',
    full_name: 'Priya Patel',
    name: 'Priya Patel',
    role: 'trainee',
    phone: '+91 98222 33445',
    organization: 'India Meteorological Department (IMD), MoES',
    department: 'Numerical Weather Prediction & Doppler Radar Division',
    status: 'active',
    avatar_url: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=200&auto=format&fit=crop',
    has_biometrics: true,
    password_hash: DEFAULT_PASSWORD_HASH,
    created_at: new Date(Date.now() - 20 * 86400000).toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: vikramTraineeId,
    email: 'vikram.rao@capacityconnect.org',
    full_name: 'Vikramaditya Rao',
    name: 'Vikramaditya Rao',
    role: 'trainee',
    phone: '+91 97333 44556',
    organization: 'National Centre for Medium Range Weather Forecasting (NCMRWF), MoES',
    department: 'Global Unified Modeling & Data Assimilation Lab',
    status: 'active',
    avatar_url: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?q=80&w=200&auto=format&fit=crop',
    has_biometrics: true,
    password_hash: DEFAULT_PASSWORD_HASH,
    created_at: new Date(Date.now() - 15 * 86400000).toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: marcusId,
    email: 'marcus.pending@capacityconnect.org',
    full_name: 'Marcus Vance',
    name: 'Marcus Vance',
    role: 'admin',
    phone: '+91 94333 88990',
    organization: 'National Centre for Polar and Ocean Research (NCPOR), MoES',
    department: 'Antarctic Logistics & Cryospheric Operations',
    status: 'pending',
    avatar_url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=200&auto=format&fit=crop',
    has_biometrics: false,
    password_hash: ADMIN_PASSWORD_HASH,
    created_at: new Date(Date.now() - 2 * 86400000).toISOString(),
    updated_at: new Date().toISOString()
  }
];

const moesTrainees = [
  {
    id: 'trn-001',
    user_id: alexId,
    skills_interests: ['Operational Oceanography', 'Argo Float Telemetry', 'Tsunami Warning Systems', 'Numerical Ocean Modeling', 'Python/GIS'],
    education_level: 'M.Sc. in Oceanography & Marine Geosciences',
    target_certifications: ['INCOIS Ocean State Forecaster', 'Deep Ocean Mission Submersible Systems Specialist'],
    enrolled_count: 2,
    completed_count: 1
  },
  {
    id: 'trn-002',
    user_id: priyaTraineeId,
    skills_interests: ['Doppler Radar', 'NCUM Models', 'Monsoon Dynamics', 'Satellite Meteorology', 'WRF Modeling'],
    education_level: 'M.Tech in Atmospheric & Oceanic Sciences',
    target_certifications: ['IMD Certified Weather Forecaster', 'Severe Storm Nowcaster'],
    enrolled_count: 2,
    completed_count: 0
  },
  {
    id: 'trn-003',
    user_id: vikramTraineeId,
    skills_interests: ['Global Atmospheric Models', 'Data Assimilation', 'HPC Cluster Scaling', 'Ocean-Atmosphere Coupling'],
    education_level: 'Ph.D. Candidate in Computational Earth Sciences',
    target_certifications: ['NCMRWF High-Performance NWP Specialist'],
    enrolled_count: 1,
    completed_count: 0
  }
];

const moesTrainers = [
  {
    id: 't-001',
    user_id: sharmaId,
    expertise_areas: ['Operational Oceanography', 'Deep Ocean Mission Engineering', 'Numerical Weather Prediction', 'Cryosphere Dynamics'],
    years_experience: 16,
    bio: 'Scientist-G & Program Director with over 16 years of earth sciences research experience leading ocean observation networks, deep-sea exploration campaigns, and advanced atmospheric modeling for MoES institutions.',
    qualifications: 'Ph.D. in Physical Oceanography, Senior Fellow (Indian Academy of Sciences), Principal Investigator - Deep Ocean Mission',
    active_batches: 4
  }
];

const moesCertificates = [
  {
    id: 'cert-alex-moes-001',
    user_id: alexId,
    user_name: 'Alex Rivera',
    course_id: 'crs-seismo-005',
    course_title: 'Seismology & Tsunami Early Warning Systems',
    issue_date: '2026-03-01',
    verification_code: 'MOES-SEIS-2026-AR01',
    grade: 'Distinction (96%)',
    issuer: 'Ministry of Earth Sciences (MoES), Govt. of India'
  }
];

const moesEnrollments = [
  {
    id: 'enr-alex-01',
    user_id: alexId,
    course_id: 'crs-ocean-001',
    enrolled_at: new Date(Date.now() - 10 * 86400000).toISOString(),
    progress_percentage: 75,
    status: 'in_progress',
    completed_modules: ['mod-c1-1', 'mod-c1-2', 'mod-c1-3']
  },
  {
    id: 'enr-alex-02',
    user_id: alexId,
    course_id: 'crs-seismo-005',
    enrolled_at: new Date(Date.now() - 25 * 86400000).toISOString(),
    progress_percentage: 100,
    status: 'completed',
    completed_modules: ['mod-c5-1', 'mod-c5-2', 'mod-c5-3'],
    completion_date: '2026-03-01',
    certificate_id: 'cert-alex-moes-001'
  }
];

const moesAssessmentResults = [
  {
    id: 'res-alex-001',
    assessment_id: 'asm-ocean-01',
    course_id: 'crs-ocean-001',
    course_title: 'Operational Oceanography & Coastal Dynamics',
    user_id: alexId,
    score: 100,
    total_questions: 3,
    passed: true,
    completed_at: new Date(Date.now() - 2 * 86400000).toISOString()
  },
  {
    id: 'res-alex-002',
    assessment_id: 'asm-seismo-05',
    course_id: 'crs-seismo-005',
    course_title: 'Seismology & Tsunami Early Warning Systems',
    user_id: alexId,
    score: 96,
    total_questions: 2,
    passed: true,
    completed_at: '2026-03-01'
  }
];

const moesBiometrics = [
  {
    id: 'bio-alex-001',
    user_id: alexId,
    template_vector: generateSyntheticFaceVector(42),
    enrolled_at: new Date(Date.now() - 20 * 86400000).toISOString(),
    last_used_at: new Date(Date.now() - 1 * 86400000).toISOString(),
    liveness_verified: true,
    is_active: true
  },
  {
    id: 'bio-sharma-001',
    user_id: sharmaId,
    template_vector: generateSyntheticFaceVector(77),
    enrolled_at: new Date(Date.now() - 35 * 86400000).toISOString(),
    last_used_at: new Date(Date.now() - 3 * 86400000).toISOString(),
    liveness_verified: true,
    is_active: true
  },
  {
    id: 'bio-sarah-001',
    user_id: sarahId,
    template_vector: generateSyntheticFaceVector(101),
    enrolled_at: new Date(Date.now() - 50 * 86400000).toISOString(),
    last_used_at: new Date(Date.now() - 2 * 86400000).toISOString(),
    liveness_verified: true,
    is_active: true
  },
  {
    id: 'bio-priya-001',
    user_id: priyaTraineeId,
    template_vector: generateSyntheticFaceVector(55),
    enrolled_at: new Date(Date.now() - 18 * 86400000).toISOString(),
    last_used_at: new Date(Date.now() - 1 * 86400000).toISOString(),
    liveness_verified: true,
    is_active: true
  },
  {
    id: 'bio-vikram-001',
    user_id: vikramTraineeId,
    template_vector: generateSyntheticFaceVector(88),
    enrolled_at: new Date(Date.now() - 12 * 86400000).toISOString(),
    last_used_at: new Date(Date.now() - 2 * 86400000).toISOString(),
    liveness_verified: true,
    is_active: true
  }
];

const moesAdminApprovals = [
  {
    id: 'appr-001',
    user_id: marcusId,
    requested_at: new Date(Date.now() - 2 * 86400000).toISOString(),
    status: 'pending',
    justification: 'Requested administrative oversight for NCPOR Polar & Cryospheric Operations capacity tracking and scientific expediting oversight.',
    user_email: 'marcus.pending@capacityconnect.org',
    user_name: 'Marcus Vance',
    organization: 'National Centre for Polar and Ocean Research (NCPOR), MoES'
  }
];

const moesNotifications = [
  {
    id: 'notif-1',
    user_id: alexId,
    title: 'New Ocean State Advisory Published',
    message: 'INCOIS has updated the Bay of Bengal wave forecast and coastal swell alerting model.',
    type: 'info',
    is_read: false,
    created_at: new Date(Date.now() - 1 * 3600000).toISOString()
  },
  {
    id: 'notif-2',
    user_id: alexId,
    title: 'Assignment 1 Graded with AI Report',
    message: 'Your validation report on INCOIS wave telemetry received a score of 95/100.',
    type: 'success',
    is_read: false,
    created_at: new Date(Date.now() - 12 * 3600000).toISOString()
  },
  {
    id: 'notif-3',
    user_id: alexId,
    title: 'Official Certification Issued',
    message: 'Your certificate for Seismology & Tsunami Early Warning Systems is available to print.',
    type: 'certificate',
    is_read: true,
    created_at: new Date(Date.now() - 5 * 86400000).toISOString()
  }
];

const moesAuditLogs = [
  {
    id: 'log-001',
    timestamp: new Date().toISOString(),
    actor_id: alexId,
    actor_email: 'alex.trainee@capacityconnect.org',
    actor_role: 'trainee',
    action: 'SESSION_AUTHENTICATED',
    details: 'User authenticated via 3-Factor Biometric Verification (Password + OTP + Face ID).',
    ip_address: '127.0.0.1',
    status: 'success'
  },
  {
    id: 'log-002',
    timestamp: new Date(Date.now() - 2 * 86400000).toISOString(),
    actor_id: alexId,
    actor_email: 'alex.trainee@capacityconnect.org',
    actor_role: 'trainee',
    action: 'ASSIGNMENT_SUBMITTED',
    details: 'Submitted assignment: incois_wave_validation_analysis.py',
    ip_address: '127.0.0.1',
    status: 'success'
  }
];

const database = {
  users: moesUsers,
  trainees: moesTrainees,
  trainers: moesTrainers,
  admin_approvals: moesAdminApprovals,
  biometrics: moesBiometrics,
  courses: moesCourses,
  enrollments: moesEnrollments,
  assessments: moesAssessments,
  assessment_results: moesAssessmentResults,
  certificates: moesCertificates,
  notifications: moesNotifications,
  audit_logs: moesAuditLogs,
  password_resets: [],
  otp_tokens: [],
  assignments: moesAssignments,
  assignment_submissions: moesSubmissions,
  experiments: moesExperiments
};

const dataDir = path.join(__dirname, '..', 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

fs.writeFileSync(path.join(dataDir, 'database.json'), JSON.stringify(database, null, 2), 'utf-8');
fs.writeFileSync(path.join(__dirname, '..', 'database.json'), JSON.stringify(database, null, 2), 'utf-8');
console.log('Successfully seeded MoES database into data/database.json and database.json');
