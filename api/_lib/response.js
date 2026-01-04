// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

// Send JSON response
function json(res, data, status = 200) {
  res.status(status).json(data);
}

// Send error response
function error(res, message, status = 400) {
  res.status(status).json({ error: message });
}

// Handle CORS preflight
function cors(res) {
  Object.entries(corsHeaders).forEach(([key, value]) => {
    res.setHeader(key, value);
  });
}

// Require authentication middleware
async function requireAuth(req, res, getUser) {
  const user = await getUser(req);
  if (!user) {
    error(res, 'Unauthorized', 401);
    return null;
  }
  return user;
}

module.exports = {
  corsHeaders,
  json,
  error,
  cors,
  requireAuth
};
