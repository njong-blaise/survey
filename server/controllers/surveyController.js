const supabase = require('../config/supabase');

// Get all surveys for a user
const getSurveys = async (req, res) => {
  try {
    const { data: surveys, error } = await supabase
      .from('surveys')
      .select(`
        *,
        questions(count),
        responses(count)
      `)
      .eq('user_id', req.user.id)
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Format the response (embeds can be null or []; never index without ?.)
    const rows = surveys ?? [];
    const formattedSurveys = rows.map((survey) => ({
      ...survey,
      question_count: survey.questions?.[0]?.count ?? 0,
      response_count: survey.responses?.[0]?.count ?? 0,
    }));

    res.json(formattedSurveys);
  } catch (error) {
    console.error('Error fetching surveys:', error);
    res.status(500).json({ error: 'Failed to fetch surveys' });
  }
};

// Get a single survey with questions
const getSurvey = async (req, res) => {
  try {
    const { id } = req.params;

    const { data: survey, error } = await supabase
      .from('surveys')
      .select(`
        *,
        questions(*)
      `)
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({ error: 'Survey not found' });
      }
      throw error;
    }

    // Check if user owns the survey or if survey is public
    if (survey.user_id !== req.user.id && !survey.is_public) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Sort questions by order_index
    survey.questions.sort((a, b) => a.order_index - b.order_index);

    res.json(survey);
  } catch (error) {
    console.error('Error fetching survey:', error);
    res.status(500).json({ error: 'Failed to fetch survey' });
  }
};

// Create a new survey
const createSurvey = async (req, res) => {
  try {
    const { title, description, questions, is_public = true } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({ error: 'Survey title is required' });
    }

    if (!questions || questions.length === 0) {
      return res.status(400).json({ error: 'At least one question is required' });
    }

    // Validate questions
    for (const question of questions) {
      if (!question.question_text || !question.question_text.trim()) {
        return res.status(400).json({ error: 'All questions must have text' });
      }
      if (!['short_answer', 'paragraph', 'multiple_choice', 'checkbox'].includes(question.question_type)) {
        return res.status(400).json({ error: 'Invalid question type' });
      }
      if ((question.question_type === 'multiple_choice' || question.question_type === 'checkbox') && 
          (!question.options || question.options.length < 2)) {
        return res.status(400).json({ error: 'Multiple choice and checkbox questions must have at least 2 options' });
      }
    }

    // Create survey
    const { data: survey, error: surveyError } = await supabase
      .from('surveys')
      .insert({
        title: title.trim(),
        description: description?.trim() || null,
        user_id: req.user.id,
        is_public
      })
      .select()
      .single();

    if (surveyError) throw surveyError;

    // Create questions
    const questionsToInsert = questions.map((question, index) => ({
      survey_id: survey.id,
      question_text: question.question_text.trim(),
      question_type: question.question_type,
      is_required: question.is_required || false,
      options: question.options || null,
      order_index: index
    }));

    const { data: createdQuestions, error: questionsError } = await supabase
      .from('questions')
      .insert(questionsToInsert)
      .select();

    if (questionsError) throw questionsError;

    res.status(201).json({
      ...survey,
      questions: createdQuestions
    });
  } catch (error) {
    console.error('Error creating survey:', error);
    res.status(500).json({ error: 'Failed to create survey' });
  }
};

// Update a survey
const updateSurvey = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, is_public } = req.body;

    // Check if survey exists and user owns it
    const { data: existingSurvey, error: checkError } = await supabase
      .from('surveys')
      .select('user_id')
      .eq('id', id)
      .single();

    if (checkError) {
      if (checkError.code === 'PGRST116') {
        return res.status(404).json({ error: 'Survey not found' });
      }
      throw checkError;
    }

    if (existingSurvey.user_id !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Update survey
    const { data: survey, error } = await supabase
      .from('surveys')
      .update({
        title: title?.trim(),
        description: description?.trim() || null,
        is_public,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    res.json(survey);
  } catch (error) {
    console.error('Error updating survey:', error);
    res.status(500).json({ error: 'Failed to update survey' });
  }
};

// Delete a survey
const deleteSurvey = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if survey exists and user owns it
    const { data: existingSurvey, error: checkError } = await supabase
      .from('surveys')
      .select('user_id')
      .eq('id', id)
      .single();

    if (checkError) {
      if (checkError.code === 'PGRST116') {
        return res.status(404).json({ error: 'Survey not found' });
      }
      throw checkError;
    }

    if (existingSurvey.user_id !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Delete survey (cascade will handle questions, responses, and answers)
    const { error } = await supabase
      .from('surveys')
      .delete()
      .eq('id', id);

    if (error) throw error;

    res.status(204).send();
  } catch (error) {
    console.error('Error deleting survey:', error);
    res.status(500).json({ error: 'Failed to delete survey' });
  }
};

// Get public survey for respondents
const getPublicSurvey = async (req, res) => {
  try {
    const { id } = req.params;

    const { data: survey, error } = await supabase
      .from('surveys')
      .select(`
        id,
        title,
        description,
        is_public,
        questions(*)
      `)
      .eq('id', id)
      .eq('is_public', true)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({ error: 'Survey not found' });
      }
      throw error;
    }

    // Sort questions by order_index
    survey.questions.sort((a, b) => a.order_index - b.order_index);

    res.json(survey);
  } catch (error) {
    console.error('Error fetching public survey:', error);
    res.status(500).json({ error: 'Failed to fetch survey' });
  }
};

module.exports = {
  getSurveys,
  getSurvey,
  createSurvey,
  updateSurvey,
  deleteSurvey,
  getPublicSurvey
};
