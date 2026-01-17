
export enum InspectionStatus {
  PASS = 'PASS',
  FAIL = 'FAIL',
  PENDING = 'PENDING'
}

export enum VehicleClass {
  PRIVATE = 'Private (P)',
  COMMERCIAL = 'Commercial (T)',
  TAXI = 'Hired/Taxi (H)',
  RENTAL = 'Rental (R)',
  GOVERNMENT = 'Government (GP/L)',
}

export interface InspectionChecklistItem {
  id: string;
  label: string;
  category: string;
  value: boolean;
  notes?: string;
  image?: string; // Base64 encoded image
  isCritical: boolean; // If false, the vehicle fails immediately
}

export interface InspectionFormData {
  inspectorName: string;
  inspectionDate: string;
  vehiclePlate: string;
  vehicleMake: string;
  vehicleModel: string;
  vehicleYear: string;
  vehicleClass: VehicleClass;
  vinNumber: string;
  engineNumber: string;
  odometer: string;
  checklist: InspectionChecklistItem[];
  overallStatus: InspectionStatus;
  aiSafetyAnalysis?: string;
}

export interface AISafetyResponse {
  summary: string;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  recommendations: string[];
}
