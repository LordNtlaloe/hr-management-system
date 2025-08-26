"use client"
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { useTheme } from '@/context/ThemeContext';
import { useCurrentUser } from '@/hooks/use-current-user';

const EmployeeManagementHero = () => {
  const { theme, toggleTheme } = useTheme(); // Changed from setTheme to toggleTheme
  const user = useCurrentUser();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      {/* Header */}
      <header className="flex justify-between items-center px-6 py-4 md:px-12 bg-white dark:bg-gray-950 shadow-sm">
        <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
          Ministry Of Police<span className="text-gray-800 dark:text-gray-200">&nbsp;And Public Safety</span>
        </div>

        <div className="flex items-center gap-4">
          {/* Dark Mode Toggle - Updated to use toggleTheme */}
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme} // Simplified since toggleTheme already handles the logic
            aria-label="Toggle theme"
          >
            {theme === 'dark' ? (
              <SunIcon className="h-5 w-5" />
            ) : (
              <MoonIcon className="h-5 w-5" />
            )}
          </Button>

          {/* Conditional Button */}
          {user ? (
            <Button asChild variant="default" className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800">
              <Link href="/admin">Dashboard</Link>
            </Button>
          ) : (
            <Button asChild variant="default" className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800">
              <Link href="/login">Login</Link>
            </Button>
          )}
        </div>
      </header>

      {/* Hero Content */}
      <section className="flex flex-col items-center justify-center text-center px-4 py-20 md:py-32">
        <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-6">
          {user ? (
            <>Welcome, <span className="text-blue-600 dark:text-blue-400">{user.name || 'User'}</span>!</>
          ) : (
            <>Streamline Your <span className="text-blue-600 dark:text-blue-400">Workforce</span></>
          )}
        </h1>

        <p className="text-lg md:text-xl text-gray-600 dark:text-gray-300 max-w-2xl mb-8">
          {user
            ? "Access your dashboard to manage your team efficiently."
            : "Secure employee management system for modern organizations."
          }
        </p>

        <Button
          asChild
          size="lg"
          className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800 px-8 py-6 text-lg"
        >
          <Link href={user ? "/admin" : "/login"}>
            {user ? "Go to Dashboard" : "Login"}
          </Link>
        </Button>
      </section>
    </div>
  );
};

// Icons for theme toggle
const SunIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M12 7.75V4.5" />
  </svg>
);

const MoonIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z" />
  </svg>
);

export default EmployeeManagementHero;