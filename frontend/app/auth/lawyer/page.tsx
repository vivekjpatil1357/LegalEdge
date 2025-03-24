"use client";

import { useState, FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {auth,googleProvider} from '@/config/firebase'
import { useTheme } from "next-themes";
import {
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
} from "firebase/auth";
import { useRouter } from "next/navigation";

export default function AuthPage() {
  const [isSignUp, setIsSignUp] = useState(false);
  const { theme, setTheme } = useTheme();
  const router = useRouter();
  
  // Form state
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSignUp = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    // Basic validation
    if (!firstName || !lastName || !email || !password || !confirmPassword) {
      setError("All fields are required");
      setLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      setLoading(false);
      return;
    }

    try {
      // Create user in Firebase
      console.log("Creating user in Firebase");
      
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      
      // For email/password signup, redirect to onboarding
      router.push("/auth/lawyer/onboarding");
    } catch (error: any) {
      setError(error.message || "Failed to create account");
    } finally {
      setLoading(false);
    }
  };

  const handleSignIn = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    if (!email || !password) {
      setError("Email and password are required");
      setLoading(false);
      return;
    }

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      router.push("/home");
    } catch (error: any) {
      setError(error.message || "Failed to sign in");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError("");
    setLoading(true);
    
    try {
      const userCredential = await signInWithPopup(auth, googleProvider);
      const user=userCredential.user
      const createdAt = user.metadata.creationTime;
      const lastLoginAt = user.metadata.lastSignInTime;
  
      if (createdAt === lastLoginAt) {
        console.log("First-time login. Redirect to onboarding.");
          try{
            await fetch('http://localhost:8000/api/lawyers/auth/register', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                email: user.email,
                first_name: user.displayName?.split(' ')[0],
                last_name: user.displayName?.split(' ')[1],
                role: 'lawyer',
                firebaseId: user.uid
              })
            })  
            router.push("/auth/lawyer/onboarding");
        }catch(error){
          console.error('Error creating lawyer profile:', error);
          setError("Failed to create lawyer profile. Please try again.");
        }
      } else {
        console.log("Existing user. Proceed to dashboard.");
        // Handle returning user
        router.push("/home");
      }
    } catch (error: any) {
      setError(error.message || "Failed to sign in with Google");
    } finally {
      setLoading(false);
    }
  };
    
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900">
      <Card className="w-full max-w-md p-6 shadow-md bg-white dark:bg-gray-800 dark:text-white">
        <CardHeader>
          <CardTitle className="text-center text-2xl font-bold">
            {isSignUp ? "Create an Account" : "Welcome Back"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Toggle Mode */}
          <div className="flex justify-end">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            >
              {theme === "dark" ? "🌞 Light" : "🌙 Dark"}
            </Button>
          </div>

          {/* Toggle Sign In / Sign Up */}
          <div className="flex justify-center my-4">
            <Button
              variant={!isSignUp ? "default" : "outline"}
              className="mr-2 w-1/2"
              onClick={() => setIsSignUp(false)}
            >
              Sign In
            </Button>
            <Button
              variant={isSignUp ? "default" : "outline"}
              className="w-1/2"
              onClick={() => setIsSignUp(true)}
            >
              Sign Up
            </Button>
          </div>

          {/* Error message */}
          {error && (
            <div className="bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-200 p-2 rounded-md mb-3">
              {error}
            </div>
          )}

          {/* Sign Up Form */}
          {isSignUp ? (
            <form className="space-y-3" onSubmit={handleSignUp}>
              <div className="flex gap-2">
                <Input 
                  placeholder="First Name" 
                  required 
                  className="dark:bg-gray-700" 
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                />
                <Input 
                  placeholder="Last Name" 
                  required 
                  className="dark:bg-gray-700" 
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                />
              </div>
              <Input 
                type="email" 
                placeholder="Email" 
                required 
                className="dark:bg-gray-700" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <Input 
                type="password" 
                placeholder="Password" 
                required 
                className="dark:bg-gray-700" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <Input 
                type="password" 
                placeholder="Confirm Password" 
                required 
                className="dark:bg-gray-700" 
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Creating Account..." : "Sign Up"}
              </Button>
              <Button 
                type="button"
                variant="outline" 
                className="w-full flex items-center gap-2"
                onClick={handleGoogleSignIn}
                disabled={loading}
              >
                Sign Up with Google
              </Button>
            </form>
          ) : (
            // Sign In Form
            <form className="space-y-3" onSubmit={handleSignIn}>
              <Input 
                type="email" 
                placeholder="Email" 
                required 
                className="dark:bg-gray-700" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <Input 
                type="password" 
                placeholder="Password" 
                required 
                className="dark:bg-gray-700" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Signing In..." : "Sign In"}
              </Button>
              <Button 
                type="button"
                variant="outline" 
                className="w-full flex items-center gap-2"
                onClick={handleGoogleSignIn}
                disabled={loading}
              >
                Sign In with Google
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
