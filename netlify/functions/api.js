// Netlify function to proxy API requests to your backend
exports.handler = async (event, context) => {
  const { path, httpMethod, headers, body } = event;

  if (httpMethod === 'OPTIONS') {
    return {
      statusCode: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      },
      body: '',
    };
  }

  // Supports both:
  // /.netlify/functions/api/<route>
  // /api/<route>
  const strippedPath = path
    .replace(/^\/\.netlify\/functions\/api/, '')
    .replace(/^\/api/, '');
  const apiPath = strippedPath.startsWith('/') || strippedPath === '' ? strippedPath : `/${strippedPath}`;
  
  // Your backend server URL (you'll need to deploy this separately or use serverless functions)
  const backendUrl = process.env.BACKEND_URL || 'http://localhost:3001';
  
  try {
    const response = await fetch(`${backendUrl}/api${apiPath}`, {
      method: httpMethod,
      headers: {
        ...Object.fromEntries(
          Object.entries(headers || {}).filter(([key]) => key.toLowerCase() !== 'host')
        ),
        'Content-Type': 'application/json',
      },
      body: httpMethod !== 'GET' ? body : undefined,
    });
    
    const data = await response.text();
    
    return {
      statusCode: response.status,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      },
      body: data,
    };
  } catch (error) {
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({ error: 'Internal server error', message: error.message }),
    };
  }
};
