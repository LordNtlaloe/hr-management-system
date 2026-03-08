import { SidebarProvider } from "@/context/SidebarContext";

interface ProtectedLayoutProps {
    children: React.ReactNode
}

const ProtectedLayout = ({ children }: ProtectedLayoutProps) => {
    return (
        <SidebarProvider>
            {children}
        </SidebarProvider>

    )
}

export default ProtectedLayout;