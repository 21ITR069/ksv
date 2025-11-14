import { z } from "zod";

// User Roles Enum
export const UserRole = {
  ADMIN: "admin",
  MANAGER: "manager",
  HR: "hr",
  EMPLOYEE: "employee",
  CLIENT: "client",
} as const;

export type UserRoleType = typeof UserRole[keyof typeof UserRole];

// User Schema
export const userSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  displayName: z.string(),
  role: z.enum([UserRole.ADMIN, UserRole.MANAGER, UserRole.HR, UserRole.EMPLOYEE, UserRole.CLIENT]),
  photoURL: z.string().optional(),
  createdAt: z.number(),
  createdBy: z.string().optional(),
});

export const insertUserSchema = userSchema.omit({ id: true, createdAt: true });

export type User = z.infer<typeof userSchema>;
export type InsertUser = z.infer<typeof insertUserSchema>;

// Attendance Schema
export const attendanceSchema = z.object({
  id: z.string(),
  userId: z.string(),
  userName: z.string(),
  userEmail: z.string(),
  timestamp: z.number(),
  date: z.string(), // YYYY-MM-DD format
  year: z.number(),
  month: z.number(),
  coordinates: z.object({
    latitude: z.number(),
    longitude: z.number(),
  }),
  distance: z.number(), // distance from office in km
  status: z.literal("Present"),
});

export const insertAttendanceSchema = attendanceSchema.omit({ id: true });

export type Attendance = z.infer<typeof attendanceSchema>;
export type InsertAttendance = z.infer<typeof insertAttendanceSchema>;

// Chat Group Schema
export const chatGroupSchema = z.object({
  id: z.string(),
  name: z.string(),
  createdBy: z.string(),
  createdByName: z.string(),
  createdAt: z.number(),
  members: z.array(z.string()), // array of user IDs
  memberDetails: z.array(z.object({
    id: z.string(),
    displayName: z.string(),
    email: z.string(),
    role: z.string(),
    photoURL: z.string().optional(),
  })).optional(),
});

export const insertChatGroupSchema = chatGroupSchema.omit({ id: true, createdAt: true });

export type ChatGroup = z.infer<typeof chatGroupSchema>;
export type InsertChatGroup = z.infer<typeof insertChatGroupSchema>;

// Chat Message Schema
export const chatMessageSchema = z.object({
  id: z.string(),
  groupId: z.string(),
  senderId: z.string(),
  senderName: z.string(),
  senderEmail: z.string(),
  message: z.string(),
  timestamp: z.number(),
});

export const insertChatMessageSchema = chatMessageSchema.omit({ id: true, timestamp: true });

export type ChatMessage = z.infer<typeof chatMessageSchema>;
export type InsertChatMessage = z.infer<typeof insertChatMessageSchema>;

// Auth Schemas
export const loginSchema = z.object({
  email: z.string().email("Please enter a valid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export const registerSchema = z.object({
  email: z.string().email("Please enter a valid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  displayName: z.string().min(2, "Name must be at least 2 characters"),
  role: z.enum([UserRole.ADMIN, UserRole.MANAGER, UserRole.HR, UserRole.EMPLOYEE, UserRole.CLIENT]),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;

// Office Location
export const OFFICE_COORDINATES = {
  latitude: 11.2036529,
  longitude: 77.8042980,
};

export const OFFICE_RADIUS_KM = 1;
