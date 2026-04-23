// src/types/index.ts

export interface CreditRequest {
  lat:      number;
  lon:      number;
  crop:     string;
  area_ha:  number;
  crop_age: number;
}

export interface ScoreFactor {
  factor: string;
  status: string;
  impact: 'positive' | 'neutral' | 'negative';
  detail: string;
}

export interface CreditResponse {
  score:           number;
  decision:        'Approve' | 'Conditional' | 'Manual Review' | 'Reject';
  risk_tier:       string;
  loan_limit:      number;
  revenue:         number;
  estimated_yield: string;
  ndvi:            number;
  rainfall_mm:     number;
  temp_c:          number;
  crop_health:     'Good' | 'Moderate' | 'Poor';
  weather_status:  'Normal' | 'Drought Risk' | 'Flood Risk';
  soil_status:     string;
  factors:         ScoreFactor[];
  evaluation_id:   number | string;
}

export interface HistoryItem {
  id:         number;
  crop:       string;
  score:      number;
  decision:   string;
  lat:        number;
  lon:        number;
  created_at: string;
}

export interface RegisterRequest {
  name:     string;
  phone:    string;
  password: string;
}

export interface LoginRequest {
  phone:    string;   // sent as 'username' to FastAPI — see client.ts
  password: string;
}

export interface AuthResponse {
  access_token: string;
  token_type:   string;
  farmer_name:  string;
}

// ── Navigation types ──────────────────────────────────────────────────────────
export type RootStackParamList = {
  Splash:    undefined;
  Login:     undefined;
  Register:  undefined;
  MainTabs:  undefined;
  Result:    { data: CreditResponse };
};

export type MainTabParamList = {
  Home:    undefined;
  History: undefined;
  Profile: undefined;
};
