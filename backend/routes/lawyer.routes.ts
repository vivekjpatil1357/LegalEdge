import express, { Request, Response } from 'express';
import { prisma } from '../prisma';
import bcrypt from 'bcrypt';
import { Role } from '@prisma/client';

const router = express.Router();

interface CreateLawyerRequestBody
{
    email: string;
    first_name?: string;
    last_name?: string;
    password?: string;
    firebaseId:string;
}
interface LawyerQueryParams
{
    search?: string | string[];
    specializations?: string | string[];
    minRating?: string | string[];
    verifiedOnly?: string | string[];
    location?: string | string[];
}

interface LawyerWithUser
{
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
        city: string | null;
        state: string | null;
        country: string | null;
        firebaseId:string;
    };
}

// get lawyers with filters
router.get('/', async (req: Request<{}, {}, {}, LawyerQueryParams>, res: Response) =>
{
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
            filteredUsers = users.filter((user) =>
            {
                const fullName = `${user.first_name || ''} ${user.last_name || ''}`.toLowerCase();
                const businessName = (user.business_name || '').toLowerCase();
                return fullName.includes(searchString) || businessName.includes(searchString);
            });
        }

        // Format the response to match our expected structure
        const formattedLawyers = filteredUsers.map((user): LawyerWithUser =>
        {
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
                        firebaseId: user.firebaseId,
                        city: user.city,
                        state: user.state,
                        country: user.country,
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
                    firebaseId:user.firebaseId,
                    city: user.city,
                    state: user.state,
                    country: user.country,
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
router.get('/:id', async (req: Request<{ id: string }>, res: Response) =>
{
    try {
        const { id } = req.params;
        const user = await prisma.user.findUnique({
            where: {
                firebaseId: id,
            }
        });
        if (!user) {
            return res.status(404).json({
                success: false,
                error: 'User not found',
            });
        }
        const lawyer = await prisma.lawyer.findUnique({
            where: {
                lawyer_id: user.user_id,
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
                business_name: lawyer.user.business_name,
                firebaseId: lawyer.user.firebaseId,
                city: lawyer.user.city,
                state: lawyer.user.state,
                country: lawyer.user.country,
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

// register lawyer
router.post('/auth/register', async (req: Request, res: Response) =>
{
    try {
        const {
            email,
            first_name,
            last_name,
            password,
            firebaseId
            // Default to empty array if not provided
        } = req.body as CreateLawyerRequestBody;
        // Transaction to create both user and lawyer profile atomically
        const user = await prisma.user.create({
            data: {
                email,
                role: 'LAWYER',
                first_name: first_name || null,
                last_name: last_name || null,
                password_hash: password ? await bcrypt.hash(password, 10) : 'FIREBASE_AUTH',
                phone_number: '',
                business_name: '',
                city: '',
                state: '',
                country: '',
                firebaseId,
            }
        });
        // Create lawyer profile with the same ID
        const lawyer = await prisma.lawyer.create({
            data: {
                lawyer_id: user.user_id, // In this schema, lawyer_id is the same as user_id
                profile_bio: '',
                specialization: [],
                credentials_verified: false,
            }
        });
        

        res.status(201).json({
            success: true,
            message: 'Lawyer account created successfully',
            data: {
                user_id: user.user_id,
                email: user.email,
                lawyer_id: lawyer.lawyer_id
            }
        });
    } catch (error) {
        console.error('Error creating lawyer account:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create lawyer account',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});

// update lawyer profile
router.put('/:id', async (req: Request, res: Response) => {
    try {
        const user = await prisma.user.findUnique({
            where: { firebaseId: req.params.id }
        });

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        const {
            first_name,
            last_name,
            phone_number,
            business_name,
            business_industry,
            city,
            state,
            country,
            profileBio,
            specialization
        } = req.body;

        // Update data in a transaction
        const result = await prisma.$transaction(async (tx) => {
            // Update user information
            const updatedUser = await tx.user.update({
                where: { user_id: user.user_id },
                data: {
                    first_name: first_name !== undefined ? first_name : user.first_name,
                    last_name: last_name !== undefined ? last_name : user.last_name,
                    phone_number: phone_number !== undefined ? phone_number : user.phone_number,
                    business_name: business_name !== undefined ? business_name : user.business_name,
                    business_industry: business_industry !== undefined ? business_industry : user.business_industry,
                    city: city !== undefined ? city : user.city,
                    state: state !== undefined ? state : user.state,
                    country: country !== undefined ? country : user.country,
                }
            });

            // Update lawyer profile
            const updatedLawyer = await tx.lawyer.update({
                where: { lawyer_id: user.user_id },
                data: {
                    profile_bio: profileBio !== undefined ? profileBio : undefined,
                    specialization: specialization !== undefined ? specialization : undefined,
                }
            });

            return { user: updatedUser, lawyer: updatedLawyer };
        });

        res.json({
            success: true,
            message: 'Profile updated successfully',
            data: result
        });
    } catch (error) {
        console.error('Error updating profile:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update profile',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});

export default router;
