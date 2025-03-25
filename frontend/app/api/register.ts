// frontend/utils/userApi.ts (or a similar location)
'use client';

export interface User {
  user_id: number;
  role: string;
  first_name: string | null;
  last_name: string | null;
  email: string;
  firebaseId: string;
  password_hash: string;
  city: string | null;
  state: string | null;
  country: string | null;
  phone_number: string | null;
  business_name: string | null;
  business_industry: string | null;
  created_at: string; // Or Date, if you parse it
  updated_at: string; // Or Date
  preferences: { [key: string]: boolean } | null;
}


const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

export async function createUser(userData: any): Promise<User> {
  try {
    const url = `${API_URL}/users`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userData),
    });

    if (!response.ok) {
      const errorData = await response.json(); // Get error message from backend
      throw new Error(errorData.message || `Failed to create user: ${response.statusText}`);
    }

    const data = await response.json();
    return data.user; // Assuming your backend returns the created user as { user: ... }

  } catch (error: any) {
    console.error('Error creating user:', error);
    throw error; // Re-throw the error so the calling function can handle it.
  }
}
export async function getUserByFirebaseId(firebaseId: string): Promise<User | null> {
  try {
    const url = `${API_URL}/users/${firebaseId}`;
    const response = await fetch(url);

    if (!response.ok) {
      if (response.status === 404) {
        return null;
      }
      throw new Error(`Failed to fetch user: ${response.statusText}`);
    }

    const data = await response.json();
    return data; // Return user

  } catch (error: any) {
    console.error('Error getting user by Firebase ID:', error);
    throw error; // Important: Re-throw for proper error handling
  }
}