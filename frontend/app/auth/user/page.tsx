"use client";

import { useState, FormEvent, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { auth, googleProvider } from "@/config/firebase";
import { createUserWithEmailAndPassword, signInWithPopup, GoogleAuthProvider, User } from "firebase/auth";
import { CheckCircle2, Circle, ChevronLeft, ChevronRight } from 'lucide-react';
import { useTheme } from "next-themes";
import { createUser } from "@/app/api/register";

const steps = ["Account Type", "Basic Info", "Preferences"];

// Create context
// const AuthContext = createContext<AuthContextType>({
//   formData: defaultFormData,
//   setFormData: () => {},
//   currentStep: 1,
//   setCurrentStep: () => {},
// });

export default function MultiStepSignUp() {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    role: "",
    firstName: "",
    lastName: "",
    businessName: "",
    email: "",
    password: "",
    confirmPassword: "",
    phoneNumber: "",
    businessIndustry: "",
    preferences: {
      preferred_language: 'en',
      notification_preferences: {},
      legal_areas_of_interest: []
    }
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();
  const searchParams = useSearchParams();
  const { theme, setTheme } = useTheme();

  const firstRender = useRef(true)

  const isStep1Valid = () => formData.role === "individual" || formData.role === "business";
  const isStep2Valid = () => {
    if (formData.role === "individual") {
      return (
        formData.firstName.trim() !== "" &&
        formData.lastName.trim() !== "" &&
        formData.email.trim() !== "" &&
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email) &&
        formData.password.trim() !== "" &&
        formData.password === formData.confirmPassword
      );
    } else {
      // Business validation
      return (
        formData.businessName.trim() !== "" &&
        formData.email.trim() !== "" &&
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email) &&
        formData.password.trim() !== "" &&
        formData.password === formData.confirmPassword
      );
    }
  };

  const isStep3Valid = () => true;  // No required fields in step 3, so always valid.

  useEffect(() => {
    const stepParam = searchParams.get("step");
    const parsedStep = parseInt(stepParam || "1", 10);

    if (firstRender.current) {
      firstRender.current = false
      if (!isNaN(parsedStep) && parsedStep >= 1 && parsedStep <= steps.length) {
        setCurrentStep(parsedStep);
      } else {
        router.replace("/auth/user?step=1");
      }
    }

  }, [searchParams, router]);
  const handleNext = () => {
    if (currentStep === 1 && !isStep1Valid()) {
      setError("Please select a valid account type.");
      return;
    }
    if (currentStep === 2 && !isStep2Valid()) {
      setError("Please fill in all required fields correctly.");
      return;
    }

    setError(""); // Clear any previous errors.
    if (currentStep < steps.length) {
      const nextStep = currentStep + 1
      setCurrentStep(nextStep);
      router.push(`/auth/user?step=${nextStep}`);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      const prevStep = currentStep - 1
      setCurrentStep(prevStep);
      router.push(`/auth/user?step=${prevStep}`);
    }
  };


  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  // Handle preferences (step 3) changes.
  const handlePreferencesChange = (field: string, value: any) => {
    setFormData(prevData => ({
      ...prevData,
      preferences: {
        ...prevData.preferences,
        [field]: value
      }
    }));
  };

  const handleSignUp = async (e: FormEvent) => {
    e.preventDefault();
    if (!isStep3Valid()) return;

    setLoading(true);
    setError("");

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
      const user = userCredential.user

      let apiData: any = {
        email: formData.email,
        role: formData.role,
        firebaseId: user.uid
      }

      if (formData.role === 'individual') {
        apiData.first_name = formData.firstName
        apiData.last_name = formData.lastName
        apiData.phone_number = formData.phoneNumber
        apiData.preferences = formData.preferences
      }

      if (formData.role === 'business') {
        apiData.business_name = formData.businessName
        apiData.business_industry = formData.businessIndustry
        apiData.phone_number = formData.phoneNumber
        apiData.preferences = formData.preferences
      }

      const createdUser = await createUser(apiData)

      // For email/password signup, redirect to dashboard
      router.push("/dashboard");

    } catch (err: any) {
      setError(err.message || "An unexpected error occured");

    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError("");
    setLoading(true);

    try {
      const userCredential = await signInWithPopup(auth, googleProvider);
      const user = userCredential.user
      const createdAt = user.metadata.creationTime;
      const lastLoginAt = user.metadata.lastSignInTime;

      const response = await fetch('http://localhost:8000/api/auth/google', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email: user.email,
          first_name: user.displayName?.split(' ')[0],
          last_name: user.displayName?.split(' ')[1],
          role: 'individual',
          firebaseId: user.uid
        })
      })

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to create user in database");
      }

      if (createdAt === lastLoginAt) {
        console.log("First-time login. Redirect to onboarding.");
        router.push("/dashboard");
      } else {
        console.log("Existing user. Proceed to dashboard.");
        router.push("/dashboard");
      }

    } catch (error: any) {
      setError(error.message || "Failed to sign in with Google");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900">
      <Card className="w-full max-w-2xl shadow-md">
        <CardHeader>
          <CardTitle className="text-center text-2xl font-bold">
            Create an Account
          </CardTitle>
          <div className="flex justify-center space-x-4 mt-4">
            {steps.map((stepName, index) => (
              <div key={index} className="flex items-center">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center ${currentStep > index + 1
                    ? "bg-green-500 text-white"
                    : currentStep === index + 1
                      ? "bg-blue-500 text-white"
                      : "bg-gray-300 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
                    }`}
                >
                  {currentStep > index + 1 ? (
                    <CheckCircle2 className="w-4 h-4" />
                  ) : (
                    index + 1
                  )}
                </div>
                <span className="ml-2 text-sm">{stepName}</span>
              </div>
            ))}
          </div>
          <div className="flex justify-end">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            >
              {theme === "dark" ? "🌞 Light" : "🌙 Dark"}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-200 p-2 rounded-md mb-3">
              {error}
            </div>
          )}
          <form className="space-y-4" onSubmit={handleSignUp}>
            {currentStep === 1 && (
              <>
                <Label>Account Type</Label>
                <Select
                  onValueChange={(value) => setFormData({ ...formData, role: value })}
                  value={formData.role}
                  disabled={loading}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select Account Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="individual">Individual</SelectItem>
                    <SelectItem value="business">Business</SelectItem>
                  </SelectContent>
                </Select>
              </>
            )}

            {currentStep === 2 && (
              <>
                {formData.role === "individual" ? (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>First Name</Label>
                        <Input
                          type="text"
                          name="firstName"
                          value={formData.firstName}
                          onChange={handleChange}
                          required
                          disabled={loading}
                        />
                      </div>
                      <div>
                        <Label>Last Name</Label>
                        <Input
                          type="text"
                          name="lastName"
                          value={formData.lastName}
                          onChange={handleChange}
                          required
                          disabled={loading}
                        />
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    <Label>Business Name</Label>
                    <Input
                      type="text"
                      name="businessName"
                      value={formData.businessName}
                      onChange={handleChange}
                      required
                      disabled={loading}
                    />
                    <Label>Business Industry</Label>
                    <Input
                      type="text"
                      name="businessIndustry"
                      value={formData.businessIndustry}
                      onChange={handleChange}
                      disabled={loading}
                    />
                  </>
                )}
                <Label>Email</Label>
                <Input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  disabled={loading}
                />
                <Label>Password</Label>
                <Input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  disabled={loading}
                />
                <Label>Confirm Password</Label>
                <Input
                  type="password"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  required
                  disabled={loading}
                />
                <Label>Phone Number (Optional)</Label>
                <Input
                  type="tel"
                  name="phoneNumber"
                  value={formData.phoneNumber}
                  onChange={handleChange}
                  disabled={loading}
                />
              </>
            )}

            {currentStep === 3 && (
              <>
                <Label>Preferred Language</Label>
                <Select
                  onValueChange={(value) => handlePreferencesChange('preferred_language', value)}
                  value={formData.preferences.preferred_language}
                  disabled={loading}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select Preferred Language" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="en">English</SelectItem>
                    <SelectItem value="fr">French</SelectItem>
                  </SelectContent>
                </Select>

                <Label>Notification Preferences</Label>

                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="emailNotifications"
                    checked={formData.preferences.notification_preferences.email || false}
                    onChange={(e) =>
                      handlePreferencesChange('notification_preferences', {
                        ...formData.preferences.notification_preferences,
                        email: e.target.checked,
                      })
                    }
                    disabled={loading}
                  />
                  <label htmlFor="emailNotifications">Email Notifications</label>
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="inAppNotifications"
                    checked={formData.preferences.notification_preferences.inApp || false}
                    onChange={(e) =>
                      handlePreferencesChange('notification_preferences', {
                        ...formData.preferences.notification_preferences,
                        inApp: e.target.checked,
                      })
                    }
                    disabled={loading}
                  />
                  <label htmlFor="inAppNotifications">In-App Notifications</label>
                </div>

                <Label>Legal Areas of Interest</Label>
                <Select
                  onValueChange={(value: string) => {
                    if (!formData.preferences.legal_areas_of_interest.includes(value)) {
                      handlePreferencesChange('legal_areas_of_interest', [...formData.preferences.legal_areas_of_interest, value]);
                    }
                  }}
                  disabled={loading}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Add areas of interest" />
                    {formData.preferences.legal_areas_of_interest.length > 0 && (
                      <div className="mt-1 flex flex-wrap gap-1">
                        {formData.preferences.legal_areas_of_interest.map((area) => (
                          <span
                            key={area}
                            className="bg-blue-100 text-blue-800 text-xs font-medium me-2 px-2.5 py-0.5 rounded dark:bg-blue-900 dark:text-blue-300"
                          >
                            {area}{" "}
                            <span
                              className="ml-1 text-blue-800 hover:text-blue-600"
                              onClick={(e) => {
                                handlePreferencesChange('legal_areas_of_interest',
                                  formData.preferences.legal_areas_of_interest.filter((a) => a !== area)
                                );
                              }}
                            >
                              x
                            </span>
                          </span>
                        ))}
                      </div>
                    )}
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Contract Law">Contract Law</SelectItem>
                    <SelectItem value="Corporate Law">Corporate Law</SelectItem>
                    <SelectItem value="Real Estate Law">Real Estate Law</SelectItem>
                    <SelectItem value="IP Law">IP Law</SelectItem>
                    <SelectItem value="Family Law">Family Law</SelectItem>
                  </SelectContent>
                </Select>
              </>
            )}
          </form>

        </CardContent>
        <CardFooter className="flex justify-between">
          <Button variant="outline" onClick={handleBack} disabled={currentStep === 1 || loading}>
            <ChevronLeft className="mr-2 h-4 w-4" /> Previous
          </Button>
          {/* Conditional rendering for Next/Submit button */}
          {currentStep < steps.length ? (
            <Button onClick={handleNext} disabled={loading}>
              Next <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
          ) : (
            <Button onClick={handleSignUp} disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Signing Up...
                </>
              ) : (
                "Sign Up"
              )}
            </Button>

          )}
        </CardFooter>
        <CardFooter className="flex justify-center">
          <Button
            type="button"
            variant="outline"
            className="w-full flex items-center gap-2"
            onClick={handleGoogleSignIn}
            disabled={loading}
          >
            {loading ? "Signing up..." : "Sign up with Google"}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}