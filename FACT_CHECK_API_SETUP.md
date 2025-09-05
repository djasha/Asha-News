# Fact Check API Setup Guide

## Current Issue
The Google Fact Check Tools API integration is not working properly. The API key may not be configured correctly or the service may have limitations.

## Google Fact Check Tools API Setup

### 1. Get Google Fact Check API Key

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the **Fact Check Tools API**:
   - Go to APIs & Services > Library
   - Search for "Fact Check Tools API"
   - Click on it and press "Enable"
4. Create credentials:
   - Go to APIs & Services > Credentials
   - Click "Create Credentials" > "API Key"
   - Copy the API key

### 2. Configure Environment Variables

Add to your `.env` file:
```bash
GOOGLE_FACTCHECK_API_KEY=your_api_key_here
```

### 3. Test the API

Test the API directly:
```bash
curl "https://factchecktools.googleapis.com/v1alpha1/claims:search?key=YOUR_API_KEY&query=covid&pageSize=5"
```

## Alternative Fact-Checking APIs

### 1. **ClaimBuster API** (Recommended)
- **URL**: https://idir.uta.edu/claimbuster/
- **Features**: Real-time claim detection and fact-checking
- **Pricing**: Free tier available
- **Setup**:
  ```bash
  # Add to .env
  CLAIMBUSTER_API_KEY=your_key_here
  ```
- **Example Usage**:
  ```javascript
  const response = await fetch('https://idir.uta.edu/claimbuster/api/v2/score/text/', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': process.env.CLAIMBUSTER_API_KEY
    },
    body: JSON.stringify({ input_text: "Your claim here" })
  });
  ```

### 2. **Full Fact API**
- **URL**: https://fullfact.org/about/api/
- **Features**: UK-focused fact-checking database
- **Pricing**: Free for non-commercial use
- **Setup**: Contact Full Fact for API access

### 3. **PolitiFact API**
- **URL**: https://www.politifact.com/api/
- **Features**: Political fact-checking database
- **Pricing**: Contact for pricing
- **Note**: Limited public API access

### 4. **Snopes API**
- **URL**: https://www.snopes.com/api/
- **Features**: General fact-checking database
- **Pricing**: Commercial licensing required
- **Note**: No public API currently available

### 5. **AFP Fact Check**
- **URL**: https://factcheck.afp.com/
- **Features**: International fact-checking
- **API**: Limited public access
- **Alternative**: RSS feeds available

## Recommended Implementation Strategy

### Phase 1: Fix Google Fact Check API
1. Verify API key configuration
2. Test API endpoints directly
3. Check quota limits and billing

### Phase 2: Implement ClaimBuster as Fallback
```javascript
// Add to googleFactCheckService.js
async searchWithFallback(query) {
  try {
    // Try Google Fact Check first
    return await this.searchClaims(query);
  } catch (error) {
    console.log('Google API failed, trying ClaimBuster...');
    return await this.searchWithClaimBuster(query);
  }
}

async searchWithClaimBuster(query) {
  const response = await fetch('https://idir.uta.edu/claimbuster/api/v2/score/text/', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': process.env.CLAIMBUSTER_API_KEY
    },
    body: JSON.stringify({ input_text: query })
  });
  
  if (!response.ok) {
    throw new Error('ClaimBuster API error');
  }
  
  return await response.json();
}
```

### Phase 3: Add Multiple Sources
Create a unified fact-checking service that aggregates results from multiple APIs:

```javascript
class UnifiedFactCheckService {
  async searchAllSources(query) {
    const results = await Promise.allSettled([
      this.searchGoogle(query),
      this.searchClaimBuster(query),
      this.searchFullFact(query)
    ]);
    
    return this.aggregateResults(results);
  }
}
```

## Free Alternatives for Development

### 1. **Mock Data Service**
Create a mock service with sample fact-check data for development:

```javascript
const mockFactChecks = [
  {
    text: "Sample claim about COVID-19",
    claimant: "Social Media",
    claimDate: "2025-09-04T00:00:00Z",
    claimReview: [{
      publisher: { name: "Mock Fact Checker", site: "example.com" },
      url: "https://example.com/fact-check",
      title: "Fact Check: Sample COVID-19 Claim",
      reviewDate: "2025-09-04T00:00:00Z",
      textualRating: "False",
      languageCode: "en"
    }]
  }
];
```

### 2. **RSS Feed Scraping**
Scrape RSS feeds from fact-checking organizations:
- Snopes RSS: `https://www.snopes.com/feed/`
- PolitiFact RSS: `https://www.politifact.com/rss/statements/`
- Full Fact RSS: `https://fullfact.org/feeds/latest.xml`

### 3. **Wikipedia Fact-Check Categories**
Use Wikipedia's API to search fact-checking categories:
```javascript
const wikiUrl = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(query)}`;
```

## Troubleshooting Current Integration

### Check API Key Configuration
```bash
# In your server directory
node -e "console.log('API Key:', process.env.GOOGLE_FACTCHECK_API_KEY ? 'Set' : 'Not Set')"
```

### Test Direct API Call
```bash
curl -X GET "http://localhost:3001/api/fact-check/google-search?query=test&pageSize=3" -v
```

### Check Server Logs
Look for specific error messages in the server console when making API calls.

## Next Steps

1. **Immediate**: Fix the Google Fact Check API configuration
2. **Short-term**: Implement ClaimBuster as a fallback
3. **Long-term**: Build a multi-source fact-checking aggregator
4. **Alternative**: Use mock data for development and demo purposes

## API Rate Limits & Costs

- **Google Fact Check**: Free tier with quotas
- **ClaimBuster**: Free tier: 100 requests/day
- **Full Fact**: Contact for limits
- **PolitiFact**: Commercial pricing

## Security Considerations

- Store API keys in environment variables
- Use server-side API calls to protect keys
- Implement rate limiting on your endpoints
- Cache results to reduce API calls
