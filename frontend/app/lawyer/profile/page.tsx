"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useRouter } from "next/navigation";
import { auth } from '@/config/firebase';
import { onAuthStateChanged } from 'firebase/auth';

interface LawyerProfile
{
    lawyer_id: number;
    profile_bio: string | null;
    specialization: string[];
    credentials_verified: boolean | null;
    rating: number | null;
    rating_count: number | null;
    user: {
        first_name: string | null;
        last_name: string | null;
        email: string;
        phone_number: string | null;
        business_name: string | null;
        business_industry: string | null;
        city: string | null;
        state: string | null;
        country: string | null;
    };
}

export default function LawyerProfile()
{
    const router = useRouter();
    const [profile, setProfile] = useState<LawyerProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() =>
    {
        const unsubscribe = onAuthStateChanged(auth, async (user) =>
        {
            if (user) {
                try {
                    const response = await fetch(`http://localhost:8000/api/lawyers/${user.uid}`);
                    if (response.ok) {
                        const data = await response.json();
                        setProfile(data.data);
                    } else {
                        setError("Failed to load profile");
                    }
                } catch (err) {
                    setError("Failed to load profile");
                }
            } else {
                router.push('/auth/lawyer');
            }
            setLoading(false);
        });

        return () => unsubscribe();
    }, [router]);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-xl">Loading profile...</div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-xl text-red-500">{error}</div>
            </div>
        );
    }

    if (!profile) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-xl">Profile not found</div>
            </div>
        );
    }

    return (
        <div className="container mx-auto py-8 px-4">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold">Lawyer Profile</h1>
                <Button onClick={() => router.push('/lawyer/profile/edit')}>
                    Edit Profile
                </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Personal Information */}
                <Card>
                    <CardHeader>
                        <CardTitle>Personal Information</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div>
                            <h3 className="font-semibold text-gray-500 dark:text-gray-400">Name</h3>
                            <p>{profile.user.first_name} {profile.user.last_name}</p>
                        </div>
                        <div>
                            <h3 className="font-semibold text-gray-500 dark:text-gray-400">Email</h3>
                            <p>{profile.user.email}</p>
                        </div>
                        <div>
                            <h3 className="font-semibold text-gray-500 dark:text-gray-400">Phone</h3>
                            <p>{profile.user.phone_number || 'Not provided'}</p>
                        </div>
                    </CardContent>
                </Card>

                {/* Business Information */}
                <Card>
                    <CardHeader>
                        <CardTitle>Business Information</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div>
                            <h3 className="font-semibold text-gray-500 dark:text-gray-400">Business Name</h3>
                            <p>{profile.user.business_name || 'Not provided'}</p>
                        </div>
                        <div>
                            <h3 className="font-semibold text-gray-500 dark:text-gray-400">Business Industry</h3>
                            <p>{profile.user.business_industry || 'Not provided'}</p>
                        </div>
                    </CardContent>
                </Card>

                {/* Location */}
                <Card>
                    <CardHeader>
                        <CardTitle>Location</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div>
                            <h3 className="font-semibold text-gray-500 dark:text-gray-400">Address</h3>
                            <p>
                                {profile.user.city || 'City not provided'}, {profile.user.state || 'State not provided'}, {profile.user.country || 'Country not provided'}
                            </p>
                        </div>
                    </CardContent>
                </Card>

                {/* Professional Information */}
                <Card>
                    <CardHeader>
                        <CardTitle>Professional Information</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div>
                            <h3 className="font-semibold text-gray-500 dark:text-gray-400">Bio</h3>
                            <p className="whitespace-pre-wrap">{profile.profile_bio || 'No bio provided'}</p>
                        </div>
                        <div>
                            <h3 className="font-semibold text-gray-500 dark:text-gray-400">Specializations</h3>
                            <div className="flex flex-wrap gap-2">
                                {profile.specialization.length > 0 ? (
                                    profile.specialization.map((spec) => (
                                        <Badge key={spec} variant="secondary">
                                            {spec}
                                        </Badge>
                                    ))
                                ) : (
                                    <p>No specializations listed</p>
                                )}
                            </div>
                        </div>
                        <div>
                            <h3 className="font-semibold text-gray-500 dark:text-gray-400">Rating</h3>
                            <p>
                                {profile.rating ? `${profile.rating.toFixed(1)} ⭐ (${profile.rating_count} reviews)` : 'No ratings yet'}
                            </p>
                        </div>
                        <div>
                            <h3 className="font-semibold text-gray-500 dark:text-gray-400">Verification Status</h3>
                            <Badge variant={profile.credentials_verified ? "default" : "secondary"}>
                                {profile.credentials_verified ? "Verified" : "Unverified"}
                            </Badge>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
} 