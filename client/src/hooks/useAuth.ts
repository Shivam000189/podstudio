import { useEffect, useRef, useCallback } from "react";
import { useUser, useAuth as useClerkAuth, useClerk } from "@clerk/clerk-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import API from "../api/axios";
import { setClerkTokenResolver, clearClerkTokenResolver } from "../api/axios";

export type AuthUser = {
    _id: string;
    id: string;
    name: string;
    email: string;
    avatarUrl?: string;
};

const isClerkEnabled = Boolean(import.meta.env.VITE_CLERK_PUBLISHABLE_KEY);

export function useAuth() {
    const queryClient = useQueryClient();
    const hasSynced = useRef(false);

    // 1. Clerk hook queries (if enabled)
    let clerkUser: any = null;
    let isUserLoaded = true;
    let isSignedIn = false;
    let clerkGetToken: (() => Promise<string | null>) | null = null;
    let clerkSignOut: any = null;

    if (isClerkEnabled) {
        try {
            const userObj = useUser();
            clerkUser = userObj.user;
            isUserLoaded = userObj.isLoaded;
            isSignedIn = Boolean(userObj.isSignedIn);
            
            const authObj = useClerkAuth();
            clerkGetToken = authObj.getToken;
            
            const clerkObj = useClerk();
            clerkSignOut = clerkObj.signOut;
        } catch {
            // Clerk hooks fallback
        }
    }

    // 2. Register / clear the Clerk token resolver on the axios instance
    //    so every API request automatically gets a fresh Clerk session token.
    useEffect(() => {
        if (isSignedIn && clerkGetToken) {
            setClerkTokenResolver(clerkGetToken);
        } else if (isClerkEnabled && isUserLoaded && !isSignedIn) {
            // Clerk loaded but user signed out — clear resolver
            clearClerkTokenResolver();
        }
    }, [isSignedIn, isUserLoaded, clerkGetToken]);

    // 3. Sync Clerk user with local backend database (once per session)
    useEffect(() => {
        if (isSignedIn && clerkUser && clerkGetToken && !hasSynced.current) {
            hasSynced.current = true;
            const syncUser = async () => {
                try {
                    // Get a fresh token before the sync call
                    const token = await clerkGetToken();
                    if (token) {
                        localStorage.setItem('token', token);
                    } else {
                        localStorage.setItem('token', clerkUser.id);
                    }

                    await API.post('/auth/sync', {
                        clerkId: clerkUser.id,
                        name: clerkUser.fullName || clerkUser.username || "PodStudio Creator",
                        email: clerkUser.primaryEmailAddress?.emailAddress || `${clerkUser.id}@clerk.user`,
                        avatarUrl: clerkUser.imageUrl,
                    });
                } catch (err) {
                    console.warn("Could not sync Clerk user to local DB:", err);
                    hasSynced.current = false; // Allow retry
                }
            };
            syncUser();
        }
        // Reset sync flag when user signs out
        if (!isSignedIn) {
            hasSynced.current = false;
        }
    }, [isSignedIn, clerkUser, clerkGetToken]);

    // 4. Local token query (for email/password users only — skip when Clerk is signed in)
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    const { data: localUser, isLoading: isLocalLoading } = useQuery({
        queryKey: ['auth', 'me'],
        queryFn: async (): Promise<AuthUser | null> => {
            const currentToken = localStorage.getItem('token');
            if (!currentToken) return null;
            
            try {
                const response = await API.get('/auth/me');
                const d = response.data.data;
                return {
                    _id: d._id || d.id,
                    id: d._id || d.id,
                    name: d.name,
                    email: d.email,
                    avatarUrl: d.avatarUrl,
                };
            } catch {
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                return null;
            }
        },
        enabled: Boolean(token && !isSignedIn),
        retry: false,
        staleTime: 5 * 60 * 1000,
    });

    // 5. Resolve active authenticated user
    const resolvedUser: AuthUser | null = isSignedIn && clerkUser
        ? {
            _id: clerkUser.id,
            id: clerkUser.id,
            name: clerkUser.fullName || clerkUser.username || "Creator",
            email: clerkUser.primaryEmailAddress?.emailAddress || "",
            avatarUrl: clerkUser.imageUrl,
          }
        : localUser || null;

    // isLoading must be true while Clerk is still initializing,
    // otherwise ProtectedRoute will flash-redirect to /login.
    const isLoading = isClerkEnabled
        ? !isUserLoaded
        : isLocalLoading;
    const isAuthenticated = Boolean(resolvedUser);

    const signOut = useCallback(async () => {
        clearClerkTokenResolver();
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        queryClient.clear();
        if (isSignedIn && clerkSignOut) {
            await clerkSignOut();
        } else {
            window.location.href = '/login';
        }
    }, [isSignedIn, clerkSignOut, queryClient]);

    const getToken = useCallback(async () => {
        if (isSignedIn && clerkGetToken) {
            return await clerkGetToken();
        }
        return localStorage.getItem('token');
    }, [isSignedIn, clerkGetToken]);

    return {
        user: resolvedUser,
        isLoading,
        isAuthenticated,
        signOut,
        getToken,
    };
}

