// Utility functions for exporting survey data

export const exportToCSV = (survey, responses) => {
  if (!survey || !responses || responses.length === 0) {
    alert('No data to export');
    return;
  }

  // Create CSV headers
  const headers = ['Response ID', 'Submitted At'];
  survey.questions.forEach(question => {
    headers.push(question.question_text);
  });

  // Create CSV rows
  const rows = responses.map(response => {
    const row = [
      response.id,
      new Date(response.created_at).toLocaleString()
    ];
    
    // Add answers for each question
    survey.questions.forEach(question => {
      const answer = response.answers.find(a => a.question_id === question.id);
      
      if (answer) {
        if (question.question_type === 'checkbox') {
          // For checkboxes, join multiple answers
          row.push(answer.answer_options ? answer.answer_options.join('; ') : '');
        } else if (answer.answer_options && answer.answer_options.length > 0) {
          // For multiple choice
          row.push(answer.answer_options[0]);
        } else {
          // For text answers
          row.push(answer.answer_text || '');
        }
      } else {
        row.push('');
      }
    });
    
    return row;
  });

  // Convert to CSV string
  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
  ].join('\n');

  // Create and download file
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', `${survey.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_responses.csv`);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export const exportToJSON = (survey, responses) => {
  if (!survey || !responses || responses.length === 0) {
    alert('No data to export');
    return;
  }

  const exportData = {
    survey: {
      title: survey.title,
      description: survey.description,
      created_at: survey.created_at,
      questions: survey.questions
    },
    responses: responses,
    export_date: new Date().toISOString(),
    total_responses: responses.length
  };

  const jsonString = JSON.stringify(exportData, null, 2);
  const blob = new Blob([jsonString], { type: 'application/json' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', `${survey.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_responses.json`);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export const generateSummaryReport = (survey, responses) => {
  if (!survey || !responses || responses.length === 0) {
    return null;
  }

  const summary = {
    survey_title: survey.title,
    total_responses: responses.length,
    response_rate: '100%', // This would need calculation based on invitations sent
    completion_rate: '100%', // This would need calculation based on partial responses
    generated_at: new Date().toLocaleString(),
    questions: []
  };

  survey.questions.forEach(question => {
    const questionStats = {
      question_text: question.question_text,
      question_type: question.question_type,
      is_required: question.is_required,
      total_answers: 0,
      response_breakdown: {}
    };

    // Count responses for this question
    responses.forEach(response => {
      const answer = response.answers.find(a => a.question_id === question.id);
      if (answer) {
        questionStats.total_answers++;
        
        if (question.question_type === 'multiple_choice') {
          const option = answer.answer_options[0] || 'No answer';
          questionStats.response_breakdown[option] = (questionStats.response_breakdown[option] || 0) + 1;
        } else if (question.question_type === 'checkbox') {
          answer.answer_options.forEach(option => {
            questionStats.response_breakdown[option] = (questionStats.response_breakdown[option] || 0) + 1;
          });
        } else {
          // For text answers, we'll just count them
          questionStats.response_breakdown['Text Responses'] = (questionStats.response_breakdown['Text Responses'] || 0) + 1;
        }
      }
    });

    summary.questions.push(questionStats);
  });

  return summary;
};
