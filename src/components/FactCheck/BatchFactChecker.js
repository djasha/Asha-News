import React, { useState } from 'react';
import { Upload, Download, CheckCircle, XCircle, AlertTriangle, Clock, FileText, Loader2, Plus, Trash2 } from 'lucide-react';

const BatchFactChecker = () => {
  const [claims, setClaims] = useState([{ id: 1, text: '', context: '' }]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [results, setResults] = useState(null);
  const [report, setReport] = useState(null);
  const [error, setError] = useState(null);

  const addClaim = () => {
    const newId = Math.max(...claims.map(c => c.id)) + 1;
    setClaims([...claims, { id: newId, text: '', context: '' }]);
  };

  const removeClaim = (id) => {
    if (claims.length > 1) {
      setClaims(claims.filter(c => c.id !== id));
    }
  };

  const updateClaim = (id, field, value) => {
    setClaims(claims.map(c => 
      c.id === id ? { ...c, [field]: value } : c
    ));
  };

  const analyzeBatch = async () => {
    const validClaims = claims.filter(c => c.text.trim());
    
    if (validClaims.length === 0) {
      setError('Please enter at least one claim to analyze');
      return;
    }

    if (validClaims.length > 10) {
      setError('Maximum 10 claims per batch analysis');
      return;
    }

    setIsAnalyzing(true);
    setError(null);

    try {
      const response = await fetch('/api/advanced-fact-check/batch-check', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('asha_token')}`
        },
        body: JSON.stringify({
          claims: validClaims
        })
      });

      const data = await response.json();

      if (data.success) {
        setResults(data.results);
        setReport(data.report);
      } else {
        setError(data.error || 'Failed to analyze claims');
      }
    } catch (err) {
      setError('Network error occurred');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const exportResults = () => {
    if (!results) return;

    const exportData = {
      timestamp: new Date().toISOString(),
      total_claims: results.length,
      report,
      results: results.map(r => ({
        claim: r.original_claim.text,
        context: r.original_claim.context,
        verdict: r.analysis?.verdict,
        confidence: r.analysis?.confidence_score,
        explanation: r.analysis?.explanation
      }))
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: 'application/json'
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `fact-check-batch-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
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
        return 'text-green-600 bg-green-50 border-green-200';
      case 'FALSE':
        return 'text-red-600 bg-red-50 border-red-200';
      case 'PARTIALLY_TRUE':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'UNVERIFIED':
        return 'text-gray-600 bg-gray-50 border-gray-200';
      default:
        return 'text-orange-600 bg-orange-50 border-orange-200';
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <FileText className="w-6 h-6 text-indigo-600" />
            <h2 className="text-xl font-semibold text-gray-900">Batch Fact Checker</h2>
          </div>
          <div className="text-sm text-gray-500">
            {claims.filter(c => c.text.trim()).length} / 10 claims
          </div>
        </div>

        <div className="space-y-4">
          {claims.map((claim, index) => (
            <div key={claim.id} className="border rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-medium text-gray-900">Claim {index + 1}</h4>
                {claims.length > 1 && (
                  <button
                    onClick={() => removeClaim(claim.id)}
                    className="text-red-500 hover:text-red-700"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Claim Text *
                </label>
                <textarea
                  value={claim.text}
                  onChange={(e) => updateClaim(claim.id, 'text', e.target.value)}
                  placeholder="Enter the claim to fact-check..."
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Context (Optional)
                </label>
                <input
                  type="text"
                  value={claim.context}
                  onChange={(e) => updateClaim(claim.id, 'context', e.target.value)}
                  placeholder="Additional context for this claim..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>
          ))}

          <button
            onClick={addClaim}
            disabled={claims.length >= 10}
            className="w-full border-2 border-dashed border-gray-300 rounded-lg p-4 text-gray-500 hover:border-indigo-300 hover:text-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
          >
            <Plus className="w-4 h-4" />
            <span>Add Another Claim</span>
          </button>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}

          <button
            onClick={analyzeBatch}
            disabled={isAnalyzing || claims.filter(c => c.text.trim()).length === 0}
            className="w-full bg-indigo-600 text-white py-3 px-4 rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
          >
            {isAnalyzing ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Analyzing Claims...</span>
              </>
            ) : (
              <>
                <Upload className="w-5 h-5" />
                <span>Analyze Batch</span>
              </>
            )}
          </button>
        </div>
      </div>

      {report && (
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Analysis Report</h3>
            <button
              onClick={exportResults}
              className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
            >
              <Download className="w-4 h-4" />
              <span>Export Results</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="text-2xl font-bold text-blue-600">{report.total_claims_checked}</div>
              <div className="text-sm text-blue-700">Total Claims</div>
            </div>
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="text-2xl font-bold text-green-600">{report.verdicts_breakdown?.true || 0}</div>
              <div className="text-sm text-green-700">True Claims</div>
            </div>
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="text-2xl font-bold text-red-600">{report.verdicts_breakdown?.false || 0}</div>
              <div className="text-sm text-red-700">False Claims</div>
            </div>
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
              <div className="text-2xl font-bold text-purple-600">{report.overall_credibility}%</div>
              <div className="text-sm text-purple-700">Overall Credibility</div>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Executive Summary</h4>
              <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded-md">
                {report.executive_summary}
              </p>
            </div>

            {report.high_confidence_findings && report.high_confidence_findings.length > 0 && (
              <div>
                <h4 className="font-medium text-gray-900 mb-2">High Confidence Findings</h4>
                <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                  <ul className="space-y-1">
                    {report.high_confidence_findings.map((finding, index) => (
                      <li key={index} className="text-sm text-green-700">• {finding}</li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

            {report.areas_of_concern && report.areas_of_concern.length > 0 && (
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Areas of Concern</h4>
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <ul className="space-y-1">
                    {report.areas_of_concern.map((concern, index) => (
                      <li key={index} className="text-sm text-red-700">• {concern}</li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

            {report.recommendations && report.recommendations.length > 0 && (
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Recommendations</h4>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <ul className="space-y-1">
                    {report.recommendations.map((rec, index) => (
                      <li key={index} className="text-sm text-blue-700">• {rec}</li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {results && (
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Detailed Results</h3>
          <div className="space-y-4">
            {results.map((result, index) => (
              <div key={index} className="border rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  {result.analysis && getVerdictIcon(result.analysis.verdict)}
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      {result.analysis && (
                        <>
                          <span className={`px-2 py-1 rounded text-xs font-medium border ${getVerdictColor(result.analysis.verdict)}`}>
                            {result.analysis.verdict?.replace('_', ' ')}
                          </span>
                          <span className="text-xs text-gray-500">
                            Confidence: {result.analysis.confidence_score}%
                          </span>
                        </>
                      )}
                    </div>
                    <p className="text-sm font-medium text-gray-900 mb-2">
                      {result.original_claim.text}
                    </p>
                    {result.original_claim.context && (
                      <p className="text-xs text-gray-600 mb-2">
                        Context: {result.original_claim.context}
                      </p>
                    )}
                    {result.analysis?.explanation && (
                      <p className="text-xs text-gray-700">
                        {result.analysis.explanation}
                      </p>
                    )}
                    {result.error && (
                      <p className="text-xs text-red-600">
                        Error: {result.error}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default BatchFactChecker;
