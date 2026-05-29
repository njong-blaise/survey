import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useAdmin } from '../context/AdminContext';
import { authFetch } from '../services/api';
import { 
  FileText, 
  Plus, 
  BarChart3, 
  Trash2, 
  Edit, 
  Share2, 
  LogOut, 
  Moon, 
  Sun, 
  Menu,
  X,
  Users,
  TrendingUp,
  Calendar,
  AlertCircle,
  Copy,
  Check,
  Shield
} from 'lucide-react';

const DashboardPage = () => {
  const [surveys, setSurveys] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [copiedSurveyId, setCopiedSurveyId] = useState(null);
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { isAdmin, canAccessUsers, canAccessSurveys } = useAdmin();

  const fetchSurveys = async () => {
    try {
      setError('');
      const response = await authFetch('/surveys');

      if (!response.ok) {
        throw new Error('Failed to fetch surveys');
      }

      const data = await response.json();
      setSurveys(data);
    } catch (error) {
      console.error('Error fetching surveys:', error);
      const message = String(error?.message || '');
      if (message.includes('No valid session') || message.includes('Session expired')) {
        setError('Your session expired. Please log in again.');
      } else if (message.includes('Failed to fetch')) {
        setError('Cannot connect to API server. Make sure backend is running on http://localhost:5000.');
      } else {
        setError('Failed to load surveys');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSurveys();
  }, []);

  const handleDeleteSurvey = async (surveyId) => {
    if (window.confirm('Are you sure you want to delete this survey? This action cannot be undone.')) {
      try {
        const response = await authFetch(`/surveys/${surveyId}`, {
          method: 'DELETE',
        });

        if (!response.ok) {
          throw new Error('Failed to delete survey');
        }

        setSurveys(surveys.filter(survey => survey.id !== surveyId));
      } catch (error) {
        console.error('Error deleting survey:', error);
        alert('Failed to delete survey. Please try again.');
      }
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const handleCopySurveyLink = async (surveyId) => {
    const surveyLink = `${window.location.origin}/survey/${surveyId}`;
    
    try {
      await navigator.clipboard.writeText(surveyLink);
      setCopiedSurveyId(surveyId);
      
      // Reset the copied state after 3 seconds
      setTimeout(() => {
        setCopiedSurveyId(null);
      }, 3000);
    } catch (error) {
      console.error('Failed to copy link:', error);
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = surveyLink;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      
      setCopiedSurveyId(surveyId);
      setTimeout(() => {
        setCopiedSurveyId(null);
      }, 3000);
    }
  };

  if (loading) {
    return (
      <div className="app-layout">
        <div className="flex items-center justify-center flex-1">
          <div className="loading">
            <div className="text-center">
              <div className="inline-block animate-spin">
                <div className="w-12 h-12 border-4 border-primary-200 border-t-primary-600 rounded-full"></div>
              </div>
              <p className="text-body mt-4">Loading your surveys...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="app-layout">
      <button 
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-primary rounded-md shadow-lg"
        onClick={() => setSidebarOpen(!sidebarOpen)}
      >
        {sidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
      </button>

      <div className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="mb-8">
          <h2 className="heading-3 mb-6">Survey App</h2>
          <div className="text-small text-secondary mb-8">
            Welcome back, {user?.email}
          </div>
        </div>

        <nav className="nav">
          <Link to="/dashboard" className="nav-link active">
            <BarChart3 className="w-5 h-5" />
            Dashboard
          </Link>
          
          <Link to="/create-survey" className="nav-link">
            <Plus className="w-5 h-5" />
            Create Survey
          </Link>
          
          <Link to="/responses" className="nav-link">
            <Users className="w-5 h-5" />
            Responses
          </Link>
          
          {isAdmin && (
            <Link to="/admin" className="nav-link bg-primary-100 text-primary-700">
              <Shield className="w-5 h-5" />
              Admin Panel
            </Link>
          )}
          
          <button
            onClick={toggleTheme}
            className="nav-link"
          >
            {theme === 'light' ? (
              <Moon className="w-5 h-5" />
            ) : (
              <Sun className="w-5 h-5" />
            )}
            {theme === 'light' ? 'Dark Mode' : 'Light Mode'}
          </button>
          
          <button
            onClick={logout}
            className="nav-link text-red-600 hover:text-red-700"
          >
            <LogOut className="w-5 h-5" />
            Logout
          </button>
        </nav>
      </div>

      <div className="main-content">
        <div className="container">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="heading-1">Dashboard</h1>
              <p className="text-body mt-2">Manage your surveys and view responses</p>
            </div>
            <Link
              to="/create-survey"
              className="btn btn-primary flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              Create Survey
            </Link>
          </div>

          {error && (
            <div className="error mb-6 animate-slide-in flex items-center gap-2">
              <AlertCircle className="h-4 w-4" />
              {error}
            </div>
          )}

          {surveys.length === 0 ? (
            <div className="text-center py-16">
              <div className="inline-block">
                <FileText className="w-24 h-24 text-secondary mb-4" />
              </div>
              <h2 className="heading-2 mb-4">No surveys yet</h2>
              <p className="text-body mb-8">Create your first survey to start collecting responses</p>
              <Link
                to="/create-survey"
                className="btn btn-primary flex items-center gap-2"
              >
                <Plus className="w-5 h-5" />
                Create Your First Survey
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-lg">
              {surveys.map((survey) => (
                <div key={survey.id} className="card animate-fade-in">
                  <div className="card-body">
                    <div className="flex justify-between items-start mb-4">
                      <h3 className="heading-3 flex-1 mr-4">
                        {survey.title}
                      </h3>
                      <div className="flex gap-sm">
                        <div className={`px-2 py-1 text-xs font-medium rounded-full ${
                          survey.is_public ? 'bg-success-100 text-success-600' : 'bg-warning-100 text-warning-600'
                        }`}>
                          {survey.is_public ? 'Public' : 'Private'}
                        </div>
                      </div>
                    </div>
                    
                    <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                      {survey.description || 'No description provided'}
                    </p>
                    
                    <div className="flex justify-between items-center text-sm text-gray-500 mb-6">
                      <div className="flex items-center gap-sm">
                        <Calendar className="w-4 h-4 mr-1" />
                        Created {formatDate(survey.created_at)}
                      </div>
                      <div className="flex items-center gap-sm">
                        <Users className="w-4 h-4 mr-1" />
                        {survey.response_count || 0} responses
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex gap-sm">
                    <Link
                      to={`/survey/${survey.id}`}
                      className="btn btn-secondary flex-1 flex items-center justify-center gap-2"
                    >
                      <FileText className="w-4 h-4" />
                      View
                    </Link>
                    
                    <Link
                      to={`/survey/${survey.id}/analytics`}
                      className="btn btn-ghost flex items-center justify-center gap-2"
                    >
                      <BarChart3 className="w-4 h-4" />
                      Analytics
                    </Link>
                    
                    <button
                      onClick={() => handleCopySurveyLink(survey.id)}
                      className="btn btn-ghost flex items-center justify-center gap-2 relative"
                      title="Copy survey link"
                    >
                      {copiedSurveyId === survey.id ? (
                        <Check className="w-4 h-4 text-success-600" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                      {copiedSurveyId === survey.id && (
                        <span className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-success-600 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
                          Copied!
                        </span>
                      )}
                    </button>
                    
                    <button
                      onClick={() => handleDeleteSurvey(survey.id)}
                      className="btn btn-danger flex items-center justify-center gap-2"
                    >
                      <Trash2 className="w-4 h-4" />
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
