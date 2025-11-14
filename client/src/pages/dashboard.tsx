import { useAuth } from "@/lib/auth-context";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, Calendar, MessageSquare, TrendingUp } from "lucide-react";
import { UserRole } from "@shared/schema";
import { useQuery } from "@tanstack/react-query";
import { collection, query, where, getDocs } from "firebase/firestore";
import { ref, get } from "firebase/database";
import { firestore, realtimeDB } from "@/lib/firebase";
import { Skeleton } from "@/components/ui/skeleton";

export default function Dashboard() {
  const { currentUser } = useAuth();

  // Fetch user count (for Admin/Manager)
  const { data: userCount, isLoading: usersLoading } = useQuery({
    queryKey: ["/api/users/count"],
    queryFn: async () => {
      const usersSnapshot = await getDocs(collection(firestore, "users"));
      return usersSnapshot.size;
    },
    enabled: currentUser?.role === UserRole.ADMIN || currentUser?.role === UserRole.MANAGER,
  });

  // Fetch attendance count for current month
  const { data: attendanceCount, isLoading: attendanceLoading } = useQuery({
    queryKey: ["/api/attendance/count", currentUser?.id],
    queryFn: async () => {
      if (!currentUser) return 0;
      const now = new Date();
      const year = now.getFullYear();
      const month = now.getMonth() + 1;
      
      const attendanceRef = ref(realtimeDB, `attendance/${currentUser.id}/${year}/${month}`);
      const snapshot = await get(attendanceRef);
      
      if (snapshot.exists()) {
        return Object.keys(snapshot.val()).length;
      }
      return 0;
    },
  });

  // Fetch chat groups count
  const { data: groupsCount, isLoading: groupsLoading } = useQuery({
    queryKey: ["/api/groups/count", currentUser?.id],
    queryFn: async () => {
      if (!currentUser) return 0;
      const groupsQuery = query(
        collection(firestore, "chatGroups"),
        where("members", "array-contains", currentUser.id)
      );
      const snapshot = await getDocs(groupsQuery);
      return snapshot.size;
    },
  });

  const roleColors = {
    [UserRole.ADMIN]: "bg-primary text-primary-foreground",
    [UserRole.MANAGER]: "bg-chart-2 text-white",
    [UserRole.HR]: "bg-chart-3 text-white",
    [UserRole.EMPLOYEE]: "bg-chart-4 text-white",
    [UserRole.CLIENT]: "bg-muted text-muted-foreground",
  };

  const statCards = [
    {
      title: "Attendance This Month",
      value: attendanceCount || 0,
      icon: Calendar,
      description: "Days marked present",
      show: currentUser?.role !== UserRole.CLIENT,
      loading: attendanceLoading,
    },
    {
      title: "Chat Groups",
      value: groupsCount || 0,
      icon: MessageSquare,
      description: "Active conversations",
      show: true,
      loading: groupsLoading,
    },
    {
      title: "Total Users",
      value: userCount || 0,
      icon: Users,
      description: "Registered team members",
      show: currentUser?.role === UserRole.ADMIN || currentUser?.role === UserRole.MANAGER,
      loading: usersLoading,
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold" data-testid="page-title">
          Welcome back, {currentUser?.displayName}!
        </h1>
        <p className="text-muted-foreground mt-2">
          Here's an overview of your activity
        </p>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Role:</span>
          <Badge className={roleColors[currentUser?.role || UserRole.EMPLOYEE]}>
            {currentUser?.role}
          </Badge>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Email:</span>
          <span className="text-sm font-medium">{currentUser?.email}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {statCards
          .filter((card) => card.show)
          .map((card) => (
            <Card key={card.title} data-testid={`stat-card-${card.title.toLowerCase().replace(/\s+/g, '-')}`}>
              <CardHeader className="flex flex-row items-center justify-between gap-1 space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {card.title}
                </CardTitle>
                <card.icon className="w-4 h-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                {card.loading ? (
                  <>
                    <Skeleton className="h-8 w-16 mb-2" />
                    <Skeleton className="h-4 w-32" />
                  </>
                ) : (
                  <>
                    <div className="text-2xl font-bold" data-testid={`stat-value-${card.title.toLowerCase().replace(/\s+/g, '-')}`}>
                      {card.value}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {card.description}
                    </p>
                  </>
                )}
              </CardContent>
            </Card>
          ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Quick Actions
          </CardTitle>
          <CardDescription>
            Navigate to key features based on your role
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {currentUser?.role !== UserRole.CLIENT && (
            <a
              href="/attendance"
              className="flex items-center gap-3 p-3 rounded-md hover-elevate active-elevate-2 border"
              data-testid="link-mark-attendance"
            >
              <div className="w-10 h-10 rounded-md bg-primary/10 flex items-center justify-center">
                <Calendar className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="font-medium">Mark Attendance</p>
                <p className="text-sm text-muted-foreground">Check in from office location</p>
              </div>
            </a>
          )}
          <a
            href="/chat"
            className="flex items-center gap-3 p-3 rounded-md hover-elevate active-elevate-2 border"
            data-testid="link-open-chat"
          >
            <div className="w-10 h-10 rounded-md bg-chart-2/10 flex items-center justify-center">
              <MessageSquare className="w-5 h-5 text-chart-2" />
            </div>
            <div>
              <p className="font-medium">Team Chat</p>
              <p className="text-sm text-muted-foreground">Message your team members</p>
            </div>
          </a>
          {(currentUser?.role === UserRole.ADMIN || currentUser?.role === UserRole.MANAGER) && (
            <a
              href="/users"
              className="flex items-center gap-3 p-3 rounded-md hover-elevate active-elevate-2 border"
              data-testid="link-manage-users"
            >
              <div className="w-10 h-10 rounded-md bg-chart-3/10 flex items-center justify-center">
                <Users className="w-5 h-5 text-chart-3" />
              </div>
              <div>
                <p className="font-medium">Manage Users</p>
                <p className="text-sm text-muted-foreground">Create and manage team accounts</p>
              </div>
            </a>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
