import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MapPin, CheckCircle, XCircle, Clock, Loader2, Calendar as CalendarIcon } from "lucide-react";
import { getCurrentLocation, getDistanceFromOffice, isWithinOfficeRadius } from "@/lib/location";
import { OFFICE_RADIUS_KM, type Attendance } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { ref, push, get, query, orderByChild } from "firebase/database";
import { realtimeDB } from "@/lib/firebase";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";

export default function AttendancePage() {
  const { currentUser } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [location, setLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [distance, setDistance] = useState<number | null>(null);
  const [locationError, setLocationError] = useState<string>("");
  const [checkingLocation, setCheckingLocation] = useState(false);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => currentYear - i);

  // Check location on mount
  useEffect(() => {
    checkLocation();
  }, []);

  const checkLocation = async () => {
    setCheckingLocation(true);
    setLocationError("");
    try {
      const currentLocation = await getCurrentLocation();
      setLocation(currentLocation);
      const dist = getDistanceFromOffice(currentLocation.latitude, currentLocation.longitude);
      setDistance(dist);
    } catch (error: any) {
      setLocationError(error.message || "Failed to get location");
      toast({
        title: "Location Error",
        description: "Please enable location services to mark attendance",
        variant: "destructive",
      });
    } finally {
      setCheckingLocation(false);
    }
  };

  // Fetch attendance records for selected year
  const { data: attendanceRecords, isLoading: recordsLoading } = useQuery({
    queryKey: ["/api/attendance", currentUser?.id, selectedYear],
    queryFn: async () => {
      if (!currentUser) return [];
      
      const records: Attendance[] = [];
      const yearRef = ref(realtimeDB, `attendance/${currentUser.id}/${selectedYear}`);
      const snapshot = await get(yearRef);
      
      if (snapshot.exists()) {
        const yearData = snapshot.val();
        for (const month in yearData) {
          for (const recordId in yearData[month]) {
            records.push({ ...yearData[month][recordId], id: recordId });
          }
        }
      }
      
      return records.sort((a, b) => b.timestamp - a.timestamp);
    },
  });

  // Check if already marked today
  const { data: markedToday } = useQuery({
    queryKey: ["/api/attendance/today", currentUser?.id],
    queryFn: async () => {
      if (!currentUser) return false;
      
      const now = new Date();
      const dateStr = now.toISOString().split('T')[0];
      const year = now.getFullYear();
      const month = now.getMonth() + 1;
      
      const monthRef = ref(realtimeDB, `attendance/${currentUser.id}/${year}/${month}`);
      const snapshot = await get(monthRef);
      
      if (snapshot.exists()) {
        const records = snapshot.val();
        return Object.values(records).some((record: any) => record.date === dateStr);
      }
      
      return false;
    },
  });

  const markAttendanceMutation = useMutation({
    mutationFn: async () => {
      if (!currentUser || !location) {
        throw new Error("User or location not available");
      }

      const now = new Date();
      const year = now.getFullYear();
      const month = now.getMonth() + 1;
      const dateStr = now.toISOString().split('T')[0];

      const attendance: Omit<Attendance, 'id'> = {
        userId: currentUser.id,
        userName: currentUser.displayName,
        userEmail: currentUser.email,
        timestamp: Date.now(),
        date: dateStr,
        year,
        month,
        coordinates: {
          latitude: location.latitude,
          longitude: location.longitude,
        },
        distance: getDistanceFromOffice(location.latitude, location.longitude),
        status: "Present",
      };

      const attendanceRef = ref(realtimeDB, `attendance/${currentUser.id}/${year}/${month}`);
      await push(attendanceRef, attendance);
    },
    onSuccess: () => {
      toast({
        title: "Attendance Marked!",
        description: "Your attendance has been recorded successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/attendance"] });
      queryClient.invalidateQueries({ queryKey: ["/api/attendance/today"] });
      queryClient.invalidateQueries({ queryKey: ["/api/attendance/count"] });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to mark attendance",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const isWithinRadius = location ? isWithinOfficeRadius(location.latitude, location.longitude, OFFICE_RADIUS_KM) : false;
  const canMarkAttendance = isWithinRadius && !markedToday && !markAttendanceMutation.isPending;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold" data-testid="page-title">Attendance</h1>
        <p className="text-muted-foreground mt-2">
          Track your office attendance with geolocation
        </p>
      </div>

      {/* Location Status Banner */}
      <Alert className={isWithinRadius ? "border-green-500 bg-green-50 dark:bg-green-950/20" : "border-destructive bg-destructive/10"}>
        <div className="flex items-start gap-3">
          {checkingLocation ? (
            <Loader2 className="w-5 h-5 animate-spin mt-0.5" />
          ) : isWithinRadius ? (
            <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
          ) : (
            <XCircle className="w-5 h-5 text-destructive mt-0.5" />
          )}
          <div className="flex-1">
            <AlertDescription className="text-sm">
              {checkingLocation ? (
                "Checking your location..."
              ) : locationError ? (
                <span className="text-destructive font-medium">{locationError}</span>
              ) : isWithinRadius ? (
                <div>
                  <span className="text-green-700 dark:text-green-400 font-medium">
                    You are within {OFFICE_RADIUS_KM}km of the office
                  </span>
                  {distance !== null && (
                    <span className="text-muted-foreground ml-2">
                      ({distance.toFixed(2)}km away)
                    </span>
                  )}
                </div>
              ) : (
                <div>
                  <span className="text-destructive font-medium">
                    You are outside the office area
                  </span>
                  {distance !== null && (
                    <span className="text-muted-foreground ml-2">
                      ({distance.toFixed(2)}km away)
                    </span>
                  )}
                </div>
              )}
            </AlertDescription>
            <Button
              variant="ghost"
              size="sm"
              onClick={checkLocation}
              className="mt-2 h-8"
              disabled={checkingLocation}
              data-testid="button-refresh-location"
            >
              <MapPin className="w-4 h-4 mr-2" />
              Refresh Location
            </Button>
          </div>
        </div>
      </Alert>

      {/* Mark Attendance Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Mark Today's Attendance
          </CardTitle>
          <CardDescription>
            You must be within {OFFICE_RADIUS_KM}km of the office to mark attendance
          </CardDescription>
        </CardHeader>
        <CardContent>
          {markedToday ? (
            <div className="flex items-center gap-3 p-4 rounded-md bg-muted">
              <CheckCircle className="w-6 h-6 text-green-600" />
              <div>
                <p className="font-medium">Attendance already marked today</p>
                <p className="text-sm text-muted-foreground">
                  You've successfully checked in for {new Date().toLocaleDateString()}
                </p>
              </div>
            </div>
          ) : (
            <Button
              onClick={() => markAttendanceMutation.mutate()}
              disabled={!canMarkAttendance}
              className="w-full md:w-auto"
              size="lg"
              data-testid="button-mark-attendance"
            >
              {markAttendanceMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Marking Attendance...
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Mark Attendance
                </>
              )}
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Attendance History */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-4 space-y-0 pb-4">
          <div>
            <CardTitle>Attendance History</CardTitle>
            <CardDescription>View your attendance records by year</CardDescription>
          </div>
          <Select value={selectedYear} onValueChange={setSelectedYear}>
            <SelectTrigger className="w-32" data-testid="select-year">
              <SelectValue placeholder="Select year" />
            </SelectTrigger>
            <SelectContent>
              {years.map((year) => (
                <SelectItem key={year} value={year.toString()}>
                  {year}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardHeader>
        <CardContent>
          {recordsLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center gap-4 p-3 border rounded-md">
                  <Skeleton className="w-12 h-12 rounded-md" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-48" />
                  </div>
                </div>
              ))}
            </div>
          ) : !attendanceRecords || attendanceRecords.length === 0 ? (
            <div className="text-center py-12">
              <CalendarIcon className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No attendance records for {selectedYear}</p>
            </div>
          ) : (
            <div className="space-y-2">
              {attendanceRecords.map((record) => (
                <div
                  key={record.id}
                  className="flex items-center gap-4 p-3 border rounded-md hover-elevate"
                  data-testid={`attendance-record-${record.id}`}
                >
                  <div className="w-12 h-12 rounded-md bg-primary/10 flex flex-col items-center justify-center">
                    <span className="text-xs text-muted-foreground">
                      {new Date(record.timestamp).toLocaleDateString('en-US', { month: 'short' }).toUpperCase()}
                    </span>
                    <span className="text-lg font-bold text-primary">
                      {new Date(record.timestamp).getDate()}
                    </span>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium">
                        {new Date(record.timestamp).toLocaleDateString('en-US', { 
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </p>
                      <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 dark:bg-green-950 dark:text-green-400">
                        {record.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      {new Date(record.timestamp).toLocaleTimeString()} • {record.distance.toFixed(2)}km from office
                    </p>
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
