import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { authFetch } from '../services/api';
import { 
  Plus, 
  Trash2, 
  ChevronUp, 
  ChevronDown, 
  FileText, 
  HelpCircle, 
  CheckSquare, 
  List,
  ArrowLeft,
  Save,
  X,
  GripVertical
} from 'lucide-react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import {
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

const CreateSurveyPage = () => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [questions, setQuestions] = useState([]);
  const [isPublic, setIsPublic] = useState(true); // Default to public
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();

  // Drag and drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event) => {
    const { active, over } = event;

    if (active.id !== over.id) {
      setQuestions((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);

        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  const addQuestion = (type) => {
    const newQuestion = {
      id: Date.now().toString(),
      type,
      questionText: '',
      isRequired: false,
      options: type === 'multiple_choice' || type === 'checkbox' ? [''] : [],
    };
    setQuestions([...questions, newQuestion]);
  };

  const updateQuestion = (questionId, field, value) => {
    setQuestions(questions.map(q => 
      q.id === questionId ? { ...q, [field]: value } : q
    ));
  };

  const addOption = (questionId) => {
    setQuestions(questions.map(q => 
      q.id === questionId 
        ? { ...q, options: [...q.options, ''] }
        : q
    ));
  };

  const updateOption = (questionId, optionIndex, value) => {
    setQuestions(questions.map(q => 
      q.id === questionId 
        ? { 
            ...q, 
            options: q.options.map((opt, idx) => 
              idx === optionIndex ? value : opt
            )
          }
        : q
    ));
  };

  const removeOption = (questionId, optionIndex) => {
    setQuestions(questions.map(q => 
      q.id === questionId 
        ? { 
            ...q, 
            options: q.options.filter((_, idx) => idx !== optionIndex)
          }
        : q
    ));
  };

  const removeQuestion = (questionId) => {
    setQuestions(questions.filter(q => q.id !== questionId));
  };

  const moveQuestion = (questionId, direction) => {
    const index = questions.findIndex(q => q.id === questionId);
    if (
      (direction === 'up' && index === 0) ||
      (direction === 'down' && index === questions.length - 1)
    ) {
      return;
    }

    const newQuestions = [...questions];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    
    [newQuestions[index], newQuestions[targetIndex]] = 
    [newQuestions[targetIndex], newQuestions[index]];
    
    setQuestions(newQuestions);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    if (!title.trim()) {
      alert('Please enter a survey title');
      setLoading(false);
      return;
    }

    if (questions.length === 0) {
      alert('Please add at least one question');
      setLoading(false);
      return;
    }

    const validQuestions = questions.filter(q => q.questionText.trim());
    if (validQuestions.length === 0) {
      alert('Please add at least one question with text');
      setLoading(false);
      return;
    }

    try {
      if (!user) {
        alert('Please log in to create a survey');
        return;
      }

      const surveyData = {
        title: title.trim(),
        description: description.trim(),
        is_public: isPublic,
        questions: validQuestions.map((q, index) => ({
          question_text: q.questionText,
          question_type: q.type,
          is_required: q.isRequired,
          options: q.options.filter(opt => opt.trim()),
          order_index: index
        }))
      };

      const response = await authFetch('/surveys', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(surveyData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create survey');
      }

      navigate('/dashboard');
    } catch (error) {
      console.error('Error creating survey:', error);
      alert(error.message || 'Error creating survey. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getQuestionIcon = (type) => {
    switch (type) {
      case 'short_answer':
        return <FileText className="w-5 h-5" />;
      case 'paragraph':
        return <List className="w-5 h-5" />;
      case 'multiple_choice':
        return <HelpCircle className="w-5 h-5" />;
      case 'checkbox':
        return <CheckSquare className="w-5 h-5" />;
      default:
        return null;
    }
  };

  // Sortable Question Component
  const SortableQuestion = ({ question, index }) => {
    const {
      attributes,
      listeners,
      setNodeRef,
      transform,
      transition,
    } = useSortable({ id: question.id });

    const style = {
      transform: CSS.Transform.toString(transform),
      transition,
    };

    return (
      <div 
        ref={setNodeRef} 
        style={style} 
        className="card animate-fade-in"
        {...attributes}
      >
        <div className="card-body">
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-sm">
              <div 
                className="cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600"
                {...listeners}
              >
                <GripVertical className="w-5 h-5" />
              </div>
              <div className="text-secondary">
                {getQuestionIcon(question.type)}
              </div>
              <span className="text-small font-medium">
                {question.type.replace('_', ' ').charAt(0).toUpperCase() + 
                 question.type.replace('_', ' ').slice(1)}
              </span>
            </div>
            <div className="flex gap-sm">
              {index > 0 && (
                <button
                  type="button"
                  onClick={() => moveQuestion(question.id, 'up')}
                  className="btn btn-ghost"
                >
                  <ChevronUp className="w-4 h-4" />
                </button>
              )}
              {index < questions.length - 1 && (
                <button
                  type="button"
                  onClick={() => moveQuestion(question.id, 'down')}
                  className="btn btn-ghost"
                >
                  <ChevronDown className="w-4 h-4" />
                </button>
              )}
              <button
                type="button"
                onClick={() => removeQuestion(question.id)}
                className="btn btn-danger"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Question Input */}
          <div className="form-group">
            <input
              type="text"
              placeholder="Type your question here"
              value={question.questionText}
              onChange={(e) => updateQuestion(question.id, 'questionText', e.target.value)}
              className="form-input text-lg"
            />
          </div>

          {/* Question Options */}
          {(question.type === 'multiple_choice' || question.type === 'checkbox') && (
            <div className="space-y-sm">
              {question.options.map((option, optionIndex) => (
                <div key={optionIndex} className="flex gap-sm">
                  <input
                    type="text"
                    placeholder={`Option ${optionIndex + 1}`}
                    value={option}
                    onChange={(e) => updateOption(question.id, optionIndex, e.target.value)}
                    className="form-input flex-1"
                  />
                  {question.options.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeOption(question.id, optionIndex)}
                      className="btn btn-ghost"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
              <button
                type="button"
                onClick={() => addOption(question.id)}
                className="btn btn-ghost flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Add option
              </button>
            </div>
          )}

          {/* Required Toggle */}
          <div className="flex items-center gap-sm">
            <input
              type="checkbox"
              id={`required-${question.id}`}
              checked={question.isRequired}
              onChange={(e) => updateQuestion(question.id, 'isRequired', e.target.checked)}
              className="form-checkbox"
            />
            <label htmlFor={`required-${question.id}`} className="form-label mb-0">
              Required
            </label>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="app-layout">
      <div className="main-content">
        <div className="container">
          {/* Header */}
          <div className="card mb-8">
            <div className="card-body">
              <div className="flex justify-between items-center mb-6">
                    <h1 className="heading-2">Create Survey</h1>
                    <div className="flex gap-sm">
                      <button
                            onClick={() => navigate('/dashboard')}
                            className="btn btn-ghost flex items-center gap-2"
                      >
                        <ArrowLeft className="w-4 h-4" />
                        Cancel
                      </button>
                      <button
                            onClick={handleSubmit}
                            disabled={loading}
                            className={`btn btn-primary flex items-center gap-2 ${loading ? 'loading' : ''}`}
                      >
                        <Save className="w-4 h-4" />
                        {loading ? 'Creating...' : 'Create Survey'}
                      </button>
                    </div>
              </div>

              {/* Survey Title */}
              <div className="form-group">
                <label className="form-label">Survey Title</label>
                <input
                  type="text"
                  placeholder="Enter your survey title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="form-input text-lg"
                />
              </div>

              {/* Survey Description */}
              <div className="form-group">
                <label className="form-label">Description (Optional)</label>
                <textarea
                  placeholder="Provide a brief description of your survey"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="form-input form-textarea"
                  rows={3}
                />
              </div>

              {/* Survey Visibility */}
              <div className="form-group">
                <label className="form-label">Survey Visibility</label>
                <div className="flex items-center gap-sm">
                  <div className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      id="survey-visibility"
                      className="sr-only peer"
                      checked={isPublic}
                      onChange={(e) => setIsPublic(e.target.checked)}
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                  </div>
                  <label htmlFor="survey-visibility" className="text-body font-medium">
                    {isPublic ? 'Public' : 'Private'}
                  </label>
                </div>
                <p className="text-small text-secondary mt-2">
                  {isPublic 
                    ? 'Anyone with the link can respond to this survey' 
                    : 'Only you can view and manage this survey'}
                </p>
              </div>
            </div>
          </div>

          {/* Questions */}
          <DndContext 
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext 
              items={questions} 
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-lg">
                {questions.map((question, index) => (
                  <SortableQuestion key={question.id} question={question} index={index} />
                ))}
              </div>
            </SortableContext>
          </DndContext>

          {/* Add Question Buttons */}
          <div className="card">
            <div className="card-body">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-md">
                <button
                  type="button"
                  onClick={() => addQuestion('short_answer')}
                  className="btn btn-secondary flex-col gap-sm"
                >
                  <FileText className="w-6 h-6" />
                  <span>Short Answer</span>
                </button>
                
                <button
                  type="button"
                  onClick={() => addQuestion('paragraph')}
                  className="btn btn-secondary flex-col gap-sm"
                >
                  <List className="w-6 h-6" />
                  <span>Paragraph</span>
                </button>
                
                <button
                  type="button"
                  onClick={() => addQuestion('multiple_choice')}
                  className="btn btn-secondary flex-col gap-sm"
                >
                  <HelpCircle className="w-6 h-6" />
                  <span>Multiple Choice</span>
                </button>
                
                <button
                  type="button"
                  onClick={() => addQuestion('checkbox')}
                  className="btn btn-secondary flex-col gap-sm"
                >
                  <CheckSquare className="w-6 h-6" />
                  <span>Checkboxes</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateSurveyPage;
