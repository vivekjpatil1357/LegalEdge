// app/auth/register/page.tsx
"use client";

import { useState, useEffect, FormEvent } from "react";
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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { useRegistration } from "@/contexts/RegistrationContext"; // Import context hook
import { auth, googleProvider } from "@/config/firebase";
import {
  createUserWithEmailAndPassword,
  signInWithPopup,
} from "firebase/auth";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { createUser } from "@/app/api/register";

export default function RegisterPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const {
    formData,
    setFormData,
    currentStep,
    setCurrentStep,
    goToNextStep,
    goToPreviousStep,
    errors,
    setErrors,
  } = useRegistration();

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const stepParam = searchParams.get("step");
    const initialStep = stepParam ? parseInt(stepParam, 10) : 1;

    // Validate step parameter
    if (isNaN(initialStep) || initialStep < 1 || initialStep > 3) {
      router.replace("/auth/register?step=1"); // Redirect to step 1 if invalid
      return;
    }
    setCurrentStep(initialStep);
  }, [searchParams, router, setCurrentStep]);

  // --- Validation Functions ---
  const validateStep1 = () => {
    const newErrors: any = {};
    if (!formData.role) {
      newErrors.role = "Please select a user type.";
    }
    if (formData.role === "individual") {
      if (!formData.first_name) newErrors.first_name = "First name is required.";
      if (!formData.last_name) newErrors.last_name = "Last name is required.";
    } else if (formData.role === "business") {
      if (!formData.business_name)
        newErrors.business_name = "Business name is required.";
    }
    if (!formData.email) {
      newErrors.email = "Email is required.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Invalid email format.";
    }
    if (!formData.password) {
      newErrors.password = "Password is required.";
    } else if (formData.password.length < 6) {
      newErrors.password = "Password must be at least 6 characters.";
    }
    setErrors({ ...errors, step1: newErrors });
    return Object.keys(newErrors).length === 0; // Return true if no errors
  };

  const validateStep2 = () => {
    const newErrors: any = {};
    if (!formData.city) {
      newErrors.city = "City is required.";
    }
    if (!formData.state) {
      newErrors.state = "State is required.";
    }
    if (!formData.country) {
      newErrors.country = "Country is required.";
    }
    setErrors({ ...errors, step2: newErrors });
    return Object.keys(newErrors).length === 0;
  }

  const validateStep3 = () => { // Can add more for preferences
    const newErrors: any = {};
    setErrors({ ...errors, step3: newErrors }); // For preferences
    return Object.keys(newErrors).length === 0;
  }

  const handleNext = () => {
    let isValid = false;
    if (currentStep === 1) {
      isValid = validateStep1();
    } else if (currentStep === 2) {
      isValid = validateStep2();
    } else if (currentStep === 3) {
      isValid = validateStep3();
    }

    if (isValid) {
      if (currentStep < 3) {
        goToNextStep();
        router.push(`/auth/register?step=${currentStep + 1}`);
      } else {
        // Submit the form (Step 3)
        handleSubmit();
      }
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      goToPreviousStep();
      router.push(`/auth/register?step=${currentStep - 1}`);
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setErrors({}); // Clear errors
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      const createdAt = user.metadata.creationTime;
      const lastLoginAt = user.metadata.lastSignInTime;
      // Check if the user already exists in *your* database.
      const response = await fetch(`/api/users/${user.uid}`); // Check existence via a new route.
      const existingUser = await response.json();

      if (!existingUser) { // User doesn't exist in *your* database.

        // Create user in YOUR database (important!)
        const userData = {
          firebaseId: user.uid,
          email: user.email,
          first_name: user.displayName?.split(" ")[0] || "", // Handle potential nulls
          last_name: user.displayName?.split(" ")[1] || "",
          role: formData.role.toUpperCase(), // Or prompt the user to select
          business_name: formData.role === 'business' ? formData.business_name : undefined
        };

        const createResponse = await fetch("/api/users", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(userData),
        });
        if (!createResponse.ok) {
          throw new Error(`Failed to create user: ${createResponse.status} ${createResponse.statusText}`);
        }
        router.push("/dashboard"); // Redirect to dashboard AFTER user creation
      }
      else {
        router.push('/dashboard')
      }
    } catch (error: any) {
      console.error("Google Sign-In Error:", error);
      setErrors({ firebase: { message: error.message || 'Google Sign-In Failed' } });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    setErrors({}); // Clear errors

    //Firebase auth (email/password)
    try {
      const result = await createUserWithEmailAndPassword(
        auth,
        formData.email,
        formData.password
      );

      // Create user in YOUR database
      const userData = {
        firebaseId: result.user.uid,
        email: formData.email,
        first_name: formData.first_name,
        last_name: formData.last_name,
        role: formData.role.toUpperCase(),
        business_name: formData.business_name, // Only present if role is 'business'
        city: formData.city,
        state: formData.state,
        country: formData.country,
        preferences: formData.preferences
      }
      const createdUser = await createUser(userData)

      router.push("/dashboard"); // Redirect to dashboard after successful registration
    } catch (error: any) {
      console.error("Registration Error:", error);
      setErrors({
        firebase: { message: error.message || "Registration failed" },
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900">
      <Card className="w-full max-w-md p-6 shadow-md bg-white dark:bg-gray-800 dark:text-white">
        <CardHeader>
          <CardTitle className="text-center text-2xl font-bold">
            Create Account
          </CardTitle>
          <div className="w-full mt-4">
            <Progress value={(currentStep / 3) * 100} className="w-full" />
            <div className="flex justify-between mt-1 text-sm text-gray-500 dark:text-gray-400">
              <span>Step {currentStep} of 3</span>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Error Display */}
          {errors.firebase && (
            <Alert variant="destructive">
              <AlertTitle>Firebase Error</AlertTitle>
              <AlertDescription>
                {errors.firebase.message}
              </AlertDescription>
            </Alert>
          )}
          {/* Step 1: User Type and Basic Info */}
          {currentStep === 1 && (
            <>
              <div className="space-y-4">
                <RadioGroup
                  defaultValue={formData.role || ""}
                  onValueChange={(value) =>
                    setFormData({ ...formData, role: value })
                  }
                  className="space-y-2"
                  disabled={currentStep > 1} // Disable after completing step 1
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="individual" id="individual" />
                    <Label htmlFor="individual">Individual</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="business" id="business" />
                    <Label htmlFor="business">Business</Label>
                  </div>
                </RadioGroup>
                {errors.step1?.role && (
                  <p className="text-red-500 text-sm">{errors.step1.role}</p>
                )}

                {formData.role === "individual" && (
                  <>
                    <div className="flex gap-2">
                      <Input
                        placeholder="First Name"
                        value={formData.first_name || ""}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            first_name: e.target.value,
                          })
                        }
                        className="dark:bg-gray-700"
                        disabled={currentStep > 1} // Disable after completing step 1
                      />
                      <Input
                        placeholder="Last Name"
                        value={formData.last_name || ""}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            last_name: e.target.value,
                          })
                        }
                        className="dark:bg-gray-700"
                        disabled={currentStep > 1}
                      />
                    </div>
                    {errors.step1?.first_name && (
                      <p className="text-red-500 text-sm">
                        {errors.step1.first_name}
                      </p>
                    )}
                    {errors.step1?.last_name && (
                      <p className="text-red-500 text-sm">
                        {errors.step1.last_name}
                      </p>
                    )}
                  </>
                )}

                {formData.role === "business" && (
                  <>
                    <Input
                      placeholder="Business Name"
                      value={formData.business_name || ""}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          business_name: e.target.value,
                        })
                      }
                      className="dark:bg-gray-700"
                      disabled={currentStep > 1}
                    />
                    {errors.step1?.business_name && (
                      <p className="text-red-500 text-sm">
                        {errors.step1.business_name}
                      </p>
                    )}
                  </>
                )}

                <Input
                  type="email"
                  placeholder="Email"
                  value={formData.email || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  className="dark:bg-gray-700"
                  disabled={currentStep > 1}
                />
                {errors.step1?.email && (
                  <p className="text-red-500 text-sm">{errors.step1.email}</p>
                )}

                <Input
                  type="password"
                  placeholder="Password"
                  value={formData.password || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                  className="dark:bg-gray-700"
                  disabled={currentStep > 1}
                />
                {errors.step1?.password && (
                  <p className="text-red-500 text-sm">
                    {errors.step1.password}
                  </p>
                )}
                <Button
                  variant="outline"
                  className="w-full flex items-center gap-2"
                  onClick={handleGoogleSignIn}
                  disabled={loading || currentStep > 1}
                >
                  Sign Up with Google
                </Button>
              </div>
            </>
          )}

          {/* Step 2: Personal/Business Details */}
          {currentStep === 2 && (
            <>
              <div className="space-y-4">
                <Input
                  placeholder="City"
                  value={formData.city || ""}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  className="dark:bg-gray-700"
                />
                {errors.step2?.city && (
                  <p className="text-red-500 text-sm">{errors.step2.city}</p>
                )}
                <Input
                  placeholder="State"
                  value={formData.state || ""}
                  onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                  className="dark:bg-gray-700"
                />
                {errors.step2?.state && (
                  <p className="text-red-500 text-sm">{errors.step2.state}</p>
                )}

                <Input
                  placeholder="Country"
                  value={formData.country || ""}
                  onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                  className="dark:bg-gray-700"
                />
                {errors.step2?.country && (
                  <p className="text-red-500 text-sm">{errors.step2.country}</p>
                )}
              </div>
            </>
          )}

          {/* Step 3: Preferences/Additional Info */}
          {
            currentStep === 3 && (
              <>
                {/* Add your preference fields here */}
                <div className="space-y-4">
                  <p>Preferences and other details form fields would go here.</p>
                </div>
              </>
            )
          }
        </CardContent>
        <CardFooter>
          <div className="flex justify-between w-full">
            <Button
              variant="outline"
              onClick={handleBack}
              disabled={currentStep === 1}
            >
              Back
            </Button>
            <Button onClick={handleNext} disabled={loading}>
              {currentStep === 3 ? "Submit" : "Next"}
            </Button>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}