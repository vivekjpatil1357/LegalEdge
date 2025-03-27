import express, { Request, Response } from 'express';
import { prisma } from '../prisma';
import bcrypt from 'bcrypt';

const router = express.Router();

// Define preference options (expand as needed)
const preferenceOptions = [
  'Receive email notifications',
  'Receive SMS notifications',
  'Receive in-app notifications',
  'Interested in Contract Law',
  'Interested in Business Law',
  'Interested in Real Estate Law',
  'Interested in Intellectual Property Law',
  'Interested in Family Law',
  'Interested in Criminal Law',
];

interface RegistrationRequest extends Request
{
  body: {
    firebaseId: string;
    email: string;
    role: 'INDIVIDUAL' | 'BUSINESS';
    first_name?: string; // For individuals
    last_name?: string; // For individuals
    business_name?: string; // For businesses
    password?: string; // Only for email/password signup
    city?: string;
    state?: string;
    country?: string;
    preferences?: string[]; // Array of selected preferences

  };
}
//get all users
router.get('/', async (req: Request, res: Response) =>
{
  const users = await prisma.user.findMany();
  res.json(users);
});

router.post('/', async (req: RegistrationRequest, res: Response) =>
{
  try {
    const {
      firebaseId,
      email,
      role,
      first_name,
      last_name,
      business_name,
      password,
      city,
      state,
      country,
      preferences
    } = req.body;
    console.log("Request Body in /api/users:", req.body)
    // --- Input Validation (Crucial!) ---
    if (!firebaseId || !email || !role) {
      return res.status(400).json({ message: 'Missing required fields (firebaseId, email, role)' });
    }

    if (role !== 'INDIVIDUAL' && role !== 'BUSINESS') {
      return res.status(400).json({ message: 'Invalid role.  Must be "individual" or "business".' });
    }

    if (role === 'INDIVIDUAL' && (!first_name || !last_name)) {
      return res.status(400).json({ message: 'First name and last name are required for individuals.' });
    }

    if (role === 'BUSINESS' && !business_name) {
      return res.status(400).json({ message: 'Business name is required for businesses.' });
    }

    // Check for duplicate email or firebaseId (important!)
    const existingUserByEmail = await prisma.user.findUnique({ where: { email } });
    if (existingUserByEmail) {
      return res.status(409).json({ message: 'Email already exists.' });
    }

    const existingUserByFirebaseId = await prisma.user.findUnique({ where: { firebaseId } });
    if (existingUserByFirebaseId) {
      return res.status(409).json({ message: 'User with this Firebase ID already exists.' });
    }

    // Validate preferences (ensure they are valid options)
    let validatedPreferences: { [key: string]: boolean } = {};

    if (preferences) {
      if (!Array.isArray(preferences)) {
        return res.status(400).json({ message: "Preferences must be an array." });
      }

      for (const pref of preferences) {
        if (!preferenceOptions.includes(pref)) {
          return res.status(400).json({ message: `Invalid preference: ${pref}` });
        }
        validatedPreferences[pref] = true; // Convert to Prisma-compatible format
      }
    }

    // Hash the password (if provided - for email/password signups)
    let passwordHash = 'FIREBASE_AUTH'; // Default value if using Google Sign-In
    if (password) {
      const salt = await bcrypt.genSalt(10);
      passwordHash = await bcrypt.hash(password, salt);
    }

    // Create the user in the database
    const newUser = await prisma.user.create({
      data: {
        firebaseId,
        email,
        role,
        first_name: role === 'INDIVIDUAL' ? first_name : null, // Conditional
        last_name: role === 'INDIVIDUAL' ? last_name : null,
        business_name: role === 'BUSINESS' ? business_name : null,
        password_hash: passwordHash,
        city: city || 'Unknown city',
        state: state || 'Unknown state',
        country: country || 'Unknown country',
        preferences: validatedPreferences, // Store as JSON
      },
    });

    res.status(201).json({ message: 'User created successfully', user: newUser });
  } catch (error: any) {
    console.error('Error creating user:', error);
    res.status(500).json({ message: 'Failed to create user', error: error.message });
  }
});
//user by user_id 
router.get('/ById/:id', async (req: Request, res: Response) =>
{
  console.log('giving lawyer too');

  const user = await prisma.user.findUnique({ where: { user_id:parseInt( req.params.id )}, include: { Lawyer: true } });
  res.json(user);
});
//user by firebase id
router.get('/:firebaseId', async (req: Request, res: Response) =>
{
  try {
    const { firebaseId } = req.params;

    if (!firebaseId) {
      return res.status(400).json({ message: 'Firebase ID is required' });
    }

    const user = await prisma.user.findUnique({
      where: {
        firebaseId: firebaseId,
      },
    });

    if (user) {
      return res.json(user); // User exists
    } else {
      return res.status(404).json(null); // User not found (return 404)
    }

  } catch (error: any) {
    console.error('Error fetching user by Firebase ID:', error);
    res.status(500).json({ message: 'Failed to fetch user', error: error.message });
  }
});
export default router;