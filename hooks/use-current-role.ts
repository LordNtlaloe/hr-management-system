import { useSession } from "next-auth/react";

export const useCurrentRole = () => {
    const { data, status } = useSession();
    return { role: data?.user?.role, status };
};
