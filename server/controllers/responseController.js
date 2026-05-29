const supabase = require('../config/supabase');

// Submit a response to a survey
const submitResponse = async (req, res) => {
  try {
    const { surveyId } = req.params;
    const { answers, respondent_email } = req.body;

    if (!answers || answers.length === 0) {
      return res.status(400).json({ error: 'At least one answer is required' });
    }

    // Check if survey exists and is public
    const { data: survey, error: surveyError } = await supabase
      .from('surveys')
      .select('id, title')
      .eq('id', surveyId)
      .eq('is_public', true)
      .single();

    if (surveyError) {
      if (surveyError.code === 'PGRST116') {
        return res.status(404).json({ error: 'Survey not found' });
      }
      throw surveyError;
    }

    // Get survey questions
    const { data: questions, error: questionsError } = await supabase
      .from('questions')
      .select('*')
      .eq('survey_id', surveyId)
      .order('order_index');

    if (questionsError) throw questionsError;

    // Validate answers
    const requiredQuestions = questions.filter(q => q.is_required);
    const answerMap = new Map(answers.map(a => [a.question_id, a]));

    for (const question of requiredQuestions) {
      const answer = answerMap.get(question.id);
      if (!answer || (!answer.answer_text && (!answer.answer_options || answer.answer_options.length === 0))) {
        return res.status(400).json({ 
          error: `Question "${question.question_text}" is required` 
        });
      }
    }

    // Validate answer formats
    for (const answer of answers) {
      const question = questions.find(q => q.id === answer.question_id);
      if (!question) {
        return res.status(400).json({ error: 'Invalid question ID' });
      }

      if (question.question_type === 'multiple_choice') {
        if (!answer.answer_options || answer.answer_options.length !== 1) {
          return res.status(400).json({ 
            error: 'Multiple choice questions require exactly one option' 
          });
        }
        if (!question.options.includes(answer.answer_options[0])) {
          return res.status(400).json({ error: 'Invalid option selected' });
        }
      } else if (question.question_type === 'checkbox') {
        if (!answer.answer_options || answer.answer_options.length === 0) {
          return res.status(400).json({ 
            error: 'Checkbox questions require at least one option' 
          });
        }
        for (const option of answer.answer_options) {
          if (!question.options.includes(option)) {
            return res.status(400).json({ error: 'Invalid option selected' });
          }
        }
      } else if (['short_answer', 'paragraph'].includes(question.question_type)) {
        if (!answer.answer_text || answer.answer_text.trim() === '') {
          return res.status(400).json({ 
            error: 'This question requires a text answer' 
          });
        }
      }
    }

    // Create response
    const { data: response, error: responseError } = await supabase
      .from('responses')
      .insert({
        survey_id: surveyId,
        respondent_email: respondent_email?.trim() || null,
        submitted_at: new Date().toISOString()
      })
      .select()
      .single();

    if (responseError) throw responseError;

    // Create answers
    const answersToInsert = answers.map(answer => ({
      response_id: response.id,
      question_id: answer.question_id,
      answer_text: answer.answer_text?.trim() || null,
      answer_options: answer.answer_options || null
    }));

    const { data: createdAnswers, error: answersError } = await supabase
      .from('answers')
      .insert(answersToInsert)
      .select();

    if (answersError) throw answersError;

    res.status(201).json({
      ...response,
      answers: createdAnswers
    });
  } catch (error) {
    console.error('Error submitting response:', error);
    res.status(500).json({ error: 'Failed to submit response' });
  }
};

// Get responses for a survey (survey owner only)
const getSurveyResponses = async (req, res) => {
  try {
    const { surveyId } = req.params;

    // Check if survey exists and user owns it
    const { data: survey, error: surveyError } = await supabase
      .from('surveys')
      .select('user_id')
      .eq('id', surveyId)
      .single();

    if (surveyError) {
      if (surveyError.code === 'PGRST116') {
        return res.status(404).json({ error: 'Survey not found' });
      }
      throw surveyError;
    }

    if (survey.user_id !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Get responses with answers
    const { data: responses, error } = await supabase
      .from('responses')
      .select(`
        *,
        answers(
          *,
          question_id,
          question_text:questions(question_text),
          question_type:questions(question_type)
        )
      `)
      .eq('survey_id', surveyId)
      .order('submitted_at', { ascending: false });

    if (error) throw error;

    res.json(responses);
  } catch (error) {
    console.error('Error fetching responses:', error);
    res.status(500).json({ error: 'Failed to fetch responses' });
  }
};

// Get analytics for a survey
const getSurveyAnalytics = async (req, res) => {
  try {
    const { surveyId } = req.params;

    // Check if survey exists and user owns it
    const { data: survey, error: surveyError } = await supabase
      .from('surveys')
      .select('user_id, title')
      .eq('id', surveyId)
      .single();

    if (surveyError) {
      if (surveyError.code === 'PGRST116') {
        return res.status(404).json({ error: 'Survey not found' });
      }
      throw surveyError;
    }

    if (survey.user_id !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Get total response count
    const { count: totalResponses, error: countError } = await supabase
      .from('responses')
      .select('*', { count: 'exact', head: true })
      .eq('survey_id', surveyId);

    if (countError) throw countError;

    // Get questions with their analytics
    const { data: questions, error: questionsError } = await supabase
      .from('questions')
      .select(`
        *,
        answers(
          answer_text,
          answer_options
        )
      `)
      .eq('survey_id', surveyId)
      .order('order_index');

    if (questionsError) throw questionsError;

    // Process analytics for each question
    const analytics = questions.map(question => {
      const answers = question.answers || [];
      
      if (question.question_type === 'multiple_choice') {
        const optionCounts = {};
        question.options.forEach(option => {
          optionCounts[option] = 0;
        });
        
        answers.forEach(answer => {
          if (answer.answer_options && answer.answer_options.length > 0) {
            const selectedOption = answer.answer_options[0];
            if (optionCounts.hasOwnProperty(selectedOption)) {
              optionCounts[selectedOption]++;
            }
          }
        });

        return {
          ...question,
          analytics: {
            type: 'multiple_choice',
            option_counts: optionCounts,
            total_answers: answers.length
          }
        };
      } else if (question.question_type === 'checkbox') {
        const optionCounts = {};
        question.options.forEach(option => {
          optionCounts[option] = 0;
        });
        
        answers.forEach(answer => {
          if (answer.answer_options) {
            answer.answer_options.forEach(selectedOption => {
              if (optionCounts.hasOwnProperty(selectedOption)) {
                optionCounts[selectedOption]++;
              }
            });
          }
        });

        return {
          ...question,
          analytics: {
            type: 'checkbox',
            option_counts: optionCounts,
            total_answers: answers.length
          }
        };
      } else {
        // For text questions, just return the text answers
        const textAnswers = answers
          .map(a => a.answer_text)
          .filter(text => text && text.trim() !== '');

        return {
          ...question,
          analytics: {
            type: 'text',
            answers: textAnswers,
            total_answers: textAnswers.length
          }
        };
      }
    });

    res.json({
      survey: {
        id: surveyId,
        title: survey.title,
        total_responses: totalResponses || 0
      },
      questions: analytics
    });
  } catch (error) {
    console.error('Error fetching analytics:', error);
    res.status(500).json({ error: 'Failed to fetch analytics' });
  }
};

module.exports = {
  submitResponse,
  getSurveyResponses,
  getSurveyAnalytics
};
