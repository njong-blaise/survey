import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { authFetch } from '../services/api';
import { exportToCSV, exportToJSON, generateSummaryReport } from '../utils/exportUtils';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { ArrowLeft, Copy, ExternalLink, Download, FileJson, FileText, BarChart3, PieChart as PieChartIcon, Users, FileQuestion, Zap, MessageSquare, AlertCircle, Loader2 } from 'lucide-react';

const SurveyAnalyticsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [survey, setSurvey] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [responses, setResponses] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [exportLoading, setExportLoading] = useState(false);
  const [chartType, setChartType] = useState('bar'); // 'bar' or 'pie'

  // Colors for charts
  const COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#06b6d4', '#f43f5e', '#84cc16'];

  const fetchAnalytics = useCallback(async () => {
    try {
      // Fetch analytics
      const analyticsResponse = await authFetch(`/responses/survey/${id}/analytics`);

      // Fetch responses for export
      const responsesResponse = await authFetch(`/responses/survey/${id}`);

      if (!analyticsResponse.ok) {
        if (analyticsResponse.status === 404) {
          setError('Survey not found');
        } else if (analyticsResponse.status === 403) {
          setError('Access denied');
        } else {
          setError('Failed to load analytics');
        }
        return;
      }

      const analyticsData = await analyticsResponse.json();
      setSurvey(analyticsData.survey);
      setAnalytics(analyticsData.questions);

      // Fetch responses if analytics request succeeded
      if (responsesResponse.ok) {
        const responsesData = await responsesResponse.json();
        setResponses(responsesData);
      }
    } catch (error) {
      console.error('Error fetching analytics:', error);
      setError(error.message || 'Failed to load analytics');
      if (error.message?.includes('log in')) {
        navigate('/login');
      }
    } finally {
      setLoading(false);
    }
  }, [id, navigate]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  const handleExportCSV = () => {
    if (!survey || !responses) return;
    setExportLoading(true);
    try {
      exportToCSV(survey, responses);
    } finally {
      setExportLoading(false);
    }
  };

  const handleExportJSON = () => {
    if (!survey || !responses) return;
    setExportLoading(true);
    try {
      exportToJSON(survey, responses);
    } finally {
      setExportLoading(false);
    }
  };

  const handleGenerateReport = () => {
    if (!survey || !responses) return;
    const report = generateSummaryReport(survey, responses);
    if (report) {
      const reportBlob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(reportBlob);
      
      link.setAttribute('href', url);
      link.setAttribute('download', `${survey.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_summary_report.json`);
      link.style.visibility = 'hidden';
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const renderMultipleChoiceChart = (question, analytics) => {
    const total = analytics.total_answers;
    const maxCount = Math.max(...Object.values(analytics.option_counts));
    
    // Prepare data for charts
    const chartData = Object.entries(analytics.option_counts).map(([option, count]) => ({
      name: option,
      value: count,
      percentage: total > 0 ? (count / total) * 100 : 0
    }));

    const renderBarChart = () => (
      <div className="space-y-md">
        {chartData.map((item, index) => {
          const barWidth = maxCount > 0 ? (item.value / maxCount) * 100 : 0;
          return (
            <div key={item.name} className="space-y-sm">
              <div className="flex justify-between items-center text-small">
                <span className="text-body font-medium">{item.name}</span>
                <span className="text-secondary">
                  {item.value} ({item.percentage.toFixed(1)}%)
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-8 relative overflow-hidden">
                <div
                  className="bg-primary-600 h-full rounded-full transition-all duration-500 ease-out"
                  style={{ width: `${barWidth}%` }}
                ></div>
              </div>
            </div>
          );
        })}
      </div>
    );

    const renderPieChart = () => (
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, percentage }) => `${name}: ${percentage.toFixed(1)}%`}
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip formatter={(value) => [`${value} responses`, 'Count']} />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </div>
    );

    return (
      <div className="space-y-lg">
        {/* Chart type toggle */}
        <div className="flex gap-sm">
          <button
            onClick={() => setChartType('bar')}
            className={`flex items-center gap-2 px-4 py-2 text-sm rounded-lg transition-all duration-200 ${
              chartType === 'bar' 
                ? 'bg-primary-600 text-white shadow-md hover:bg-primary-700' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <BarChart3 size={16} />
            Bar Chart
          </button>
          <button
            onClick={() => setChartType('pie')}
            className={`flex items-center gap-2 px-4 py-2 text-sm rounded-lg transition-all duration-200 ${
              chartType === 'pie' 
                ? 'bg-primary-600 text-white shadow-md hover:bg-primary-700' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <PieChartIcon size={16} />
            Pie Chart
          </button>
        </div>

        {/* Render selected chart */}
        {chartType === 'bar' ? renderBarChart() : renderPieChart()}
      </div>
    );
  };

  const renderCheckboxChart = (question, analytics) => {
    const total = analytics.total_answers;
    const maxCount = Math.max(...Object.values(analytics.option_counts));
    
    // Prepare data for charts
    const chartData = Object.entries(analytics.option_counts).map(([option, count]) => ({
      name: option,
      value: count,
      percentage: total > 0 ? (count / total) * 100 : 0
    }));

    const renderBarChart = () => (
      <div className="space-y-md">
        {chartData.map((item, index) => {
          const barWidth = maxCount > 0 ? (item.value / maxCount) * 100 : 0;
          return (
            <div key={item.name} className="space-y-sm">
              <div className="flex justify-between items-center text-small">
                <span className="text-body font-medium">{item.name}</span>
                <span className="text-secondary">
                  {item.value} selections ({item.percentage.toFixed(1)}%)
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-8 relative overflow-hidden">
                <div
                  className="bg-success-600 h-full rounded-full transition-all duration-500 ease-out"
                  style={{ width: `${barWidth}%` }}
                ></div>
              </div>
            </div>
          );
        })}
      </div>
    );

    const renderPieChart = () => (
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, percentage }) => `${name}: ${percentage.toFixed(1)}%`}
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip formatter={(value) => [`${value} selections`, 'Count']} />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </div>
    );

    return (
      <div className="space-y-lg">
        {/* Chart type toggle */}
        <div className="flex gap-sm">
          <button
            onClick={() => setChartType('bar')}
            className={`flex items-center gap-2 px-4 py-2 text-sm rounded-lg transition-all duration-200 ${
              chartType === 'bar' 
                ? 'bg-success-600 text-white shadow-md hover:bg-success-700' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <BarChart3 size={16} />
            Bar Chart
          </button>
          <button
            onClick={() => setChartType('pie')}
            className={`flex items-center gap-2 px-4 py-2 text-sm rounded-lg transition-all duration-200 ${
              chartType === 'pie' 
                ? 'bg-success-600 text-white shadow-md hover:bg-success-700' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <PieChartIcon size={16} />
            Pie Chart
          </button>
        </div>

        {/* Render selected chart */}
        {chartType === 'bar' ? renderBarChart() : renderPieChart()}
      </div>
    );
  };

  const renderTextAnswers = (question, analytics) => {
    const answers = analytics.answers || [];

    if (answers.length === 0) {
      return (
        <div className="text-center py-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
            <MessageSquare className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="heading-3">No responses yet</h3>
          <p className="text-body">This question hasn't received any responses yet.</p>
        </div>
      );
    }

    return (
      <div className="space-y-md max-h-64 overflow-y-auto">
        {answers.map((answer, index) => (
          <div key={index} className="card p-md hover:shadow-md transition-shadow">
            <p className="text-body">{answer}</p>
          </div>
        ))}
      </div>
    );
  };

  const renderQuestionAnalytics = (question) => {
    const analytics = question.analytics;

    return (
      <div className="card animate-fade-in">
        <div className="card-body">
          <div className="flex justify-between items-center mb-6">
            <h3 className="heading-3">{question.question_text}</h3>
            <div className="flex items-center gap-sm">
              <span className="text-small text-secondary">
                {analytics.total_answers} responses
              </span>
              {question.is_required && (
                <span className="px-2 py-1 bg-warning-100 text-warning-600 rounded-full text-xs font-medium">
                  Required
                </span>
              )}
            </div>
          </div>

          <div className="space-y-md">
            <div className="text-small font-medium text-secondary mb-4">
              {question.question_type.replace('_', ' ').toUpperCase()}
            </div>

            {analytics.type === 'multiple_choice' && renderMultipleChoiceChart(question, analytics)}
            {analytics.type === 'checkbox' && renderCheckboxChart(question, analytics)}
            {analytics.type === 'text' && renderTextAnswers(question, analytics)}
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="app-layout">
        <div className="flex items-center justify-center flex-1">
          <div className="loading">
            <div className="text-center">
              <div className="inline-flex items-center justify-center">
                <Loader2 className="w-12 h-12 text-primary-600 animate-spin" />
              </div>
              <p className="text-body mt-4">Loading analytics...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="app-layout">
        <div className="flex items-center justify-center flex-1">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-24 h-24 bg-error-100 rounded-full mb-4">
              <AlertCircle className="w-12 h-12 text-error-600" />
            </div>
            <h2 className="heading-2 mb-4">Error</h2>
            <p className="text-body mb-8">{error}</p>
            <button
              onClick={() => navigate('/dashboard')}
              className="btn btn-primary"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="app-layout">
      <div className="main-content">
        <div className="container">
          {/* Header */}
          <div className="card mb-8">
            <div className="card-body">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-sm">
                  <button
                        onClick={() => navigate('/dashboard')}
                        className="btn btn-ghost hover:bg-gray-100"
                  >
                    <ArrowLeft className="w-5 h-5" />
                  </button>
                  <div>
                    <h1 className="heading-2">Survey Analytics</h1>
                    <p className="text-body">{survey?.title}</p>
                  </div>
                </div>
                <div className="flex gap-sm flex-wrap">
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(`${window.location.origin}/survey/${id}`);
                      alert('Survey link copied to clipboard!');
                    }}
                    className="btn btn-secondary flex items-center gap-2"
                  >
                    <Copy size={16} />
                    Copy Link
                  </button>
                  <Link
                    to={`/survey/${id}`}
                    className="btn btn-secondary flex items-center gap-2"
                  >
                    <ExternalLink size={16} />
                    View Survey
                  </Link>
                  <button
                    onClick={handleExportCSV}
                    disabled={exportLoading || !responses || responses.length === 0}
                    className="btn btn-success flex items-center gap-2"
                  >
                    <Download size={16} />
                    Export CSV
                  </button>
                  <button
                    onClick={handleExportJSON}
                    disabled={exportLoading || !responses || responses.length === 0}
                    className="btn btn-success flex items-center gap-2"
                  >
                    <FileJson size={16} />
                    Export JSON
                  </button>
                  <button
                    onClick={handleGenerateReport}
                    disabled={exportLoading || !responses || responses.length === 0}
                    className="btn btn-primary flex items-center gap-2"
                  >
                    <FileText size={16} />
                    Generate Report
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Overview Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-lg mb-8">
            <div className="card hover:shadow-lg transition-shadow">
              <div className="card-body text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-100 rounded-full mb-4">
                  <Users className="w-8 h-8 text-primary-600" />
                </div>
                <h3 className="heading-3 mb-2">Total Responses</h3>
                <p className="text-2xl font-bold text-primary-600">{survey?.total_responses || 0}</p>
              </div>
            </div>

            <div className="card hover:shadow-lg transition-shadow">
              <div className="card-body text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-success-100 rounded-full mb-4">
                  <FileQuestion className="w-8 h-8 text-success-600" />
                </div>
                <h3 className="heading-3 mb-2">Total Questions</h3>
                <p className="text-2xl font-bold text-success-600">{analytics?.length || 0}</p>
              </div>
            </div>

            <div className="card hover:shadow-lg transition-shadow">
              <div className="card-body text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-warning-100 rounded-full mb-4">
                  <Zap className="w-8 h-8 text-warning-600" />
                </div>
                <h3 className="heading-3 mb-2">Response Rate</h3>
                <p className="text-2xl font-bold text-warning-600">
                  {analytics?.length > 0 ? '100%' : '0%'}
                </p>
              </div>
            </div>
          </div>

          {/* Question Analytics */}
          <div className="space-y-lg">
            {analytics?.length === 0 ? (
              <div className="text-center py-16">
                <div className="inline-flex items-center justify-center w-24 h-24 bg-gray-100 rounded-full mb-4">
                  <FileQuestion className="w-12 h-12 text-gray-400" />
                </div>
                <h3 className="heading-3">No questions found</h3>
                <p className="text-body">This survey doesn't have any questions yet.</p>
              </div>
            ) : (
              analytics.map((question) => (
                <div key={question.id}>
                  {renderQuestionAnalytics(question)}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SurveyAnalyticsPage;
