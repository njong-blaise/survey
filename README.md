# Survey Application System

A full-stack survey application similar to Google Forms built with React, Node.js, and Supabase.

## 🚀 Features

- **Authentication System**: Complete user auth with signup, login, logout, and password reset
- **Survey Creation**: Google Forms-style interface with drag-and-drop question building
- **Question Types**: Multiple Choice, Short Answer, Paragraph, and Checkbox questions
- **Public Surveys**: Shareable links for respondents (no login required)
- **Analytics Dashboard**: Visual charts and response analytics
- **Responsive Design**: Mobile-friendly interface with modern UI
- **Real-time Updates**: Live survey responses and analytics

## 🛠 Tech Stack

### Frontend
- **React 18** with Vite for fast development
- **React Router** for navigation
- **Tailwind CSS** for styling
- **Supabase Auth** for authentication

### Backend
- **Node.js** with Express.js
- **Supabase** for database and authentication
- **JWT** for API authentication
- **CORS** for cross-origin requests

### Database
- **PostgreSQL** via Supabase
- **Row Level Security (RLS)** for data protection
- **Real-time subscriptions** for live updates

## 📁 Project Structure

```
survey-application/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── context/        # React context providers
│   │   ├── hooks/          # Custom hooks
│   │   ├── pages/          # Page components
│   │   ├── services/       # API services
│   │   └── App.jsx         # Main app component
│   ├── package.json
│   └── vite.config.js
├── server/                 # Node.js backend
│   ├── config/            # Configuration files
│   ├── controllers/       # Route controllers
│   ├── middleware/        # Express middleware
│   ├── routes/           # API routes
│   ├── index.js           # Server entry point
│   └── package.json
├── database_schema.sql    # Supabase database schema
└── README.md
```

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ installed
- Supabase account and project
- Git for version control

### 1. Clone the Repository

```bash
git clone <repository-url>
cd survey-application
```

### 2. Set up Supabase

1. Create a new Supabase project at [supabase.com](https://supabase.com)
2. Run the SQL schema from `database_schema.sql` in your Supabase SQL editor
3. Enable email authentication in Supabase Auth settings
4. Get your project URL and anon key from Supabase settings

### 3. Configure Environment Variables

#### Client (.env)
```env
VITE_SUPABASE_URL=your_supabase_url_here
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key_here
```

#### Server (.env)
```env
PORT=5000
SUPABASE_URL=your_supabase_url_here
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key_here
JWT_SECRET=your_jwt_secret_here
```

### 4. Install Dependencies

#### Frontend
```bash
cd client
npm install
```

#### Backend
```bash
cd server
npm install
```

### 5. Start the Application

#### Start the Backend Server
```bash
cd server
npm run dev
```

#### Start the Frontend Development Server
```bash
cd client
npm run dev
```

The application will be available at:
- Frontend: http://localhost:5173
- Backend API: http://localhost:5000

## 📊 Database Schema

### Tables

- **profiles**: User profiles linked to Supabase auth
- **surveys**: Survey metadata and settings
- **questions**: Individual survey questions
- **responses**: Survey submissions
- **answers**: Individual answers to questions

### Relationships

- `surveys` → `profiles` (user_id)
- `questions` → `surveys` (survey_id)
- `responses` → `surveys` (survey_id)
- `answers` → `responses` (response_id)
- `answers` → `questions` (question_id)

## 🔌 API Endpoints

### Authentication (Supabase)
- Sign up, login, logout handled by Supabase Auth

### Surveys
- `GET /api/surveys` - Get user's surveys
- `POST /api/surveys` - Create new survey
- `GET /api/surveys/:id` - Get specific survey
- `PUT /api/surveys/:id` - Update survey
- `DELETE /api/surveys/:id` - Delete survey
- `GET /api/surveys/public/:id` - Get public survey for respondents

### Responses
- `POST /api/responses/survey/:id` - Submit survey response
- `GET /api/responses/survey/:id/responses` - Get survey responses
- `GET /api/responses/survey/:id/analytics` - Get survey analytics

## 🎨 UI Components

### Pages
- **Login/Signup**: Authentication pages with form validation
- **Dashboard**: Survey management interface
- **Create Survey**: Google Forms-style survey builder
- **Public Survey**: Respondent interface
- **Analytics**: Response analytics with charts

### Features
- **Form Validation**: Client-side and server-side validation
- **Loading States**: Smooth loading indicators
- **Error Handling**: Comprehensive error messages
- **Responsive Design**: Mobile-first approach
- **Accessibility**: ARIA labels and keyboard navigation

## 🔒 Security Features

- **Row Level Security**: Database-level access control
- **JWT Authentication**: Secure API access
- **Input Validation**: Sanitization of all inputs
- **CORS Protection**: Cross-origin request security
- **Environment Variables**: Secure configuration management

## 📱 User Flow

1. **User Registration**: Sign up with email and password
2. **Email Verification**: Confirm email address
3. **Login**: Access the dashboard
4. **Create Survey**: Build surveys with various question types
5. **Share Survey**: Generate public links
6. **Collect Responses**: Respondents fill surveys without login
7. **View Analytics**: Analyze responses with charts and metrics

## 🚀 Deployment

### Frontend (Vercel/Netlify)
1. Build the frontend: `npm run build`
2. Deploy the `dist` folder
3. Configure environment variables

### Backend (Heroku/Railway)
1. Deploy the Node.js server
2. Configure environment variables
3. Set up CORS for production domain

### Supabase
1. Update CORS settings in Supabase
2. Configure email templates
3. Set up production environment variables

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Commit changes: `git commit -m 'Add feature'`
4. Push to branch: `git push origin feature-name`
5. Submit a pull request

## 📝 License

This project is licensed under the MIT License.

## 🆘 Troubleshooting

### Common Issues

1. **CORS Errors**: Ensure backend CORS is configured correctly
2. **Authentication Issues**: Check Supabase auth settings
3. **Database Errors**: Verify SQL schema is properly executed
4. **Environment Variables**: Ensure all required variables are set

### Debug Tips

- Check browser console for frontend errors
- Check server logs for backend errors
- Verify Supabase connection with test queries
- Use network tab to inspect API calls

## 🔄 Future Enhancements

- **Survey Templates**: Pre-built survey templates
- **Advanced Analytics**: More sophisticated chart types
- **Export Features**: CSV/PDF export functionality
- **Collaboration**: Multi-user survey editing
- **API Integration**: Third-party service integrations
- **Dark Mode**: Theme switching functionality
- **Mobile App**: React Native mobile application

## 📞 Support

For support and questions:
- Create an issue in the repository
- Check the troubleshooting section
- Review the documentation

---

**Built with ❤️ using React, Node.js, and Supabase**
