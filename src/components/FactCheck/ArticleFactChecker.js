import React, { useState } from 'react';
import { CheckCircle, AlertTriangle, XCircle, Clock, FileText, Loader2 } from 'lucide-react';
import { buildAuthHeaders } from '../../utils/authHeaders';

const ArticleFactChecker = () => {
  const [articleText, setArticleText] = useState('');
  const [title, setTitle] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState(null);
  const [error, setError] = useState(null);

  const analyzeArticle = async () => {
    if (!articleText.trim()) {
      setError('Please enter article text to analyze');
      return;
    }

    setIsAnalyzing(true);
    setError(null);

    try {
      const response = await fetch('/api/advanced-fact-check/check-article', {
        method: 'POST',
        headers: await buildAuthHeaders({
          'Content-Type': 'application/json'
        }),
        body: JSON.stringify({
          articleText,
          title
        })
      });

      const data = await response.json();

      if (data.success) {
        setAnalysis(data.analysis);
      } else {
        setError(data.error || 'Failed to analyze article');
      }
    } catch (err) {
      setError('Network error occurred');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const getVerdictIcon = (verdict) => {
    switch (verdict) {
      case 'TRUE':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'FALSE':
        return <XCircle className="w-5 h-5 text-red-500" />;
      case 'PARTIALLY_TRUE':
        return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
      case 'UNVERIFIED':
        return <Clock className="w-5 h-5 text-gray-500" />;
      default:
        return <AlertTriangle className="w-5 h-5 text-orange-500" />;
    }
  };

  const getVerdictColor = (verdict) => {
    switch (verdict) {
      case 'TRUE':
        return 'text-green-600 bg-green-50';
      case 'FALSE':
        return 'text-red-600 bg-red-50';
      case 'PARTIALLY_TRUE':
        return 'text-yellow-600 bg-yellow-50';
      case 'UNVERIFIED':
        return 'text-gray-600 bg-gray-50';
      default:
        return 'text-orange-600 bg-orange-50';
    }
  };

  const getReliabilityColor = (score) => {
    if (score >= 80) return 'text-green-600 bg-green-100';
    if (score >= 60) return 'text-yellow-600 bg-yellow-100';
    if (score >= 40) return 'text-orange-600 bg-orange-100';
    return 'text-red-600 bg-red-100';
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex items-center space-x-3 mb-6">
          <FileText className="w-6 h-6 text-blue-600" />
          <h2 className="text-xl font-semibold text-gray-900">Article Fact Checker</h2>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Article Title (Optional)
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter article title..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Article Text *
            </label>
            <textarea
              value={articleText}
              onChange={(e) => setArticleText(e.target.value)}
              placeholder="Paste the article text here for fact-checking analysis..."
              rows={8}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}

          <button
            onClick={analyzeArticle}
            disabled={isAnalyzing || !articleText.trim()}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
          >
            {isAnalyzing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Analyzing Article...</span>
              </>
            ) : (
              <span>Analyze Article</span>
            )}
          </button>
        </div>
      </div>

      {analysis && (
        <div className="bg-white rounded-lg shadow-sm border p-6 space-y-6">
          <h3 className="text-lg font-semibold text-gray-900">Analysis Results</h3>

          {/* Overall Reliability Score */}
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">Overall Reliability</span>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${getReliabilityColor(analysis.overall_reliability)}`}>
                {analysis.overall_reliability}%
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className={`h-2 rounded-full ${analysis.overall_reliability >= 80 ? 'bg-green-500' : 
                  analysis.overall_reliability >= 60 ? 'bg-yellow-500' : 
                  analysis.overall_reliability >= 40 ? 'bg-orange-500' : 'bg-red-500'}`}
                style={{ width: `${analysis.overall_reliability}%` }}
              ></div>
            </div>
          </div>

          {/* Key Claims */}
          {analysis.key_claims && analysis.key_claims.length > 0 && (
            <div>
              <h4 className="font-medium text-gray-900 mb-3">Key Claims Analysis</h4>
              <div className="space-y-3">
                {analysis.key_claims.map((claim, index) => (
                  <div key={index} className="border rounded-lg p-4">
                    <div className="flex items-start space-x-3">
                      {getVerdictIcon(claim.verdict)}
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <span className={`px-2 py-1 rounded text-xs font-medium ${getVerdictColor(claim.verdict)}`}>
                            {claim.verdict.replace('_', ' ')}
                          </span>
                          <span className="text-xs text-gray-500">
                            Confidence: {claim.confidence}%
                          </span>
                        </div>
                        <p className="text-sm text-gray-900 mb-2">{claim.claim}</p>
                        <p className="text-xs text-gray-600">{claim.explanation}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Red Flags */}
          {analysis.red_flags && analysis.red_flags.length > 0 && (
            <div>
              <h4 className="font-medium text-gray-900 mb-3">Red Flags</h4>
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <ul className="space-y-1">
                  {analysis.red_flags.map((flag, index) => (
                    <li key={index} className="text-sm text-red-700 flex items-center space-x-2">
                      <AlertTriangle className="w-4 h-4" />
                      <span>{flag}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {/* Verification Needed */}
          {analysis.verification_needed && analysis.verification_needed.length > 0 && (
            <div>
              <h4 className="font-medium text-gray-900 mb-3">Requires Verification</h4>
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <ul className="space-y-1">
                  {analysis.verification_needed.map((item, index) => (
                    <li key={index} className="text-sm text-yellow-700 flex items-center space-x-2">
                      <Clock className="w-4 h-4" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {/* Bias Indicators */}
          {analysis.bias_indicators && analysis.bias_indicators.length > 0 && (
            <div>
              <h4 className="font-medium text-gray-900 mb-3">Potential Bias Indicators</h4>
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                <ul className="space-y-1">
                  {analysis.bias_indicators.map((indicator, index) => (
                    <li key={index} className="text-sm text-orange-700">
                      • {indicator}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {/* Recommendations */}
          {analysis.recommendations && analysis.recommendations.length > 0 && (
            <div>
              <h4 className="font-medium text-gray-900 mb-3">Recommendations</h4>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <ul className="space-y-1">
                  {analysis.recommendations.map((rec, index) => (
                    <li key={index} className="text-sm text-blue-700">
                      • {rec}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {/* Source Quality */}
          {analysis.source_quality && (
            <div>
              <h4 className="font-medium text-gray-900 mb-3">Source Quality Assessment</h4>
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <p className="text-sm text-gray-700">{analysis.source_quality}</p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ArticleFactChecker;
