import React, { useState } from 'react';
import { MessageSquare, AlertTriangle, Shield, TrendingUp, Loader2 } from 'lucide-react';

const SocialMediaChecker = () => {
  const [postText, setPostText] = useState('');
  const [platform, setPlatform] = useState('twitter');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState(null);
  const [error, setError] = useState(null);

  const platforms = [
    { value: 'twitter', label: 'Twitter/X' },
    { value: 'facebook', label: 'Facebook' },
    { value: 'instagram', label: 'Instagram' },
    { value: 'tiktok', label: 'TikTok' },
    { value: 'linkedin', label: 'LinkedIn' },
    { value: 'reddit', label: 'Reddit' },
    { value: 'other', label: 'Other' }
  ];

  const analyzePost = async () => {
    if (!postText.trim()) {
      setError('Please enter social media post text to analyze');
      return;
    }

    setIsAnalyzing(true);
    setError(null);

    try {
      const response = await fetch('/api/advanced-fact-check/check-social-post', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          postText,
          platform,
          metadata: {
            timestamp: new Date().toISOString(),
            length: postText.length
          }
        })
      });

      const data = await response.json();

      if (data.success) {
        setAnalysis(data.analysis);
      } else {
        setError(data.error || 'Failed to analyze social media post');
      }
    } catch (err) {
      setError('Network error occurred');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const getRiskLevelColor = (level) => {
    switch (level) {
      case 'LOW':
        return 'text-green-600 bg-green-100 border-green-200';
      case 'MEDIUM':
        return 'text-yellow-600 bg-yellow-100 border-yellow-200';
      case 'HIGH':
        return 'text-orange-600 bg-orange-100 border-orange-200';
      case 'CRITICAL':
        return 'text-red-600 bg-red-100 border-red-200';
      default:
        return 'text-gray-600 bg-gray-100 border-gray-200';
    }
  };

  const getActionColor = (action) => {
    switch (action) {
      case 'NONE':
        return 'text-green-600 bg-green-50';
      case 'VERIFY':
        return 'text-yellow-600 bg-yellow-50';
      case 'FLAG':
        return 'text-orange-600 bg-orange-50';
      case 'REMOVE':
        return 'text-red-600 bg-red-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  const getViralPotentialIcon = (potential) => {
    switch (potential) {
      case 'HIGH':
        return <TrendingUp className="w-4 h-4 text-red-500" />;
      case 'MEDIUM':
        return <TrendingUp className="w-4 h-4 text-yellow-500" />;
      case 'LOW':
        return <TrendingUp className="w-4 h-4 text-green-500" />;
      default:
        return <TrendingUp className="w-4 h-4 text-gray-500" />;
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex items-center space-x-3 mb-6">
          <MessageSquare className="w-6 h-6 text-purple-600" />
          <h2 className="text-xl font-semibold text-gray-900">Social Media Fact Checker</h2>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Platform
            </label>
            <select
              value={platform}
              onChange={(e) => setPlatform(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              {platforms.map((p) => (
                <option key={p.value} value={p.value}>
                  {p.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Post Content *
            </label>
            <textarea
              value={postText}
              onChange={(e) => setPostText(e.target.value)}
              placeholder="Paste the social media post content here for fact-checking..."
              rows={6}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
            <div className="mt-1 text-xs text-gray-500">
              Character count: {postText.length}
            </div>
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}

          <button
            onClick={analyzePost}
            disabled={isAnalyzing || !postText.trim()}
            className="w-full bg-purple-600 text-white py-2 px-4 rounded-md hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
          >
            {isAnalyzing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Analyzing Post...</span>
              </>
            ) : (
              <span>Analyze Post</span>
            )}
          </button>
        </div>
      </div>

      {analysis && (
        <div className="bg-white rounded-lg shadow-sm border p-6 space-y-6">
          <h3 className="text-lg font-semibold text-gray-900">Analysis Results</h3>

          {/* Risk Assessment */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className={`p-4 rounded-lg border ${getRiskLevelColor(analysis.risk_level)}`}>
              <div className="flex items-center space-x-2 mb-2">
                <Shield className="w-5 h-5" />
                <span className="font-medium">Risk Level</span>
              </div>
              <div className="text-lg font-semibold">{analysis.risk_level}</div>
            </div>

            <div className="p-4 rounded-lg border border-gray-200 bg-gray-50">
              <div className="flex items-center space-x-2 mb-2">
                <AlertTriangle className="w-5 h-5 text-gray-600" />
                <span className="font-medium text-gray-700">Misinformation Risk</span>
              </div>
              <div className="text-lg font-semibold text-gray-900">
                {analysis.misinformation_likelihood}%
              </div>
            </div>

            <div className="p-4 rounded-lg border border-gray-200 bg-gray-50">
              <div className="flex items-center space-x-2 mb-2">
                {getViralPotentialIcon(analysis.viral_potential)}
                <span className="font-medium text-gray-700">Viral Potential</span>
              </div>
              <div className="text-lg font-semibold text-gray-900">
                {analysis.viral_potential}
              </div>
            </div>
          </div>

          {/* Claims Found */}
          {analysis.claims_found && analysis.claims_found.length > 0 && (
            <div>
              <h4 className="font-medium text-gray-900 mb-3">Claims Analysis</h4>
              <div className="space-y-3">
                {analysis.claims_found.map((claim, index) => (
                  <div key={index} className="border rounded-lg p-4">
                    <div className="flex items-center space-x-2 mb-2">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        claim.verdict === 'TRUE' ? 'text-green-600 bg-green-50' :
                        claim.verdict === 'FALSE' ? 'text-red-600 bg-red-50' :
                        claim.verdict === 'MISLEADING' ? 'text-orange-600 bg-orange-50' :
                        'text-gray-600 bg-gray-50'
                      }`}>
                        {claim.verdict}
                      </span>
                      <span className="text-xs text-gray-500">
                        Confidence: {claim.confidence}%
                      </span>
                    </div>
                    <p className="text-sm text-gray-900 mb-2 font-medium">{claim.claim}</p>
                    <p className="text-xs text-gray-600">{claim.explanation}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Warning Signs */}
          {analysis.warning_signs && analysis.warning_signs.length > 0 && (
            <div>
              <h4 className="font-medium text-gray-900 mb-3">Warning Signs</h4>
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                <ul className="space-y-1">
                  {analysis.warning_signs.map((sign, index) => (
                    <li key={index} className="text-sm text-orange-700 flex items-center space-x-2">
                      <AlertTriangle className="w-4 h-4" />
                      <span>{sign}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {/* Context Needed */}
          {analysis.context_needed && analysis.context_needed.length > 0 && (
            <div>
              <h4 className="font-medium text-gray-900 mb-3">Additional Context Needed</h4>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <ul className="space-y-1">
                  {analysis.context_needed.map((context, index) => (
                    <li key={index} className="text-sm text-blue-700">
                      • {context}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {/* Recommended Action */}
          <div>
            <h4 className="font-medium text-gray-900 mb-3">Recommended Action</h4>
            <div className={`p-4 rounded-lg border ${getActionColor(analysis.action_recommended)}`}>
              <div className="flex items-center space-x-2">
                <Shield className="w-5 h-5" />
                <span className="font-medium">{analysis.action_recommended}</span>
              </div>
              <div className="mt-2 text-sm">
                {analysis.action_recommended === 'NONE' && 'No action required. Post appears to be factual.'}
                {analysis.action_recommended === 'VERIFY' && 'Verify claims before sharing. Some information may need fact-checking.'}
                {analysis.action_recommended === 'FLAG' && 'Flag for review. Contains potentially misleading information.'}
                {analysis.action_recommended === 'REMOVE' && 'Consider removal. Contains significant misinformation.'}
              </div>
            </div>
          </div>

          {/* Platform-Specific Insights */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <h4 className="font-medium text-gray-900 mb-2">Platform Analysis</h4>
            <p className="text-sm text-gray-700">
              Analysis performed for <span className="font-medium">{platforms.find(p => p.value === platform)?.label}</span> platform.
              Results consider platform-specific misinformation patterns and viral mechanics.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default SocialMediaChecker;
