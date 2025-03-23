"use server";

import { prisma } from "@/backend/prisma";

export type LawyerWithUser = {
  lawyer_id: number;
  user_id: number;
  profile_bio: string | null;
  specialization: string[];
  credentials_verified: boolean | null;
  verification_document_url: string | null;
  rating: number | null;
  rating_count: number | null;
  user: {
    first_name: string | null;
    last_name: string | null;
    email: string;
    phone_number: string | null;
    business_name: string | null;
  };
};

export type LawyerFilterParams = {
  searchQuery?: string;
  specializations?: string[];
  minRating?: number;
  verifiedOnly?: boolean;
};

// Type for lawyer from Prisma with included user information
type LawyerFromDB = {
  lawyer_id: number;
  user_id: number;
  profile_bio: string | null;
  specialization: string[];
  credentials_verified: boolean | null;
  verification_document_url: string | null;
  rating: number | null;
  rating_count: number | null;
  user: {
    first_name: string | null;
    last_name: string | null;
    email: string;
    phone_number: string | null;
    business_name: string | null;
  };
};

export async function getLawyers(params?: LawyerFilterParams): Promise<LawyerWithUser[]> {
  try {
    const { searchQuery, specializations, minRating, verifiedOnly } = params || {};
    
    const whereClause: any = {};
    
    // Add verified filter if requested
    if (verifiedOnly) {
      whereClause.credentials_verified = true;
    }
    
    // Add rating filter if provided
    if (minRating && minRating > 0) {
      whereClause.rating = {
        gte: minRating,
      };
    }
    
    // Add specialization filter if provided
    if (specializations && specializations.length > 0) {
      whereClause.specialization = {
        hasSome: specializations,
      };
    }
    
    // Base query to get all lawyers with their user information
    const lawyers = await prisma.lawyer.findMany({
      where: whereClause,
      include: {
        user: {
          select: {
            first_name: true,
            last_name: true,
            email: true,
            phone_number: true,
            business_name: true,
          },
        },
      },
    });
    
    // Map the result to match our component's expected format
    const formattedLawyers = lawyers.map((lawyer: LawyerFromDB) => ({
      lawyer_id: lawyer.lawyer_id,
      user_id: lawyer.user_id,
      profile_bio: lawyer.profile_bio,
      specialization: lawyer.specialization,
      credentials_verified: lawyer.credentials_verified,
      verification_document_url: lawyer.verification_document_url,
      rating: lawyer.rating ? parseFloat(lawyer.rating.toString()) : null,
      rating_count: lawyer.rating_count,
      user: {
        first_name: lawyer.user.first_name,
        last_name: lawyer.user.last_name,
        email: lawyer.user.email,
        phone_number: lawyer.user.phone_number,
        business_name: lawyer.user.business_name,
      },
    }));
    
    // Apply name search filter on the client-side
    // (This could be moved to the database query for better performance in a production app)
    let filteredLawyers = formattedLawyers;
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filteredLawyers = formattedLawyers.filter((lawyer: LawyerWithUser) => {
        const fullName = `${lawyer.user.first_name || ''} ${lawyer.user.last_name || ''}`.toLowerCase();
        const businessName = (lawyer.user.business_name || '').toLowerCase();
        return fullName.includes(query) || businessName.includes(query);
      });
    }
    
    return filteredLawyers;
  } catch (error) {
    console.error("Error fetching lawyers:", error);
    return [];
  }
} 