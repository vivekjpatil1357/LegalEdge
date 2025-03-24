'use client';

export interface LawyerWithUser {
  lawyer_id: number;
  user_id: number;
  profile_bio: string | null;
  specialization: string[];
  credentials_verified: boolean | null;
  verification_document_url: string | null;
  rating: number | null;
  rating_count: number | null;
  user: {
    location: string | null;
    first_name: string | null;
    last_name: string | null;
    email: string;
    phone_number: string | null;
    business_name: string | null;
  };
}

export interface LawyerFilterParams {
  search?: string;
  specializations?: string[];
  minRating?: number;
  verifiedOnly?: boolean;
  location?: string;
}

export interface LawyersResponse {
  success: boolean;
  data: LawyerWithUser[];
  count: number;
}

export interface LawyerResponse {
  success: boolean;
  data: LawyerWithUser;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

export async function getLawyers(params?: LawyerFilterParams): Promise<LawyerWithUser[]> {
  try {
    const queryParams = new URLSearchParams();
    
    if (params?.search) {
      queryParams.append('search', params.search);
    }

    if (params?.minRating) {
      queryParams.append('minRating', params.minRating.toString());
    }

    if (params?.verifiedOnly) {
      queryParams.append('verifiedOnly', params.verifiedOnly.toString());
    }
    if (params?.location) {
      queryParams.append('location', params.location);
    }
    if (params?.specializations && params.specializations.length > 0) {
      params.specializations.forEach(spec => {
        queryParams.append('specializations', spec);
      });
    }

    const queryString = queryParams.toString();
    const url = `${API_URL}/lawyers${queryString ? `?${queryString}` : ''}`;
    
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch lawyers: ${response.statusText}`);
    }
    
    const data: LawyersResponse = await response.json();
    
    if (!data.success) {
      throw new Error('Failed to fetch lawyers from API');
    }
    
    return data.data;
  } catch (error) {
    console.error('Error fetching lawyers:', error);
    return [];
  }
}

export async function getLawyerById(id: number | string): Promise<LawyerWithUser | null> {
  try {
    const url = `${API_URL}/lawyers/${id}`;
    
    const response = await fetch(url);
    
    if (!response.ok) {
      if (response.status === 404) {
        return null;
      }
      throw new Error(`Failed to fetch lawyer: ${response.statusText}`);
    }
    
    const data: LawyerResponse = await response.json();
    
    if (!data.success) {
      throw new Error('Failed to fetch lawyer from API');
    }
    
    return data.data;
  } catch (error) {
    console.error(`Error fetching lawyer with ID ${id}:`, error);
    return null;
  }
} 