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
  location?: string | string[];
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
    location?: string | null;
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
      location
    } = req.query;

    // First, we get the users with lawyer type
    const whereClause: any = {
      role: 'LAWYER',
    };

    // Add location filter if provided
    if (location) {
      whereClause.location = Array.isArray(location) 
        ? { in: location }
        : location;
    }
    const lawyerFilters: any = {};

    // Add verified filter if requested
    if (verifiedOnly === 'true') {
      lawyerFilters.credentials_verified = true;
    }
    
    // Add rating filter if provided
    if (minRating && !isNaN(Number(minRating))) {
      lawyerFilters.rating = {
        gte: Number(minRating),
      };
    }
    
    // Add specialization filter if provided
    if (specializations) {
      const specializationArray = Array.isArray(specializations) 
        ? specializations 
        : [specializations as string];
      
      lawyerFilters.specialization = {
        hasSome: specializationArray,
      };
    }

    // Include filters for the lawyer relation
    if (Object.keys(lawyerFilters).length > 0) {
      whereClause.lawyer = {
        ...lawyerFilters
      };
    }

    // Get users with the lawyer relation
    const users = await prisma.user.findMany({
      where: whereClause,
      include: {
        Lawyer: true,
      }
    });

    // Filter by search term if provided
    let filteredUsers = users;
    if (search) {
      const searchString = search.toString().toLowerCase();
      filteredUsers = users.filter((user) => {
        const fullName = `${user.first_name || ''} ${user.last_name || ''}`.toLowerCase();
        const businessName = (user.business_name || '').toLowerCase();
        return fullName.includes(searchString) || businessName.includes(searchString);
      });
    }

    // Format the response to match our expected structure
    const formattedLawyers = filteredUsers.map((user): LawyerWithUser => {
      const lawyer = user.Lawyer;
      if (!lawyer) {
        // If for some reason a user has user_type='lawyer' but no lawyer record,
        // create a placeholder with nulls. In a real app, you might want to filter these out.
        return {
          lawyer_id: 0,
          user_id: user.user_id,
          profile_bio: null,
          specialization: [],
          credentials_verified: null,
          verification_document_url: null,
          rating: null,
          rating_count: null,
          user: {
            first_name: user.first_name,
            last_name: user.last_name,
            email: user.email,
            phone_number: user.phone_number,
            business_name: user.business_name,
            
          }
        };
      }

      return {
        lawyer_id: lawyer.lawyer_id,
        user_id: lawyer.lawyer_id,
        profile_bio: lawyer.profile_bio,
        specialization: lawyer.specialization,
        credentials_verified: lawyer.credentials_verified,
        verification_document_url: lawyer.verification_document_url,
        rating: lawyer.rating ? parseFloat(lawyer.rating.toString()) : null,
        rating_count: lawyer.rating_count,
        user: {
          first_name: user.first_name,
          last_name: user.last_name,
          email: user.email,
          phone_number: user.phone_number,
          business_name: user.business_name,
        }
      };
    });

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
        user: true,
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
      user_id: lawyer.lawyer_id,
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
        business_name: lawyer.user.business_name
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
