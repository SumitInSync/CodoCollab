# 🚀 Realtime Code Collaborator

<div align="center">
  <img src="frontend/src/assets/logo__.png" alt="CodeCollab Logo" width="120" height="120">
  
  **A powerful real-time collaborative code editor with AI-powered code review**
  
  [![License: ISC](https://img.shields.io/badge/License-ISC-blue.svg)](https://opensource.org/licenses/ISC)
  [![Node.js](https://img.shields.io/badge/Node.js-20.14.0-green.svg)](https://nodejs.org/)
  [![React](https://img.shields.io/badge/React-19.1.0-blue.svg)](https://reactjs.org/)
  [![Socket.io](https://img.shields.io/badge/Socket.io-4.8.1-black.svg)](https://socket.io/)
</div>

## ✨ Features

### 🔄 **Real-time Collaboration**
- **Live Code Editing**: See changes from other users in real-time
- **Multi-user Support**: Collaborate with unlimited users in the same room
- **Typing Indicators**: Know when someone is typing
- **User Management**: Search and view active users with avatars

### 🎨 **Advanced Code Editor**
- **Monaco Editor**: Powered by the same editor that powers VS Code
- **Multiple Languages**: Support for C++, JavaScript, Python, and Java
- **Custom Themes**: Dark, Light, and custom CodeCollab themes
- **Resizable Panels**: Drag to resize input/output panels
- **Syntax Highlighting**: Full language support with syntax highlighting

### 🤖 **AI-Powered Code Review**
- **Gemini AI Integration**: Get intelligent code suggestions and reviews
- **Language Detection**: Automatic language detection for better reviews
- **Markdown Formatting**: Beautiful formatted review results
- **Real-time Feedback**: Instant AI feedback on your code

### 🏃‍♂️ **Code Execution**
- **Multi-language Support**: Run C++, JavaScript, Python, and Java code
- **Input/Output Handling**: Support for custom input and output display
- **Error Handling**: Clear error messages and execution feedback
- **Piston API Integration**: Secure code execution environment

### 💾 **Additional Features**
- **File Saving**: Download your code as files
- **Room Management**: Create and join collaboration rooms
- **Responsive Design**: Works on desktop and mobile devices
- **Modern UI**: Clean, intuitive interface with smooth animations

## 🛠️ Tech Stack

### **Frontend**
- **React 19.1.0** - Modern React with hooks
- **Vite** - Fast build tool and development server
- **Monaco Editor** - Professional code editor
- **Socket.io Client** - Real-time communication
- **React Markdown** - Markdown rendering for AI reviews

### **Backend**
- **Node.js** - JavaScript runtime
- **Express.js** - Web application framework
- **Socket.io** - Real-time bidirectional communication
- **Google Generative AI** - Gemini AI integration for code reviews
- **Piston API** - Code execution service

## 🚀 Quick Start

### Prerequisites
- Node.js (v20.14.0 or higher)
- npm or yarn package manager
- Google Gemini API key

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/realtime-code-collaborator.git
   cd realtime-code-collaborator
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   
   Create a `.env` file in the `backend` directory:
   ```bash
   # Create the .env file
   touch backend/.env
   ```
   
   Add your Gemini API key:
   ```env
   # Google Gemini API Key
   # Get your API key from: https://makersuite.google.com/app/apikey
   GEMINI_API_KEY=your_gemini_api_key_here
   ```

4. **Build the frontend**
   ```bash
   npm run build
   ```

5. **Start the server**
   ```bash
   npm start
   ```

6. **Open your browser**
   Navigate to `http://localhost:5001`

## 🏗️ Development

### Development Mode

Start the development server with hot reload:
```bash
npm run dev
```

This will start the backend server with nodemon for automatic restarts.

### Frontend Development

For frontend-only development:
```bash
cd frontend
npm run dev
```

### Project Structure

```
realtime-code-collaborator/
├── backend/
│   ├── index.js          # Main server file
│   └── .env              # Environment variables
├── frontend/
│   ├── src/
│   │   ├── App.jsx       # Main React component
│   │   ├── App.css       # Styles
│   │   ├── main.jsx      # React entry point
│   │   └── assets/       # Images and icons
│   ├── index.html        # HTML template
│   └── package.json      # Frontend dependencies
├── package.json          # Root package.json
└── README.md            # This file
```

## 🔧 Configuration

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `GEMINI_API_KEY` | Google Gemini AI API key | Yes |
| `PORT` | Server port (default: 5001) | No |

### Supported Languages

| Language | File Extension | Execution Support |
|----------|---------------|-------------------|
| C++ | `.cpp` | ✅ |
| JavaScript | `.js` | ✅ |
| Python | `.py` | ✅ |
| Java | `.java` | ✅ |

## 🌐 Deployment

### Using Render (Recommended)

1. **Connect your repository** to Render
2. **Set environment variables** in Render dashboard:
   - `GEMINI_API_KEY`: Your Gemini API key
3. **Deploy** - Render will automatically build and deploy

### Manual Deployment

1. **Build the project**:
   ```bash
   npm run build
   ```

2. **Set environment variables** on your server

3. **Start the server**:
   ```bash
   npm start
   ```

## 🤝 Contributing

We welcome contributions! Please follow these steps:

1. **Fork the repository**
2. **Create a feature branch**:
   ```bash
   git checkout -b feature/amazing-feature
   ```
3. **Commit your changes**:
   ```bash
   git commit -m 'Add some amazing feature'
   ```
4. **Push to the branch**:
   ```bash
   git push origin feature/amazing-feature
   ```
5. **Open a Pull Request**

### Development Guidelines

- Follow the existing code style
- Add comments for complex logic
- Test your changes thoroughly
- Update documentation if needed

## 🐛 Troubleshooting

### Common Issues

**AI Review not working:**
- Ensure your `GEMINI_API_KEY` is set correctly
- Check that the API key has proper permissions
- Verify the `.env` file is in the `backend` directory

**Port already in use:**
```bash
# Kill process using port 5001
npx kill-port 5001
```

**Dependencies not installed:**
```bash
# Clean install
rm -rf node_modules package-lock.json
npm install
```

**Frontend build issues:**
```bash
cd frontend
rm -rf node_modules package-lock.json
npm install
npm run build
```

## 📝 API Reference

### Socket.io Events

#### Client → Server
- `join` - Join a room
- `codeChange` - Send code changes
- `languageChange` - Change programming language
- `themeChange` - Change editor theme
- `compileCode` - Execute code
- `getAIReview` - Request AI code review
- `typing` - Send typing indicator
- `leaveRoom` - Leave current room

#### Server → Client
- `userJoined` - User joined/left room
- `codeUpdate` - Code updated by another user
- `languageUpdate` - Language changed
- `themeUpdate` - Theme changed
- `codeResponse` - Code execution result
- `AIReview` - AI review response
- `userTyping` - User typing indicator

## 📄 License

This project is licensed under the ISC License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Monaco Editor** - For the amazing code editor
- **Socket.io** - For real-time communication
- **Google Gemini AI** - For intelligent code reviews
- **Piston API** - For secure code execution
- **React Team** - For the amazing framework

## 📞 Support

If you have any questions or need help:

1. **Check the troubleshooting section** above
2. **Open an issue** on GitHub
3. **Contact the maintainers**

---

<div align="center">
  <p>Made with ❤️ by the CodeCollab Team</p>
  <p>⭐ Star this repository if you found it helpful!</p>
</div>
