import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { prisma } from './prisma';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

interface LawyerQueryParams {
  search?: string | string[];
  specializations?: string | string[];
  minRating?: string | string[];
  verifiedOnly?: string | string[];
}

interface LawyerWithUser {
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
}

// API Routes
app.get('/api/lawyers', async (req: Request<{}, {}, {}, LawyerQueryParams>, res: Response) => {
  try {
    const {
      search,
      specializations,
      minRating,
      verifiedOnly,
    } = req.query;
    const filters: any = {};
    // Add verified filter if requested
    if (verifiedOnly === 'true') {
      filters.credentials_verified = true;
    }    
    // Add rating filter if provided
    if (minRating && !isNaN(Number(minRating))) {
      filters.rating = {
        gte: Number(minRating),
      };
    }    
    // Add specialization filter if provided
    if (specializations) {
      const specializationArray = Array.isArray(specializations) 
        ? specializations 
        : [specializations as string];      
      filters.specialization = {
        hasSome: specializationArray,
      };
    }

    // Get lawyers with filters
    const lawyers = await prisma.lawyer.findMany({
      where: filters,
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

    // Apply name search filter if provided
    let filteredLawyers = lawyers;
    if (search) {
      const searchString = search.toString().toLowerCase();
      filteredLawyers = lawyers.filter((lawyer: any) => {
        const fullName = `${lawyer.user.first_name || ''} ${lawyer.user.last_name || ''}`.toLowerCase();
        const businessName = (lawyer.user.business_name || '').toLowerCase();
        return fullName.includes(searchString) || businessName.includes(searchString);
      });
    }

    // Format response
    const formattedLawyers = filteredLawyers.map((lawyer: any): LawyerWithUser => ({
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

    res.json({
      success: true,
      data: formattedLawyers,
      count: formattedLawyers.length,
    });
  } catch (error) {
    console.error('Error fetching lawyers:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch lawyers',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// Get lawyer by ID
app.get('/api/lawyers/:id', async (req: Request<{id: string}>, res: Response) => {
  try {
    const { id } = req.params;
    
    const lawyer = await prisma.lawyer.findUnique({
      where: {
        lawyer_id: Number(id),
      },
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

    if (!lawyer) {
      return res.status(404).json({
        success: false,
        error: 'Lawyer not found',
      });
    }

    const formattedLawyer: LawyerWithUser = {
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
    };

    res.json({
      success: true,
      data: formattedLawyer,
    });
  } catch (error) {
    console.error('Error fetching lawyer by ID:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch lawyer',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
