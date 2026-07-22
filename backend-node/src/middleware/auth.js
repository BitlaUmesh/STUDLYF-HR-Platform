const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || '26a7805549a9746b06e65a3666b410d4ff72ded6d01bde669bfc9606f16249cd';

/**
 * Verifies the access_token cookie and attaches hrId to req.
 * Used on all protected HR routes.
 */
function authenticate(req, res, next) {
  const token = req.cookies?.access_token;

  if (!token) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.hrId = payload.sub;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

/**
 * Verifies the access_token for student routes (issued after GitHub OAuth).
 * Attaches studentId to req.
 */
function authenticateStudent(req, res, next) {
  const token = req.cookies?.student_access_token;

  if (!token) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.studentId = payload.sub;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

module.exports = { authenticate, authenticateStudent };
