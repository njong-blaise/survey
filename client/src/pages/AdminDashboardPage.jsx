import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authFetch } from '../services/api';
import { 
  Users, 
  FileText, 
  BarChart3, 
  Settings, 
  Activity,
  Shield,
  UserCheck,
  UserX,
  Eye,
  Trash2,
  Search,
  Filter,
  Download,
  RefreshCw,
  AlertCircle,
  TrendingUp,
  Calendar,
  Mail
} from 'lucide-react';

const AdminDashboardPage = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [surveys, setSurveys] = useState([]);
  const [responses, setResponses] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('overview');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [userRoleFilter, setUserRoleFilter] = useState('all');
  const [userStatusFilter, setUserStatusFilter] = useState('all');

  useEffect(() => {
    fetchAdminData();
  }, []);

  useEffect(() => {
    if (activeTab === 'users') {
      fetchUsers();
    } else if (activeTab === 'responses') {
      fetchResponses();
    } else if (activeTab === 'questions') {
      fetchQuestions();
    } else if (activeTab === 'activity') {
      fetchActivity();
    }
  }, [activeTab]);

  useEffect(() => {
    if (activeTab === 'surveys') {
      fetchSurveys();
    }
  }, [activeTab, searchTerm, filterStatus]);

  const fetchAdminData = async () => {
    try {
      const response = await authFetch('/admin/stats');
      if (!response.ok) throw new Error('Failed to fetch admin data');
      
      const data = await response.json();
      setStats(data);
    } catch (error) {
      console.error('Admin data fetch error:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const params = new URLSearchParams({
        search: searchTerm,
        role: userRoleFilter,
        status: userStatusFilter
      });

      const response = await authFetch(`/admin/users?${params}`);
      if (!response.ok) {
        let details = '';
        try {
          const errorData = await response.json();
          details = errorData?.error ? `: ${errorData.error}` : '';
        } catch {
          // ignore parse errors
        }
        throw new Error(`Failed to fetch users (${response.status})${details}`);
      }
      
      const data = await response.json();
      setUsers(data);
    } catch (error) {
      console.error('Users fetch error:', error);
      setError(error.message);
    }
  };

  useEffect(() => {
    if (activeTab === 'users') {
      fetchUsers();
    }
  }, [searchTerm, userRoleFilter, userStatusFilter]);

  const fetchSurveys = async () => {
    try {
      const params = new URLSearchParams({
        search: searchTerm,
        status: filterStatus
      });
      
      const response = await authFetch(`/admin/surveys?${params}`);
      if (!response.ok) throw new Error('Failed to fetch surveys');
      
      const data = await response.json();
      setSurveys(data.surveys || []);
    } catch (error) {
      console.error('Surveys fetch error:', error);
      setError(error.message);
    }
  };

  const fetchActivity = async () => {
    try {
      const response = await authFetch('/admin/activity');
      if (!response.ok) throw new Error('Failed to fetch activity');
      
      const data = await response.json();
      setActivities(data.activities || []);
    } catch (error) {
      console.error('Activity fetch error:', error);
      setError(error.message);
    }
  };

  const fetchResponses = async () => {
    try {
      const response = await authFetch('/admin/responses');
      if (!response.ok) throw new Error('Failed to fetch responses');
      
      const data = await response.json();
      setResponses(data.responses || []);
    } catch (error) {
      console.error('Responses fetch error:', error);
      setError(error.message);
    }
  };

  const fetchQuestions = async () => {
    try {
      const response = await authFetch('/admin/questions');
      if (!response.ok) throw new Error('Failed to fetch questions');
      
      const data = await response.json();
      setQuestions(data.questions || []);
    } catch (error) {
      console.error('Questions fetch error:', error);
      setError(error.message);
    }
  };

  const updateUserRole = async (userId, newRole) => {
    try {
      const response = await authFetch(`/admin/users/${userId}/role`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: newRole, is_active: true })
      });

      if (!response.ok) throw new Error('Failed to update user role');
      
      fetchUsers(); // Refresh users list
    } catch (error) {
      console.error('Update role error:', error);
      setError(error.message);
    }
  };

  const deleteSurvey = async (surveyId) => {
    if (!confirm('Are you sure you want to delete this survey? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await authFetch(`/admin/surveys/${surveyId}`, {
        method: 'DELETE'
      });

      if (!response.ok) throw new Error('Failed to delete survey');
      
      fetchSurveys(); // Refresh surveys list
    } catch (error) {
      console.error('Delete survey error:', error);
      setError(error.message);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getRoleBadgeColor = (role) => {
    switch (role) {
      case 'super_admin': return 'bg-red-100 text-red-800';
      case 'admin': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getRoleIcon = (role) => {
    switch (role) {
      case 'super_admin': return <Shield className="w-4 h-4" />;
      case 'admin': return <Settings className="w-4 h-4" />;
      default: return <Users className="w-4 h-4" />;
    }
  };

  if (loading) {
    return (
      <div className="app-layout">
        <div className="main-content">
          <div className="container">
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin">
                <div className="w-12 h-12 border-4 border-primary-200 border-t-primary-600 rounded-full"></div>
              </div>
            </div>
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
                <div>
                  <h1 className="heading-2 mb-2">Admin Dashboard</h1>
                  <p className="text-secondary">Manage users, surveys, and system settings</p>
                </div>
                <Link to="/dashboard" className="btn btn-secondary">
                  Back to Dashboard
                </Link>
              </div>
            </div>
          </div>

          {/* Error Alert */}
          {error && (
            <div className="card bg-error-50 border-error-200 mb-6">
              <div className="card-body">
                <div className="flex items-center gap-sm">
                  <AlertCircle className="w-5 h-5 text-error-600" />
                  <span className="text-error-800">{error}</span>
                </div>
              </div>
            </div>
          )}

          {/* Navigation Tabs */}
          <div className="card mb-8">
            <div className="card-body">
              <div className="flex gap-sm border-b border-gray-200">
                {['overview', 'users', 'surveys', 'responses', 'questions', 'activity'].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`px-4 py-3 border-b-2 font-medium text-sm transition-colors ${
                      activeTab === tab
                        ? 'border-primary-600 text-primary-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    {tab.charAt(0).toUpperCase() + tab.slice(1)}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Overview Tab */}
          {activeTab === 'overview' && stats && (
            <div className="space-y-8">
              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="card">
                  <div className="card-body">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-small text-secondary mb-1">Total Users</p>
                        <p className="heading-3">{stats.stats.totalUsers}</p>
                      </div>
                      <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                        <Users className="w-6 h-6 text-blue-600" />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="card">
                  <div className="card-body">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-small text-secondary mb-1">Total Surveys</p>
                        <p className="heading-3">{stats.stats.totalSurveys}</p>
                      </div>
                      <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                        <FileText className="w-6 h-6 text-green-600" />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="card">
                  <div className="card-body">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-small text-secondary mb-1">Total Responses</p>
                        <p className="heading-3">{stats.stats.totalResponses}</p>
                      </div>
                      <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                        <BarChart3 className="w-6 h-6 text-purple-600" />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="card">
                  <div className="card-body">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-small text-secondary mb-1">Active Users</p>
                        <p className="heading-3">{stats.stats.activeUsers}</p>
                      </div>
                      <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                        <UserCheck className="w-6 h-6 text-orange-600" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Role Distribution */}
              <div className="card">
                <div className="card-body">
                  <h3 className="heading-3 mb-4">User Role Distribution</h3>
                  <div className="space-y-4">
                    {Object.entries(stats.stats.roleDistribution).map(([role, count]) => (
                      <div key={role} className="flex items-center justify-between">
                        <div className="flex items-center gap-sm">
                          {getRoleIcon(role)}
                          <span className="font-medium capitalize">{role.replace('_', ' ')}</span>
                        </div>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRoleBadgeColor(role)}`}>
                          {count}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Recent Activity */}
              <div className="card">
                <div className="card-body">
                  <h3 className="heading-3 mb-4">Recent Activity</h3>
                  <div className="space-y-3">
                    {stats.recentActivity?.slice(0, 5).map((activity, index) => (
                      <div key={index} className="flex items-center justify-between py-2 border-b border-gray-100">
                        <div className="flex items-center gap-sm">
                          <Activity className="w-4 h-4 text-gray-400" />
                          <div>
                            <p className="text-small font-medium">{activity.action.replace('_', ' ')}</p>
                            <p className="text-xs text-secondary">{activity.profiles?.email}</p>
                          </div>
                        </div>
                        <span className="text-xs text-secondary">{formatDate(activity.created_at)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Users Tab */}
          {activeTab === 'users' && (
            <div className="space-y-6">
              <div className="card">
                <div className="card-body">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="heading-3">All Users</h3>
                    <div className="flex items-center gap-sm">
                      <div className="relative">
                        <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                        <input
                          type="text"
                          placeholder="Search users..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="form-input pl-10"
                        />
                      </div>
                      <select
                        value={userRoleFilter}
                        onChange={(e) => setUserRoleFilter(e.target.value)}
                        className="form-select"
                      >
                        <option value="all">All Roles</option>
                        <option value="user">Users</option>
                        <option value="admin">Admins</option>
                        <option value="super_admin">Super Admins</option>
                      </select>
                      <select
                        value={userStatusFilter}
                        onChange={(e) => setUserStatusFilter(e.target.value)}
                        className="form-select"
                      >
                        <option value="all">All Statuses</option>
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                      </select>
                    </div>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-gray-200">
                          <th className="text-left py-3 px-4 text-small font-medium text-secondary">User</th>
                          <th className="text-left py-3 px-4 text-small font-medium text-secondary">Role</th>
                          <th className="text-left py-3 px-4 text-small font-medium text-secondary">Status</th>
                          <th className="text-left py-3 px-4 text-small font-medium text-secondary">Surveys</th>
                          <th className="text-left py-3 px-4 text-small font-medium text-secondary">Joined</th>
                          <th className="text-left py-3 px-4 text-small font-medium text-secondary">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {users.map((user) => (
                          <tr key={user.id} className="border-b border-gray-100">
                            <td className="py-3 px-4">
                              <div className="flex items-center gap-sm">
                                <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                                  <Mail className="w-4 h-4 text-gray-600" />
                                </div>
                                <div>
                                  <p className="text-small font-medium">{user.email}</p>
                                  <p className="text-xs text-secondary">ID: {user.id.slice(0, 8)}...</p>
                                </div>
                              </div>
                            </td>
                            <td className="py-3 px-4">
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRoleBadgeColor(user.role)}`}>
                                {user.role.replace('_', ' ')}
                              </span>
                            </td>
                            <td className="py-3 px-4">
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                user.is_active ? 'bg-success-100 text-success-800' : 'bg-error-100 text-error-800'
                              }`}>
                                {user.is_active ? 'Active' : 'Inactive'}
                              </span>
                            </td>
                            <td className="py-3 px-4">
                              <span className="text-small">{user.surveys?.[0]?.count || 0}</span>
                            </td>
                            <td className="py-3 px-4">
                              <span className="text-small text-secondary">{formatDate(user.created_at)}</span>
                            </td>
                            <td className="py-3 px-4">
                              <select
                                value={user.role}
                                onChange={(e) => updateUserRole(user.id, e.target.value)}
                                className="form-select text-xs"
                              >
                                <option value="user">User</option>
                                <option value="admin">Admin</option>
                                <option value="super_admin">Super Admin</option>
                              </select>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Surveys Tab */}
          {activeTab === 'surveys' && (
            <div className="space-y-6">
              <div className="card">
                <div className="card-body">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="heading-3">All Surveys</h3>
                    <div className="flex items-center gap-sm">
                      <div className="relative">
                        <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                        <input
                          type="text"
                          placeholder="Search surveys..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="form-input pl-10"
                        />
                      </div>
                      <select
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value)}
                        className="form-select"
                      >
                        <option value="all">All Surveys</option>
                        <option value="public">Public</option>
                        <option value="private">Private</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-4">
                    {surveys.map((survey) => (
                      <div key={survey.id} className="card">
                        <div className="card-body">
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <h4 className="heading-4 mb-2">{survey.title}</h4>
                              <p className="text-small text-secondary mb-3">{survey.description || 'No description'}</p>
                              <div className="flex items-center gap-sm text-small text-secondary">
                                <span>By: {survey.profiles?.email}</span>
                                <span>•</span>
                                <span>{survey.questions?.[0]?.count || 0} questions</span>
                                <span>•</span>
                                <span>{survey.responses?.[0]?.count || 0} responses</span>
                                <span>•</span>
                                <span className={`px-2 py-1 rounded-full text-xs ${
                                  survey.is_public ? 'bg-success-100 text-success-800' : 'bg-gray-100 text-gray-800'
                                }`}>
                                  {survey.is_public ? 'Public' : 'Private'}
                                </span>
                              </div>
                            </div>
                            <div className="flex gap-sm">
                              <Link
                                to={`/survey/${survey.id}`}
                                className="btn btn-ghost"
                              >
                                <Eye className="w-4 h-4" />
                              </Link>
                              <Link
                                to={`/survey/${survey.id}/analytics`}
                                className="btn btn-ghost"
                              >
                                <BarChart3 className="w-4 h-4" />
                              </Link>
                              <button
                                onClick={() => deleteSurvey(survey.id)}
                                className="btn btn-danger"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Responses Tab */}
          {activeTab === 'responses' && (
            <div className="space-y-6">
              <div className="card">
                <div className="card-body">
                  <h3 className="heading-3 mb-4">All Responses</h3>
                  <div className="space-y-3">
                    {responses.map((response, index) => (
                      <div key={index} className="card">
                        <div className="card-body">
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <p className="text-small font-medium">Survey: {response.surveys?.title}</p>
                              <p className="text-xs text-secondary">Submitted: {formatDate(response.submitted_at)}</p>
                              {response.respondent_email && (
                                <p className="text-xs text-secondary">Email: {response.respondent_email}</p>
                              )}
                            </div>
                            <span className={`px-2 py-1 rounded-full text-xs ${
                              response.surveys?.is_public ? 'bg-success-100 text-success-800' : 'bg-gray-100 text-gray-800'
                            }`}>
                              {response.surveys?.is_public ? 'Public' : 'Private'}
                            </span>
                          </div>
                          {response.answers && response.answers.length > 0 && (
                            <div className="mt-3 space-y-2">
                              <p className="text-xs font-medium text-secondary">Answers:</p>
                              {response.answers.map((answer, idx) => (
                                <div key={idx} className="text-xs p-2 bg-gray-50 rounded">
                                  <p className="font-medium">{answer.questions?.question_text}</p>
                                  <p className="text-secondary">{answer.answer_text || JSON.stringify(answer.answer_options)}</p>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Questions Tab */}
          {activeTab === 'questions' && (
            <div className="space-y-6">
              <div className="card">
                <div className="card-body">
                  <h3 className="heading-3 mb-4">All Questions</h3>
                  <div className="space-y-3">
                    {questions.map((question, index) => (
                      <div key={index} className="card">
                        <div className="card-body">
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <p className="text-small font-medium">{question.question_text}</p>
                              <p className="text-xs text-secondary">Survey: {question.surveys?.title}</p>
                              <p className="text-xs text-secondary">Type: {question.question_type.replace('_', ' ')}</p>
                            </div>
                            <span className={`px-2 py-1 rounded-full text-xs ${
                              question.is_required ? 'bg-warning-100 text-warning-800' : 'bg-gray-100 text-gray-800'
                            }`}>
                              {question.is_required ? 'Required' : 'Optional'}
                            </span>
                          </div>
                          {question.options && question.options.length > 0 && (
                            <div className="mt-3">
                              <p className="text-xs font-medium text-secondary mb-1">Options:</p>
                              <div className="flex flex-wrap gap-1">
                                {question.options.map((option, idx) => (
                                  <span key={idx} className="text-xs px-2 py-1 bg-gray-100 rounded">
                                    {option}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Activity Tab */}
          {activeTab === 'activity' && (
            <div className="space-y-6">
              <div className="card">
                <div className="card-body">
                  <h3 className="heading-3 mb-4">Admin Activity Log</h3>
                  <div className="space-y-3">
                    {activities.map((activity, index) => (
                      <div key={index} className="flex items-start gap-sm p-3 bg-gray-50 rounded-lg">
                        <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0">
                          <Activity className="w-4 h-4 text-primary-600" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-1">
                            <p className="text-small font-medium">{activity.action.replace('_', ' ')}</p>
                            <span className="text-xs text-secondary">{formatDate(activity.created_at)}</span>
                          </div>
                          <p className="text-xs text-secondary mb-2">By: {activity.profiles?.email}</p>
                          {activity.target_type && (
                            <p className="text-xs text-secondary">
                              Target: {activity.target_type} {activity.target_id ? `(${activity.target_id.slice(0, 8)}...)` : ''}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboardPage;
