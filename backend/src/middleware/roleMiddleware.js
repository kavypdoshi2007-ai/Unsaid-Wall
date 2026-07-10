// src/middleware/roleMiddleware.js

/**
 * Middleware to restrict access based on UserRole enum values.
 * @param {string[]} allowedRoles - Array of roles allowed to access the route ('user', 'coach', 'admin', 'guest')
 */
module.exports = (allowedRoles = []) => {
    return (req, res, next) => {
        // 1. Handle Guest Access explicitly
        if (allowedRoles.includes('guest')) {
            // If the user happens to have a token anyway, let's keep running normally
            if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
                // Let the route continue, but they aren't forced to be an authenticated user
                return next();
            }
            // If they are purely unauthenticated guests, bypass and proceed
            return next();
        }

        // 2. For protected routes, check if authMiddleware successfully ran
        if (!req.userData) {
            return res.status(401).json({ error: "Authentication required." });
        }

        // 3. Extract the role from the decoded JWT payload
        const userRole = req.userData.role; 

        // 4. Validate if the user's role is permitted
        if (!allowedRoles.includes(userRole)) {
            return res.status(403).json({ 
                error: `Forbidden. This action requires one of the following roles: [${allowedRoles.join(', ')}]` 
            });
        }

        // Everything checks out! Pass control to the controller
        next();
    };
};