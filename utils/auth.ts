export const requireAuth = (req: Request) => {
  const authHeader = req.headers.get('authorization');
  let token = authHeader?.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;

  if (!token) {
    const url = new URL(req.url);
    token = url.searchParams.get('token');
  }
  
  if (!token) {
    return {
      authorized: false,
      actor: null,
      error: 'Missing or invalid authorization header',
    };
  }

  // Use environment variable, fallback to a dev token if not set
  const expectedToken = process.env.NEXT_PUBLIC_API_SECRET_KEY || 'default-secret-token-for-dev';

  if (token !== expectedToken) {
    return {
      authorized: false,
      actor: null,
      error: 'Invalid token',
    };
  }

  // In V1, a valid token implies 'testuser'.
  return {
    authorized: true,
    actor: 'testuser',
  };
};
