import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { LogOut, User as UserIcon, Mail, Shield } from "lucide-react";
import { useLocation } from "wouter";
import { UserRole } from "@shared/schema";

export default function SettingsPage() {
  const { currentUser, signOut } = useAuth();
  const [, setLocation] = useLocation();

  const handleSignOut = async () => {
    await signOut();
    setLocation("/login");
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

  if (!currentUser) return null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold" data-testid="page-title">Settings</h1>
        <p className="text-muted-foreground mt-2">
          Manage your account preferences
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Profile Information</CardTitle>
          <CardDescription>
            Your account details and role
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center gap-6">
            <Avatar className="w-20 h-20">
              <AvatarImage src={currentUser.photoURL} />
              <AvatarFallback className="text-2xl">
                {getInitials(currentUser.displayName)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <h3 className="text-xl font-semibold">{currentUser.displayName}</h3>
              <Badge className={`mt-2 ${roleColors[currentUser.role]}`}>
                {currentUser.role}
              </Badge>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center gap-3 p-3 rounded-md border">
              <div className="w-10 h-10 rounded-md bg-primary/10 flex items-center justify-center">
                <UserIcon className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Full Name</p>
                <p className="font-medium">{currentUser.displayName}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 rounded-md border">
              <div className="w-10 h-10 rounded-md bg-chart-2/10 flex items-center justify-center">
                <Mail className="w-5 h-5 text-chart-2" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Email Address</p>
                <p className="font-medium">{currentUser.email}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 rounded-md border">
              <div className="w-10 h-10 rounded-md bg-chart-3/10 flex items-center justify-center">
                <Shield className="w-5 h-5 text-chart-3" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Role & Permissions</p>
                <p className="font-medium capitalize">{currentUser.role}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Account Actions</CardTitle>
          <CardDescription>
            Manage your session and account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            variant="destructive"
            onClick={handleSignOut}
            data-testid="button-sign-out"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Sign Out
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>About TeamConnect</CardTitle>
          <CardDescription>
            Application information
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between py-2 border-b">
            <span className="text-sm text-muted-foreground">Version</span>
            <span className="text-sm font-medium">1.0.0</span>
          </div>
          <div className="flex items-center justify-between py-2 border-b">
            <span className="text-sm text-muted-foreground">Office Location</span>
            <span className="text-sm font-medium">Bangalore, India</span>
          </div>
          <div className="flex items-center justify-between py-2">
            <span className="text-sm text-muted-foreground">Attendance Radius</span>
            <span className="text-sm font-medium">1 km</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
