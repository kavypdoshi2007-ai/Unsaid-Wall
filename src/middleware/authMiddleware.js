const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET ;
if (!JWT_SECRET) {
  console.error("FATAL ERROR: JWT_SECRET is not defined.");
  process.exit(1);
}

module.exports = (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ error: "Access denied. Token missing or malformed." });
        }

        const token = authHeader.split(' ')[1];
        
        const decodedClaims = jwt.verify(token, JWT_SECRET);
        
        const resolvedId = decodedClaims.id || decodedClaims.userId || decodedClaims.user_id;
        
        req.userData = {
            id: resolvedId, 
            role: decodedClaims.role
        };

        const newSlidingToken = jwt.sign(
            { id: resolvedId, role: decodedClaims.role },
            JWT_SECRET,
            { expiresIn: '1h' } 
        );
        
        res.setHeader('X-Updated-Token', newSlidingToken);
        res.setHeader('Access-Control-Expose-Headers', 'X-Updated-Token');

        next();
    } catch (error) {
        return res.status(401).json({ error: "Authentication token is invalid or expired." });
    }
};