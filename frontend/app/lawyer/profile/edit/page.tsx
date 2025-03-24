"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useRouter } from "next/navigation";
import { auth } from '@/config/firebase';
import { onAuthStateChanged } from 'firebase/auth';

export default function EditLawyerProfile() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [profile, setProfile] = useState({
    first_name: "",
    last_name: "",
    phone_number: "",
    business_name: "",
    business_industry: "",
    city: "",
    state: "",
    country: "",
    profile_bio: "",
    specialization: [] as string[],
  });

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const response = await fetch(`http://localhost:8000/api/lawyers/${user.uid}`);
          if (response.ok) {
            const data = await response.json();
            console.log(data);
            setProfile({
              first_name: data.data.user.first_name || "",
              last_name: data.data.user.last_name || "",
              phone_number: data.data.user.phone_number || "",
              business_name: data.data.user.business_name || "",
              business_industry: data.data.user.business_industry || "",
              city: data.data.user.city || "",
              state: data.data.user.state || "",
              country: data.data.user.country || "",
              profile_bio: data.data.profile_bio || "",
              specialization: data.data.specialization || [],
            });
          }
        } catch (err) {
          setError("Failed to load profile data");
        }
      } else {
        router.push('/auth/lawyer');
      }
    });

    return () => unsubscribe();
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const user = auth.currentUser;
      if (!user) throw new Error("No user logged in");

      const response = await fetch(`http://localhost:8000/api/lawyers/${user.uid}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profile)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to update profile");
      }

      router.push('/home');
    } catch (error: any) {
      setError(error.message || "Failed to update profile");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900 p-4">
      <Card className="w-full max-w-4xl p-6 shadow-md bg-white dark:bg-gray-800 dark:text-white">
        <CardHeader>
          <CardTitle className="text-center text-2xl font-bold">
            Edit Lawyer Profile
          </CardTitle>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-200 p-3 rounded-md mb-4">
              {error}
            </div>
          )}

          <form className="space-y-6" onSubmit={handleSubmit}>
            {/* Personal Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="first_name">First Name</Label>
                <Input
                  id="first_name"
                  value={profile.first_name}
                  onChange={(e) => setProfile({ ...profile, first_name: e.target.value })}
                  className="dark:bg-gray-700"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="last_name">Last Name</Label>
                <Input
                  id="last_name"
                  value={profile.last_name}
                  onChange={(e) => setProfile({ ...profile, last_name: e.target.value })}
                  className="dark:bg-gray-700"
                />
              </div>
            </div>

            {/* Contact Information */}
            <div className="space-y-2">
              <Label htmlFor="phone_number">Phone Number</Label>
              <Input
                id="phone_number"
                value={profile.phone_number}
                onChange={(e) => setProfile({ ...profile, phone_number: e.target.value })}
                className="dark:bg-gray-700"
              />
            </div>

            {/* Business Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="business_name">Business Name</Label>
                <Input
                  id="business_name"
                  value={profile.business_name}
                  onChange={(e) => setProfile({ ...profile, business_name: e.target.value })}
                  className="dark:bg-gray-700"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="business_industry">Business Industry</Label>
                <Input
                  id="business_industry"
                  value={profile.business_industry}
                  onChange={(e) => setProfile({ ...profile, business_industry: e.target.value })}
                  className="dark:bg-gray-700"
                />
              </div>
            </div>

            {/* Location */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="city">City</Label>
                <Input
                  id="city"
                  value={profile.city}
                  onChange={(e) => setProfile({ ...profile, city: e.target.value })}
                  className="dark:bg-gray-700"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="state">State/Province</Label>
                <Input
                  id="state"
                  value={profile.state}
                  onChange={(e) => setProfile({ ...profile, state: e.target.value })}
                  className="dark:bg-gray-700"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="country">Country</Label>
                <Input
                  id="country"
                  value={profile.country}
                  onChange={(e) => setProfile({ ...profile, country: e.target.value })}
                  className="dark:bg-gray-700"
                />
              </div>
            </div>

            {/* Professional Bio */}
            <div className="space-y-2">
              <Label htmlFor="profile_bio">Professional Bio</Label>
              <Textarea
                id="profile_bio"
                value={profile.profile_bio}
                onChange={(e) => setProfile({ ...profile, profile_bio: e.target.value })}
                className="min-h-32 dark:bg-gray-700"
              />
            </div>

            <div className="flex gap-4">
              <Button
                type="submit"
                className="flex-1"
                disabled={loading}
              >
                {loading ? "Saving..." : "Save Changes"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push('/home')}
                disabled={loading}
              >
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
} 