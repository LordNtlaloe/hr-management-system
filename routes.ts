/*
* An array of routes that are accessible to the public
* These routes do not require authentication/
* @type {string[]}
*/
export const publicRoutes = [
    "/",
    "/auth/verify-email"
]

/*
* An array of routes that are used for authentication
* These routes will redirect the logged in user to settings
* @type {string[]}
*/
export const authRoutes = [
    "/auth/sign-in",
    "/auth/sign-up",
    "/auth/error",
    "/auth/password-reset-request",
    "/auth/reset-password"
]


/*
* The prefix for api authentication routes
* These routes will redirect the logged in user to settings
* @type {string[]}
*/
export const apiAuthPrefix = "/api/auth"

export const DEFAULT_LOGIN_REDIRECT = "/settings"