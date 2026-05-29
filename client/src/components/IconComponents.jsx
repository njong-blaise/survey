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
  Eye,
  EyeOff,
  Mail,
  Lock,
  UserPlus,
  CheckCircle,
  ChevronUp,
  ChevronDown,
  HelpCircle,
  CheckSquare,
  List,
  ArrowLeft,
  Save
} from 'lucide-react';

// Icon wrapper component for consistent styling
export const IconWrapper = ({ children, size = 'md', className = '' }) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
    xl: 'w-8 h-8'
  };
  
  return (
    <span className={`${sizeClasses[size]} ${className}`}>
      {children}
    </span>
  );
};

// Common icon combinations
export const AppIcons = {
  // Navigation
  Menu: (props) => <Menu {...props} />,
  Close: (props) => <X {...props} />,
  ArrowLeft: (props) => <ArrowLeft {...props} />,
  
  // Authentication
  Mail: (props) => <Mail {...props} />,
  Lock: (props) => <Lock {...props} />,
  Eye: (props) => <Eye {...props} />,
  EyeOff: (props) => <EyeOff {...props} />,
  UserPlus: (props) => <UserPlus {...props} />,
  LogOut: (props) => <LogOut {...props} />,
  
  // Actions
  Plus: (props) => <Plus {...props} />,
  Save: (props) => <Save {...props} />,
  Edit: (props) => <Edit {...props} />,
  Trash2: (props) => <Trash2 {...props} />,
  Share2: (props) => <Share2 {...props} />,
  
  // Survey & Content
  FileText: (props) => <FileText {...props} />,
  BarChart3: (props) => <BarChart3 {...props} />,
  Users: (props) => <Users {...props} />,
  Calendar: (props) => <Calendar {...props} />,
  TrendingUp: (props) => <TrendingUp {...props} />,
  
  // Question Types
  HelpCircle: (props) => <HelpCircle {...props} />,
  CheckSquare: (props) => <CheckSquare {...props} />,
  List: (props) => <List {...props} />,
  
  // Status & Feedback
  AlertCircle: (props) => <AlertCircle {...props} />,
  CheckCircle: (props) => <CheckCircle {...props} />,
  
  // Layout
  ChevronUp: (props) => <ChevronUp {...props} />,
  ChevronDown: (props) => <ChevronDown {...props} />,
  
  // Theme
  Moon: (props) => <Moon {...props} />,
  Sun: (props) => <Sun {...props} />
};

export default AppIcons;
