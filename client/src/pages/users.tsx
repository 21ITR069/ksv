import { useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Users as UsersIcon, Plus, Loader2, Mail, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { collection, getDocs, doc, setDoc } from "firebase/firestore";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { auth, firestore } from "@/lib/firebase";
import { UserRole, type User } from "@shared/schema";
import { Skeleton } from "@/components/ui/skeleton";

export default function UsersPage() {
  const [, setLocation] = useLocation();
  const { currentUser } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [createUserOpen, setCreateUserOpen] = useState(false);
  const [confirmCreateOpen, setConfirmCreateOpen] = useState(false);
  const [newUserEmail, setNewUserEmail] = useState("");
  const [newUserPassword, setNewUserPassword] = useState("");
  const [newUserName, setNewUserName] = useState("");
  const [newUserRole, setNewUserRole] = useState<string>("");

  // Fetch all users
  const { data: users, isLoading } = useQuery({
    queryKey: ["/api/users"],
    queryFn: async () => {
      const usersSnapshot = await getDocs(collection(firestore, "users"));
      return usersSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as User[];
    },
  });

  const createUserMutation = useMutation({
    mutationFn: async () => {
      if (!newUserEmail || !newUserPassword || !newUserName || !newUserRole) {
        throw new Error("All fields are required");
      }

      // Note: This client-side user creation will sign out the current admin/manager
      // In production, this should be done via Firebase Admin SDK on a backend server
      
      // Create Firebase auth user
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        newUserEmail,
        newUserPassword
      );

      // Create user document in Firestore
      const userData: Omit<User, 'id'> = {
        email: newUserEmail,
        displayName: newUserName,
        role: newUserRole as any,
        createdAt: Date.now(),
        createdBy: currentUser?.id,
      };

      await setDoc(doc(firestore, "users", userCredential.user.uid), userData);

      // Sign out the newly created user
      await auth.signOut();

      return { email: newUserEmail, name: newUserName };
    },
    onSuccess: (data) => {
      toast({
        title: "User Created Successfully",
        description: `${data.name} (${data.email}) has been created. You've been signed out and will be redirected to login.`,
        duration: 5000,
      });
      
      // Clear form
      setNewUserEmail("");
      setNewUserPassword("");
      setNewUserName("");
      setNewUserRole("");
      setCreateUserOpen(false);
      setConfirmCreateOpen(false);
      
      // Redirect to login after 2 seconds
      setTimeout(() => {
        setLocation("/login");
      }, 2000);
    },
    onError: (error: any) => {
      toast({
        title: "Failed to create user",
        description: error.message || "An error occurred",
        variant: "destructive",
      });
      setConfirmCreateOpen(false);
    },
  });

  const handleCreateUser = () => {
    // Validate fields
    if (!newUserEmail || !newUserPassword || !newUserName || !newUserRole) {
      toast({
        title: "Missing Information",
        description: "Please fill in all fields",
        variant: "destructive",
      });
      return;
    }
    
    // Show confirmation dialog
    setConfirmCreateOpen(true);
  };

  const confirmCreateUser = () => {
    createUserMutation.mutate();
  };

  const roleColors = {
    [UserRole.ADMIN]: "bg-primary text-primary-foreground",
    [UserRole.MANAGER]: "bg-chart-2 text-white",
    [UserRole.HR]: "bg-chart-3 text-white",
    [UserRole.EMPLOYEE]: "bg-chart-4 text-white",
    [UserRole.CLIENT]: "bg-muted text-muted-foreground",
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .substring(0, 2);
  };

  // Determine allowed roles based on current user
  const getAllowedRoles = () => {
    if (currentUser?.role === UserRole.ADMIN) {
      return [UserRole.ADMIN, UserRole.MANAGER, UserRole.HR, UserRole.EMPLOYEE, UserRole.CLIENT];
    } else if (currentUser?.role === UserRole.MANAGER) {
      return [UserRole.HR, UserRole.EMPLOYEE];
    }
    return [];
  };

  const allowedRoles = getAllowedRoles();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold" data-testid="page-title">User Management</h1>
          <p className="text-muted-foreground mt-2">
            Create and manage team member accounts
          </p>
        </div>
        <Dialog open={createUserOpen} onOpenChange={setCreateUserOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-create-user">
              <Plus className="w-4 h-4 mr-2" />
              Create User
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New User</DialogTitle>
              <DialogDescription>
                Add a new team member to the system
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="userName">Full Name</Label>
                <Input
                  id="userName"
                  placeholder="John Doe"
                  value={newUserName}
                  onChange={(e) => setNewUserName(e.target.value)}
                  data-testid="input-user-name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="userEmail">Email</Label>
                <Input
                  id="userEmail"
                  type="email"
                  placeholder="john@company.com"
                  value={newUserEmail}
                  onChange={(e) => setNewUserEmail(e.target.value)}
                  data-testid="input-user-email"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="userPassword">Password</Label>
                <Input
                  id="userPassword"
                  type="password"
                  placeholder="••••••••"
                  value={newUserPassword}
                  onChange={(e) => setNewUserPassword(e.target.value)}
                  data-testid="input-user-password"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="userRole">Role</Label>
                <Select value={newUserRole} onValueChange={setNewUserRole}>
                  <SelectTrigger id="userRole" data-testid="select-user-role">
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    {allowedRoles.map((role) => (
                      <SelectItem key={role} value={role}>
                        {role.charAt(0).toUpperCase() + role.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button
                onClick={handleCreateUser}
                disabled={createUserMutation.isPending || !newUserEmail || !newUserPassword || !newUserName || !newUserRole}
                data-testid="button-submit-create-user"
              >
                {createUserMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  "Create User"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        
        {/* Confirmation Dialog */}
        <Dialog open={confirmCreateOpen} onOpenChange={setConfirmCreateOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-destructive" />
                Important Notice
              </DialogTitle>
              <DialogDescription>
                Please read this carefully before proceeding
              </DialogDescription>
            </DialogHeader>
            <Alert className="border-destructive bg-destructive/10">
              <AlertTriangle className="w-4 h-4 text-destructive" />
              <AlertDescription>
                <strong>You will be signed out</strong> after creating this user. This is a technical limitation of client-side Firebase user creation.
                <br /><br />
                You'll need to log back in with your credentials to continue using TeamConnect.
                <br /><br />
                <strong className="text-destructive">Future Update:</strong> This limitation will be resolved when backend user provisioning via Firebase Admin SDK is implemented.
              </AlertDescription>
            </Alert>
            <DialogFooter className="gap-2">
              <Button
                variant="outline"
                onClick={() => setConfirmCreateOpen(false)}
                data-testid="button-cancel-create"
              >
                Cancel
              </Button>
              <Button
                onClick={confirmCreateUser}
                disabled={createUserMutation.isPending}
                data-testid="button-confirm-create-user"
              >
                {createUserMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Creating User...
                  </>
                ) : (
                  "I Understand, Create User"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UsersIcon className="w-5 h-5" />
            Team Members
          </CardTitle>
          <CardDescription>
            All registered users in the system
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="flex items-center gap-4 p-4 border rounded-md">
                  <Skeleton className="w-12 h-12 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-48" />
                  </div>
                  <Skeleton className="h-6 w-20" />
                </div>
              ))}
            </div>
          ) : !users || users.length === 0 ? (
            <div className="text-center py-12">
              <UsersIcon className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No users found</p>
            </div>
          ) : (
            <div className="space-y-3">
              {users.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center gap-4 p-4 border rounded-md hover-elevate"
                  data-testid={`user-card-${user.id}`}
                >
                  <Avatar className="w-12 h-12">
                    <AvatarImage src={user.photoURL} />
                    <AvatarFallback>{getInitials(user.displayName)}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{user.displayName}</p>
                      <Badge
                        className={`text-xs ${roleColors[user.role]}`}
                        data-testid={`user-role-${user.id}`}
                      >
                        {user.role}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-1 mt-1">
                      <Mail className="w-3 h-3 text-muted-foreground" />
                      <p className="text-sm text-muted-foreground">{user.email}</p>
                    </div>
                    {user.createdAt && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Joined {new Date(user.createdAt).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
