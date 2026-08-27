import { useQuery } from "@tanstack/react-query";
import API from "../api/axios";

type User = {
    _id: string;
    name: string;
    email: string;
};

export function useAuth() {
    const { data: user, isLoading, isError } = useQuery({
        queryKey: ['auth', 'me'],
        queryFn: async (): Promise<User | null> => {
            const token = localStorage.getItem('token');
            if (!token) return null;
            
            try {
                const response = await API.get('/auth/me');
                return response.data.data;
            } catch {
                localStorage.removeItem('token'); // Clear invalid token
                return null;
            }
        },
        retry: false,
        staleTime: 5 * 60 * 1000,
    });

    return {
        user,
        isLoading,
        isAuthenticated: !!user && !isError,
    };
}