'use client';
// Thin wrapper — delegates to AuthContext so every component that calls
// useUser() continues to work without changes.
export { useAuth as useUser } from '@/context/AuthContext';
