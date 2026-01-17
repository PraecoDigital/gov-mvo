
import { InspectionChecklistItem } from './types';

export const INITIAL_CHECKLIST: InspectionChecklistItem[] = [
  // IDENTIFICATION & SECURITY
  { id: 'id_chassis', label: 'Chassis/VIN Number Matches Documents', category: 'Identification', value: false, isCritical: true },
  { id: 'id_engine', label: 'Engine Number Matches Documents', category: 'Identification', value: false, isCritical: true },
  { id: 'id_plates', label: 'License Plates (Clean, Legible, Secure)', category: 'Identification', value: false, isCritical: true },
  
  // EXTERIOR & LIGHTING
  { id: 'light_head', label: 'Headlamps (High/Low Beam)', category: 'Lighting', value: false, isCritical: true },
  { id: 'light_ind', label: 'Indicators & Hazard Lights', category: 'Lighting', value: false, isCritical: true },
  { id: 'light_brake', label: 'Brake Lights & High-Mount Lamp', category: 'Lighting', value: false, isCritical: true },
  { id: 'light_rev', label: 'Reverse Lights', category: 'Lighting', value: false, isCritical: false },
  
  // BRAKING & MECHANICAL
  { id: 'mech_foot', label: 'Foot Brake (Service Brake Efficiency)', category: 'Mechanical', value: false, isCritical: true },
  { id: 'mech_hand', label: 'Handbrake (Parking Brake)', category: 'Mechanical', value: false, isCritical: true },
  { id: 'mech_steer', label: 'Steering Mechanism & Play', category: 'Mechanical', value: false, isCritical: true },
  { id: 'mech_susp', label: 'Suspension (Shocks/Springs/Bushings)', category: 'Mechanical', value: false, isCritical: true },
  
  // TIRES & WHEELS
  { id: 'tire_tread', label: 'Tire Tread Depth (Min 1.6mm)', category: 'Tires', value: false, isCritical: true },
  { id: 'tire_cond', label: 'Tire Condition (No Bulges/Cracks)', category: 'Tires', value: false, isCritical: true },
  { id: 'tire_nuts', label: 'Wheel Nuts Secure', category: 'Tires', value: false, isCritical: true },

  // VISION & VISIBILITY
  { id: 'vis_wind', label: 'Windscreen (No Obstructions/Cracks)', category: 'Vision', value: false, isCritical: true },
  { id: 'vis_wipers', label: 'Wipers & Washers Functional', category: 'Vision', value: false, isCritical: true },
  { id: 'vis_mirrors', label: 'Rearview & Side Mirrors', category: 'Vision', value: false, isCritical: true },
  
  // INTERIOR & SAFETY
  { id: 'safe_belts', label: 'Seatbelts (Condition & Tension)', category: 'Safety', value: false, isCritical: true },
  { id: 'safe_horn', label: 'Horn Operational', category: 'Safety', value: false, isCritical: true },
  { id: 'safe_fire', label: 'Fire Extinguisher (Commercial/Taxi)', category: 'Safety', value: false, isCritical: false },
  
  // EMISSIONS
  { id: 'env_smoke', label: 'Exhaust Emissions (No Excessive Smoke)', category: 'Environment', value: false, isCritical: true },
  { id: 'env_noise', label: 'Muffler/Exhaust System Integrity', category: 'Environment', value: false, isCritical: true },
];
