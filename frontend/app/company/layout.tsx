import LogoutButton from "@/components/LogoutButton";

export default function CompanyLayout({ children }: { children: React.ReactNode }) {
    return (
        <div>
            <LogoutButton link="/company/login" />
            {children}
        </div>
    );
}