"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { useTheme } from "next-themes";
import { useRouter } from "next/navigation";
import { auth } from '@/config/firebase';
import { onAuthStateChanged } from 'firebase/auth';

// Financial law specializations
const FINANCIAL_SPECIALIZATIONS = [
  "Securities Law",
  "Banking Regulations",
  "Corporate Finance",
  "Tax Law",
  "Investment Management",
  "Bankruptcy Law",
  "Financial Restructuring",
  "Mergers & Acquisitions",
  "Financial Compliance",
  "Insurance Law",
];

export default function LawyerOnboarding()
{
  const { theme } = useTheme();
  const router = useRouter();

  // Form state
  const [bio, setBio] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [country, setCountry] = useState("");
  const [selectedSpecializations, setSelectedSpecializations] = useState<string[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Check auth state on mount
  useEffect(() =>
  {
    const unsubscribe = onAuthStateChanged(auth, (user) =>
    {
      if (user) {
        setUserId(user.uid);
      } else {
        // If no user is logged in, redirect to login
        router.push('/auth/lawyer');
      }
    });

    return () => unsubscribe();
  }, [router]);

  const handleSpecializationChange = (specialization: string, checked: boolean) =>
  {
    if (checked) {
      setSelectedSpecializations([...selectedSpecializations, specialization]);
    } else {
      setSelectedSpecializations(
        selectedSpecializations.filter(item => item !== specialization)
      );
    }
  };

  const handleSubmit = async (e: React.FormEvent) =>
  {
    e.preventDefault();
    setError("");
    setLoading(true);

    // Basic validation
    if (!bio || !city || !state || !country || selectedSpecializations.length === 0) {
      setError("All fields are required. Please select at least one specialization.");
      setLoading(false);
      return;
    }

    try {
      // Get the current user from Firebase
      const user = auth.currentUser;
      if (!user) {
        throw new Error("No user logged in");
      }

      // Make API call to update the lawyer profile
      const response = await fetch(`http://localhost:8000/api/lawyers/${user.uid}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          profileBio: bio,
          specialization: selectedSpecializations,
          city,
          state,
          country
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to update profile");
      }

      // Redirect to home or dashboard after successful submission
      router.push('/home');
    } catch (error: any) {
      setError(error.message || "An error occurred while updating your profile");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900 p-4">
      <Card className="w-full max-w-4xl p-6 shadow-md bg-white dark:bg-gray-800 dark:text-white">
        <CardHeader>
          <CardTitle className="text-center text-2xl font-bold">
            Complete Your Lawyer Profile
          </CardTitle>
          <p className="text-center text-gray-500 dark:text-gray-400">
            Please provide additional information to set up your legal professional profile.
          </p>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-200 p-3 rounded-md mb-4">
              {error}
            </div>
          )}

          <form className="space-y-6" onSubmit={handleSubmit}>
            {/* Professional Bio */}
            <div className="space-y-2">
              <Label htmlFor="bio">Professional Bio</Label>
              <Textarea
                id="bio"
                placeholder="Describe your professional background, expertise, and experience..."
                className="min-h-32 dark:bg-gray-700"
                value={bio}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setBio(e.target.value)}
                required
              />
            </div>

            {/* Location */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="city">City</Label>
                <Input
                  id="city"
                  placeholder="City"
                  className="dark:bg-gray-700"
                  value={city}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCity(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="state">State/Province</Label>
                <Input
                  id="state"
                  placeholder="State/Province"
                  className="dark:bg-gray-700"
                  value={state}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setState(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="country">Country</Label>
                <Input
                  id="country"
                  placeholder="Country"
                  className="dark:bg-gray-700"
                  value={country}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCountry(e.target.value)}
                  required
                />
              </div>
            </div>

            {/* Specializations */}
            <div className="space-y-2">
              <Label>Specializations (Select all that apply)</Label>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 mt-2">
                {FINANCIAL_SPECIALIZATIONS.map((specialization) => (
                  <div key={specialization} className="flex items-center space-x-2">
                    <Checkbox
                      id={specialization}
                      checked={selectedSpecializations.includes(specialization)}
                      onCheckedChange={(checked) =>
                        handleSpecializationChange(specialization, checked === true)
                      }
                    />
                    <Label
                      htmlFor={specialization}
                      className="text-sm cursor-pointer"
                    >
                      {specialization}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={loading}
            >
              {loading ? "Updating Profile..." : "Complete Setup"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
} 