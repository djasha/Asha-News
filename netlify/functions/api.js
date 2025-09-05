const { createProxyMiddleware } = require('http-proxy-middleware');

// Netlify function to proxy API requests to your backend
exports.handler = async (event, context) => {
  const { path, httpMethod, headers, body } = event;
  
  // Extract the API path (remove /api prefix)
  const apiPath = path.replace('/api', '');
  
  // Your backend server URL (you'll need to deploy this separately or use serverless functions)
  const backendUrl = process.env.BACKEND_URL || 'http://localhost:3001';
  
  try {
    const response = await fetch(`${backendUrl}/api${apiPath}`, {
      method: httpMethod,
      headers: {
        ...headers,
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
        'Access-Control-Allow-Headers': 'Content-Type',
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
