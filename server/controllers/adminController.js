const supabase = require('../config/supabase');

// Get all users (admin only)
const getAllUsers = async (req, res) => {
  try {
    const { search = '', role = 'all', status = 'all' } = req.query;

    let query = supabase
      .from('profiles')
      .select(`
        id,
        email,
        role,
        is_active,
        created_at,
        updated_at,
        surveys: surveys(count),
        responses: responses(count)
      `)
      .order('created_at', { ascending: false });

    if (search) {
      query = query.ilike('email', `%${search}%`);
    }

    if (role !== 'all') {
      query = query.eq('role', role);
    }

    if (status === 'active') {
      query = query.eq('is_active', true);
    } else if (status === 'inactive') {
      query = query.eq('is_active', false);
    }

    const { data: users, error, code, details, message } = await query;

    if (error) {
      // If the implicit FK to responses isn't present, fall back to users without responses(count)
      if (code === 'PGRST200') {
        const { data: fallbackUsers, error: fallbackError } = await supabase
          .from('profiles')
          .select(`
            id,
            email,
            role,
            is_active,
            created_at,
            updated_at,
            surveys: surveys(count)
          `)
          .order('created_at', { ascending: false });

        if (fallbackError) {
          console.error('Get all users fallback error:', fallbackError);
          return res.status(500).json({ error: 'Failed to fetch users' });
        }

        return res.json(fallbackUsers);
      }

      console.error('Get all users error:', { code, details, message });
      throw error;
    }

    res.json(users);
  } catch (error) {
    console.error('Get all users error (outer):', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
};

// Update user role (super admin only)
const updateUserRole = async (req, res) => {
  try {
    const { userId } = req.params;
    const { role, is_active } = req.body;

    // Validate role
    const validRoles = ['user', 'admin', 'super_admin'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({ error: 'Invalid role' });
    }

    // Prevent super admin from demoting themselves
    if (req.user.id === userId && role !== 'super_admin') {
      return res.status(400).json({ error: 'Cannot change your own super admin role' });
    }

    const { data: profile, error } = await supabase
      .from('profiles')
      .update({ role, is_active, updated_at: new Date().toISOString() })
      .eq('id', userId)
      .select()
      .single();

    if (error) throw error;

    // Log the action
    await supabase
      .from('admin_activity_log')
      .insert({
        admin_id: req.user.id,
        action: 'USER_ROLE_UPDATED',
        target_type: 'user',
        target_id: userId,
        details: { old_role: profile.role, new_role: role, is_active },
        ip_address: req.ip,
        user_agent: req.get('User-Agent')
      });

    res.json(profile);
  } catch (error) {
    console.error('Update user role error:', error);
    res.status(500).json({ error: 'Failed to update user role' });
  }
};

// Get all surveys (admin only)
const getAllSurveys = async (req, res) => {
  try {
    const { page = 1, limit = 20, search = '', status = 'all', includeDetails = false } = req.query;
    const offset = (page - 1) * limit;

    let query = supabase
      .from('surveys')
      .select(`
        *,
        profiles!inner(email, role),
        questions(count),
        responses(count)
      `, { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    // Apply search filter
    if (search) {
      query = query.ilike('title', `%${search}%`);
    }

    // Apply status filter
    if (status === 'public') {
      query = query.eq('is_public', true);
    } else if (status === 'private') {
      query = query.eq('is_public', false);
    }

    const { data: surveys, error, count } = await query;

    if (error) throw error;

    // If includeDetails is true, fetch detailed information for each survey
    let detailedSurveys = surveys;
    if (includeDetails === 'true' && surveys) {
      detailedSurveys = await Promise.all(
        surveys.map(async (survey) => {
          const [questionsData, responsesData] = await Promise.all([
            supabase
              .from('questions')
              .select('*')
              .eq('survey_id', survey.id)
              .order('order_index'),
            supabase
              .from('responses')
              .select('*, answers(*)')
              .eq('survey_id', survey.id)
          ]);

          return {
            ...survey,
            questions: questionsData.data || [],
            responses: responsesData.data || []
          };
        })
      );
    }

    res.json({
      surveys: detailedSurveys,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count,
        pages: Math.ceil(count / limit)
      }
    });
  } catch (error) {
    console.error('Get all surveys error:', error);
    res.status(500).json({ error: 'Failed to fetch surveys' });
  }
};

// Delete any survey (super admin only)
const deleteAnySurvey = async (req, res) => {
  try {
    const { surveyId } = req.params;

    // Get survey details before deletion for logging
    const { data: survey, error: fetchError } = await supabase
      .from('surveys')
      .select('title, user_id')
      .eq('id', surveyId)
      .single();

    if (fetchError) throw fetchError;

    const { error } = await supabase
      .from('surveys')
      .delete()
      .eq('id', surveyId);

    if (error) throw error;

    // Log the action
    await supabase
      .from('admin_activity_log')
      .insert({
        admin_id: req.user.id,
        action: 'SURVEY_DELETED',
        target_type: 'survey',
        target_id: surveyId,
        details: { 
          survey_title: survey.title,
          survey_owner_id: survey.user_id 
        },
        ip_address: req.ip,
        user_agent: req.get('User-Agent')
      });

    res.json({ message: 'Survey deleted successfully' });
  } catch (error) {
    console.error('Delete survey error:', error);
    res.status(500).json({ error: 'Failed to delete survey' });
  }
};

// Get admin activity log
const getActivityLog = async (req, res) => {
  try {
    const { page = 1, limit = 50, action = '', admin_id = '' } = req.query;
    const offset = (page - 1) * limit;

    let query = supabase
      .from('admin_activity_log')
      .select(`
        *,
        profiles!inner(email, role)
      `, { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    // Apply filters
    if (action) {
      query = query.eq('action', action);
    }
    if (admin_id) {
      query = query.eq('admin_id', admin_id);
    }

    const { data: activities, error, count } = await query;

    if (error) throw error;

    res.json({
      activities,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count,
        pages: Math.ceil(count / limit)
      }
    });
  } catch (error) {
    console.error('Get activity log error:', error);
    res.status(500).json({ error: 'Failed to fetch activity log' });
  }
};

// Get all responses (super admin only)
const getAllResponses = async (req, res) => {
  try {
    const { page = 1, limit = 50, surveyId = '' } = req.query;
    const offset = (page - 1) * limit;

    let query = supabase
      .from('responses')
      .select(`
        *,
        surveys!inner(title, is_public, profiles!inner(email)),
        answers(*, questions!inner(question_text, question_type))
      `, { count: 'exact' })
      .order('submitted_at', { ascending: false })
      .range(offset, offset + limit - 1);

    // Filter by survey if specified
    if (surveyId) {
      query = query.eq('survey_id', surveyId);
    }

    const { data: responses, error, count } = await query;

    if (error) throw error;

    res.json({
      responses,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count,
        pages: Math.ceil(count / limit)
      }
    });
  } catch (error) {
    console.error('Get all responses error:', error);
    res.status(500).json({ error: 'Failed to fetch responses' });
  }
};

// Get all questions (super admin only)
const getAllQuestions = async (req, res) => {
  try {
    const { page = 1, limit = 100, surveyId = '', questionType = '' } = req.query;
    const offset = (page - 1) * limit;

    let query = supabase
      .from('questions')
      .select(`
        *,
        surveys!inner(title, profiles!inner(email))
      `, { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    // Filter by survey if specified
    if (surveyId) {
      query = query.eq('survey_id', surveyId);
    }

    // Filter by question type if specified
    if (questionType) {
      query = query.eq('question_type', questionType);
    }

    const { data: questions, error, count } = await query;

    if (error) throw error;

    res.json({
      questions,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count,
        pages: Math.ceil(count / limit)
      }
    });
  } catch (error) {
    console.error('Get all questions error:', error);
    res.status(500).json({ error: 'Failed to fetch questions' });
  }
};

// Get system statistics
const getSystemStats = async (req, res) => {
  try {
    const [
      { count: totalUsers },
      { count: totalSurveys },
      { count: totalResponses },
      { count: totalQuestions },
      { count: totalAnswers },
      { count: activeUsers },
      { count: publicSurveys },
      { count: privateSurveys }
    ] = await Promise.all([
      supabase.from('profiles').select('id', { count: 'exact', head: true }),
      supabase.from('surveys').select('id', { count: 'exact', head: true }),
      supabase.from('responses').select('id', { count: 'exact', head: true }),
      supabase.from('questions').select('id', { count: 'exact', head: true }),
      supabase.from('answers').select('id', { count: 'exact', head: true }),
      supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('is_active', true),
      supabase.from('surveys').select('id', { count: 'exact', head: true }).eq('is_public', true),
      supabase.from('surveys').select('id', { count: 'exact', head: true }).eq('is_public', false)
    ]);

    // Get recent activity (via foreign key relationship in select)
    const { data: recentActivity, error: activityError } = await supabase
      .from('admin_activity_log')
      .select('action, created_at, profiles(email)')
      .order('created_at', { ascending: false })
      .limit(10);

    if (activityError) throw activityError;

    // Get user role distribution
    const { data: roleRows, error: roleError } = await supabase
      .from('profiles')
      .select('role');

    if (roleError) throw roleError;

    const roleStats = (roleRows || []).reduce((acc, user) => {
      acc[user.role] = (acc[user.role] || 0) + 1;
      return acc;
    }, {});

    // Get question type distribution
    const { data: questionRows, error: questionTypeError } = await supabase
      .from('questions')
      .select('question_type');

    if (questionTypeError) throw questionTypeError;

    const questionTypeStats = (questionRows || []).reduce((acc, question) => {
      acc[question.question_type] = (acc[question.question_type] || 0) + 1;
      return acc;
    }, {});

    // Get survey activity over time (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const { data: recentSurveys } = await supabase
      .from('surveys')
      .select('created_at')
      .gte('created_at', sevenDaysAgo.toISOString());

    const { data: recentResponses } = await supabase
      .from('responses')
      .select('submitted_at')
      .gte('submitted_at', sevenDaysAgo.toISOString());

    res.json({
      stats: {
        totalUsers,
        totalSurveys,
        totalResponses,
        totalQuestions,
        totalAnswers,
        activeUsers,
        publicSurveys,
        privateSurveys,
        roleDistribution: roleStats,
        questionTypeDistribution: questionTypeStats,
        recentActivity: {
          newSurveysLast7Days: recentSurveys?.length || 0,
          newResponsesLast7Days: recentResponses?.length || 0
        }
      },
      recentActivity
    });
  } catch (error) {
    console.error('Get system stats error:', error);
    res.status(500).json({ error: 'Failed to fetch system statistics' });
  }
};

// Manage admin permissions
const managePermissions = async (req, res) => {
  try {
    const { userId } = req.params;
    const { permissions } = req.body; // Array of permissions

    // Only super admin can manage permissions
    if (req.user.role !== 'super_admin') {
      return res.status(403).json({ error: 'Super admin access required' });
    }

    // Remove existing permissions
    await supabase
      .from('admin_permissions')
      .delete()
      .eq('user_id', userId);

    // Add new permissions
    if (permissions && permissions.length > 0) {
      const permissionData = permissions.map(permission => ({
        user_id: userId,
        permission,
        granted_by: req.user.id,
        granted_at: new Date().toISOString()
      }));

      await supabase
        .from('admin_permissions')
        .insert(permissionData);
    }

    // Log the action
    await supabase
      .from('admin_activity_log')
      .insert({
        admin_id: req.user.id,
        action: 'PERMISSIONS_UPDATED',
        target_type: 'user',
        target_id: userId,
        details: { permissions },
        ip_address: req.ip,
        user_agent: req.get('User-Agent')
      });

    res.json({ message: 'Permissions updated successfully' });
  } catch (error) {
    console.error('Manage permissions error:', error);
    res.status(500).json({ error: 'Failed to update permissions' });
  }
};

module.exports = {
  getAllUsers,
  updateUserRole,
  getAllSurveys,
  deleteAnySurvey,
  getActivityLog,
  getAllResponses,
  getAllQuestions,
  getSystemStats,
  managePermissions
};
