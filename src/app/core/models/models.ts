export interface AuthResponse {
  token: string;
  farmName: string;
  farmId: number;
}

export interface Cow {
  id: number;
  farmId: number;
  name: string;
  tagId?: string;
  breed?: string;
  parentId?: number | null;
  status: string;
  hasLoan: boolean;
  hasInsurance: boolean;
  createdDate?: string;
  imageUrl?: string;
  gender?: string;
  dateOfBirth?: string;
  weight?: number | null;
  height?: number | null;
}

export interface MilkProduction {
  id: number;
  cowId: number;
  quantity: number;
  qualityDegree?: number | null;
  pricePerLiter?: number | null;
  shift: string;
  logDate: string;
}

export interface HealthRecord {
  id: number;
  cowId: number;
  checkupDate: string;
  pregnancyMonth?: number | null;
  diseaseName?: string;
  medicationGiven: boolean;
  medicalCost: number;
  notes?: string;
}

export interface Inventory {
  id: number;
  farmId: number;
  itemName: string;
  quantityRemaining: number;
  unitCost: number;
  lastUpdated: string;
}

export interface FeedLog {
  id: number;
  farmId: number;
  inventoryId: number;
  quantityUsed: number;
  totalCost: number;
  feedTime: string;
  logDate: string;
}

export interface Farm {
  id: number;
  farmName: string;
  createdDate: string;
}