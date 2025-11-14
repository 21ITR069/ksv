import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { collection, getDocs, doc, setDoc, getDoc } from "firebase/firestore";
import { auth, firestore } from "@/lib/firebase";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { MessageSquare, Loader2, Info, ShieldAlert } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { UserRole } from "@shared/schema";

export default function Register() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { refreshUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [checkingUsers, setCheckingUsers] = useState(true);
  const [hasExistingUsers, setHasExistingUsers] = useState<boolean | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");

  // Check for existing users when component mounts
  useEffect(() => {
    const checkForExistingUsers = async () => {
      setCheckingUsers(true);
      try {
        const usersSnapshot = await getDocs(collection(firestore, "users"));
        setHasExistingUsers(!usersSnapshot.empty);
      } catch (error) {
        console.error("Error checking users:", error);
        setHasExistingUsers(null);
      } finally {
        setCheckingUsers(false);
      }
    };

    checkForExistingUsers();
  }, []);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Check if there are existing users
      const usersSnapshot = await getDocs(collection(firestore, "users"));
      const isFirstUser = usersSnapshot.empty;

      // After first admin is created, registration is closed
      if (!isFirstUser) {
        toast({
          title: "Registration Closed",
          description: "Please contact your administrator to create an account for you.",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      // Create Firebase auth user
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);

      // Create user document in Firestore with the user ID
      const userData = {
        id: userCredential.user.uid,
        email: email,
        displayName: displayName,
        role: UserRole.ADMIN,
        createdAt: Date.now(),
      };

      await setDoc(doc(firestore, "users", userCredential.user.uid), userData);

      // Verify the document was created
      const userDoc = await getDoc(doc(firestore, "users", userCredential.user.uid));
      
      if (!userDoc.exists()) {
        throw new Error("Failed to create user profile");
      }

      // Refresh the auth context to pick up the new user immediately
      await refreshUser();

      toast({
        title: "Admin Account Created!",
        description: "You are now the administrator of this TeamConnect instance.",
      });

      // Navigate to dashboard - auth context now has the user loaded
      setLocation("/");
    } catch (error: any) {
      toast({
        title: "Registration failed",
        description: error.message || "Failed to create account",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center space-y-4">
          <div className="w-16 h-16 rounded-lg bg-primary flex items-center justify-center mx-auto">
            <MessageSquare className="w-8 h-8 text-primary-foreground" />
          </div>
          <div>
            <CardTitle className="text-3xl font-semibold">
              {hasExistingUsers ? "Registration Closed" : "Create Account"}
            </CardTitle>
            <CardDescription className="mt-2">
              {checkingUsers 
                ? "Checking system status..."
                : hasExistingUsers === false
                ? "Set up your administrator account"
                : "Contact your administrator"}
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          {checkingUsers ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
            </div>
          ) : hasExistingUsers === false ? (
            <>
              <Alert className="mb-4 border-primary bg-primary/10">
                <Info className="w-4 h-4 text-primary" />
                <AlertDescription className="text-sm">
                  <strong>First User Setup:</strong> You will be registered as the administrator.
                  After setup, you can create accounts for other users.
                </AlertDescription>
              </Alert>

              <form onSubmit={handleRegister} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="displayName">Full Name</Label>
                  <Input
                    id="displayName"
                    type="text"
                    placeholder="John Doe"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    required
                    data-testid="input-display-name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@company.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    data-testid="input-email"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={6}
                    data-testid="input-password"
                  />
                  <p className="text-xs text-muted-foreground">
                    Must be at least 6 characters
                  </p>
                </div>
                <Button
                  type="submit"
                  className="w-full"
                  disabled={loading}
                  data-testid="button-register"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Creating Admin Account...
                    </>
                  ) : (
                    "Create Admin Account"
                  )}
                </Button>
              </form>

              <div className="mt-4 text-center">
                <p className="text-sm text-muted-foreground">
                  Already have an account?{" "}
                  <a href="/login" className="text-primary hover:underline" data-testid="link-login">
                    Sign In
                  </a>
                </p>
              </div>
            </>
          ) : (
            <>
              <Alert className="mb-4 border-destructive bg-destructive/10">
                <ShieldAlert className="w-4 h-4 text-destructive" />
                <AlertDescription className="text-sm">
                  <strong>Registration Disabled:</strong> Self-registration has been closed after the first administrator account was created.
                  This is a security measure to prevent unauthorized access.
                </AlertDescription>
              </Alert>
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground text-center">
                  Please contact your TeamConnect administrator to create an account for you.
                </p>
                <Button
                  onClick={() => setLocation("/login")}
                  variant="outline"
                  className="w-full"
                  data-testid="button-back-to-login"
                >
                  Back to Sign In
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
