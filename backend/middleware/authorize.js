// Middleware za provjeru uloge
export const authorizeRole = (role) => (req, res, next) => {
    if (req.user.role !== role && req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Nedozvoljen pristup' });
    }
    next();
};