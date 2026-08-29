import { useEffect } from "react";
import { useUser, useAuth as useClerkAuth, useClerk } from "@clerk/clerk-react";
import { useQuery } from "@tanstack/react-query";
import API from "../api/axios";

export type AuthUser = {
    _id: string;
    id: string;
    name: string;
    email: string;
    avatarUrl?: string;
};

const isClerkEnabled = Boolean(import.meta.env.VITE_CLERK_PUBLISHABLE_KEY);

export function useAuth() {
    // 1. Clerk hook queries (if enabled)
    let clerkUser: any = null;
    let isUserLoaded = true;
    let isSignedIn = false;
    let clerkGetToken: any = null;
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

    // Sync Clerk user with local backend database
    useEffect(() => {
        if (isSignedIn && clerkUser && clerkGetToken) {
            const syncUser = async () => {
                try {
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
                }
            };
            syncUser();
        }
    }, [isSignedIn, clerkUser, clerkGetToken]);

    // 2. Local token query (for email/password users)
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

    // 3. Resolve active authenticated user
    const resolvedUser: AuthUser | null = isSignedIn && clerkUser
        ? {
            _id: clerkUser.id,
            id: clerkUser.id,
            name: clerkUser.fullName || clerkUser.username || "Creator",
            email: clerkUser.primaryEmailAddress?.emailAddress || "",
            avatarUrl: clerkUser.imageUrl,
          }
        : localUser || null;

    const isLoading = isClerkEnabled ? (!isUserLoaded && Boolean(!resolvedUser && token)) : isLocalLoading;
    const isAuthenticated = Boolean(resolvedUser);

    return {
        user: resolvedUser,
        isLoading,
        isAuthenticated,
        signOut: async () => {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            if (isSignedIn && clerkSignOut) {
                await clerkSignOut();
            } else {
                window.location.href = '/login';
            }
        },
        getToken: async () => {
            if (isSignedIn && clerkGetToken) {
                return await clerkGetToken();
            }
            return localStorage.getItem('token');
        },
    };
}
