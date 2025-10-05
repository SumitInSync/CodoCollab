import './App.css';
import io from 'socket.io-client';
import { useEffect, useState, useMemo, useRef } from 'react';
import Editor from '@monaco-editor/react';
import Markdown from 'react-markdown';

// --- ICONS ---
const CodeIcon = () => ( <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="16 18 22 12 16 6"></polyline><polyline points="8 6 2 12 8 18"></polyline></svg> );
const PlayIcon = () => ( <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg> );
const UserPlusIcon = () => ( <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="8.5" cy="7" r="4"></circle><line x1="20" y1="8" x2="20" y2="14"></line><line x1="17" y1="11" x2="23" y2="11"></line></svg> );
const SaveIcon = () => ( <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path><polyline points="17 21 17 13 7 13 7 21"></polyline><polyline points="7 3 7 8 15 8"></polyline></svg> );
const SearchIcon = () => ( <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg> );
const SunIcon = () => ( <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg> );
const MoonIcon = () => ( <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg> );

// --- SOCKET CONNECTION ---
const socket = io('https://realtime-code-collaborator-cr7c.onrender.com');

// --- BOILERPLATE & FILE EXTENSIONS ---
const boilerplate = {
  cpp: `#include <iostream>\n\nint main() {\n    // Write C++ code here\n    std::cout << "Hello World!";\n    return 0;\n}`,
  javascript: `// Write Javascript code here\nconsole.log("Hello World!");`,
  python: `# Write Python code here\nprint("Hello World!")`,
  java: `// Write Java code here\nclass Main {\n    public static void main(String[] args) {\n        System.out.println("Hello World!");\n    }\n}`,
};
const fileExtensions = { cpp: 'cpp', javascript: 'js', python: 'py', java: 'java' };

const App = () => {
  // --- STATE MANAGEMENT ---
  const [joined, setJoined] = useState(false);
  const [roomId, setRoomId] = useState('');
  const [userName, setUserName] = useState('');
  const [users, setUsers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [language, setLanguage] = useState('cpp');
  
  const [appTheme, setAppTheme] = useState(() => localStorage.getItem('appTheme') || 'dark');
  const [editorTheme, setEditorTheme] = useState('CodeCollabDark');

  const [code, setCode] = useState(boilerplate.cpp);
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [activeTab, setActiveTab] = useState('input');
  const [ioPanelHeight, setIoPanelHeight] = useState(250);
  const [typingUser, setTypingUser] = useState('');
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [isAiReviewModalOpen, setIsAiReviewModalOpen] = useState(false);
  const [aiReviewMessage, setAiReviewMessage] = useState('');
  const [isReviewing, setIsReviewing] = useState(false);
  const [copySuccess, setCopySuccess] = useState('');
  
  const editorRef = useRef(null);
  const isResizingRef = useRef(false);

  const filteredUsers = users.filter(user => user.toLowerCase().includes(searchQuery.toLowerCase()));
  
  // --- EFFECT HOOKS ---
  useEffect(() => {
    localStorage.setItem('appTheme', appTheme);
    setEditorTheme(appTheme === 'dark' ? 'CodeCollabDark' : 'light');
  }, [appTheme]);

  useEffect(() => {
    socket.on('userJoined', (users) => setUsers(users));
    socket.on('codeUpdate', (newCode) => setCode(newCode));
    socket.on('languageUpdate', (newLanguage) => setLanguage(newLanguage));
    socket.on('codeResponse', (response) => { setOutput(response.run.output || response.run.stderr || 'Execution finished.'); setActiveTab('output'); });
    socket.on('AIReview', (message) => { setAiReviewMessage(message); setIsAiReviewModalOpen(true); setIsReviewing(false); });
    socket.on('userTyping', (user) => {
      setTypingUser(user);
      const timer = setTimeout(() => setTypingUser(''), 2000);
      return () => clearTimeout(timer);
    });
    return () => { socket.off('userJoined'); socket.off('codeUpdate'); socket.off('languageUpdate'); socket.off('codeResponse'); socket.off('AIReview'); socket.off('userTyping'); };
  }, []);

  useEffect(() => {
    const handleBeforeUnload = () => socket.emit('leaveRoom');
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, []);

  // --- HANDLER FUNCTIONS ---
  const handleEditorWillMount = (monaco) => {
    // Define custom theme before the editor mounts to prevent race conditions
    monaco.editor.defineTheme('CodeCollabDark', {
      base: 'vs-dark', inherit: true, rules: [],
      colors: {
        'editor.background': '#0F172A', 'editor.foreground': '#F1F5F9', 'editorGutter.background': '#0F172A',
        'editor.lineHighlightBackground': '#1E293B', 'editorCursor.foreground': '#3B82F6',
      },
    });
  };

  const handleEditorDidMount = (editor, monaco) => {
    editorRef.current = editor;
  };
  
  const toggleTheme = () => { setAppTheme(prevTheme => prevTheme === 'dark' ? 'light' : 'dark'); };
  const handleJoinRoom = () => { if (roomId && userName) { socket.emit('join', { roomId, userName }); setJoined(true); } };
  const handleCreateRoom = () => setRoomId(Math.floor(100000 + Math.random() * 900000).toString());
  const handleCodeChange = (newCode) => { setCode(newCode); socket.emit('codeChange', { roomId, code: newCode }); socket.emit('typing', roomId, userName); };
  const handleLanguageChange = (e) => {
    const newLanguage = e.target.value; setLanguage(newLanguage);
    const newCode = boilerplate[newLanguage]; setCode(newCode);
    socket.emit('languageChange', { roomId, language: newLanguage });
    socket.emit('codeChange', { roomId, code: newCode });
  };
  const handleRunCode = () => { setOutput('Running code...'); setActiveTab('output'); socket.emit('compileCode', { code, roomId, language, version: '*', stdin: input }); };
  const handleAiReview = () => { setIsReviewing(true); socket.emit('getAIReview', { roomId, code }); };
  const copyRoomId = () => { navigator.clipboard.writeText(roomId); setCopySuccess('Copied!'); setTimeout(() => setCopySuccess(''), 2000); };
  const handleSaveFile = () => {
    const extension = fileExtensions[language]; const filename = `main.${extension}`;
    const blob = new Blob([code], { type: 'text/plain;charset=utf-8' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob); link.download = filename;
    document.body.appendChild(link); link.click(); document.body.removeChild(link);
  };
  
  const handleMouseDown = (e) => {
    isResizingRef.current = true;
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };
  const handleMouseMove = (e) => {
    if (!isResizingRef.current) return;
    let newHeight = window.innerHeight - e.clientY;
    if (newHeight < 75) newHeight = 75;
    if (newHeight > window.innerHeight - 200) newHeight = window.innerHeight - 200;
    setIoPanelHeight(newHeight);
  };
  const handleMouseUp = () => {
    isResizingRef.current = false;
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
  };
  
  return (
    <div className="theme-wrapper" data-theme={appTheme}>
      {!joined ? (
        <div className="join-container">
          <div className="join-form">
            <div className="join-header"><CodeIcon /><h1>CodeCollab</h1></div>
            <input type="text" placeholder="Enter your name" value={userName} onChange={(e) => setUserName(e.target.value)} />
            <input type="text" placeholder="Enter Room ID" value={roomId} onChange={(e) => setRoomId(e.target.value)} />
            <div className="join-buttons">
              <button className="btn btn-secondary" onClick={handleCreateRoom}>Create Room</button>
              <button className="btn btn-primary" onClick={handleJoinRoom}>Join Room</button>
            </div>
          </div>
        </div>
      ) : (
        <div className="app-container">
          <nav className="navbar">
            <div className="nav-left">
              <CodeIcon /> <h1>CodeCollab</h1>
            </div>
            
            <div className="editor-controls">
                <select value={language} onChange={handleLanguageChange} className="nav-select">
                    <option value="cpp">C++</option>
                    <option value="javascript">JavaScript</option>
                    <option value="python">Python</option>
                    <option value="java">Java</option>
                </select>
            </div>

            <div className="nav-right">
              <button className="btn btn-secondary" onClick={toggleTheme}>
                {appTheme === 'dark' ? <SunIcon /> : <MoonIcon />}
              </button>
              <button className="btn btn-secondary" onClick={handleSaveFile}><SaveIcon /> Save</button>
              <button className="btn btn-secondary" onClick={handleAiReview} disabled={isReviewing}>{isReviewing ? 'Reviewing...' : 'AI Review'}</button>
              <button className="btn btn-primary btn-run" onClick={handleRunCode}><PlayIcon /> Run</button>
              <div className="user-profile">
                <img src={`https://api.dicebear.com/8.x/lorelei/svg?seed=${userName}`} alt="avatar" />
                <div className="active-indicator"></div>
              </div>
            </div>
          </nav>

          <main className="main-content">
            <aside className="sidebar">
              <div className="sidebar-search">
                <SearchIcon />
                <input type="text" placeholder="Search Users..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
              </div>
              <div className="sidebar-header">
                <h3>Active Users ({filteredUsers.length})</h3>
                {typingUser && <p className="typing-indicator">{typingUser} is typing...</p>}
              </div>
              <ul className="active-users-list">
                {filteredUsers.map((user) => (
                  <li key={user} className="user-item">
                    <div className="user-avatar">
                      <img src={`https://api.dicebear.com/8.x/lorelei/svg?seed=${user}`} alt="avatar" />
                      <div className="active-indicator"></div>
                    </div>
                    <span>{user}</span>
                  </li>
                ))}
              </ul>
              <button className="btn btn-primary invite-btn" onClick={() => setIsInviteModalOpen(true)}><UserPlusIcon /> Invite</button>
            </aside>

            <div className="editor-panel">
              <div className="editor-wrapper">
                <Editor
                  height="100%" language={language} theme={editorTheme} value={code}
                  onChange={handleCodeChange}
                  beforeMount={handleEditorWillMount}
                  onMount={handleEditorDidMount}
                  options={{ minimap: { enabled: false }, fontSize: 14 }}
                />
              </div>
              <div className="resizer" onMouseDown={handleMouseDown}></div>
              <div className="io-panel" style={{ height: `${ioPanelHeight}px` }}>
                <div className="io-tabs">
                  <button onClick={() => setActiveTab('input')} className={activeTab === 'input' ? 'active' : ''}>Input</button>
                  <button onClick={() => setActiveTab('output')} className={activeTab === 'output' ? 'active' : ''}>Output</button>
                </div>
                <div className="io-content">
                  {activeTab === 'input' && ( <textarea className="io-textarea" value={input} onChange={(e) => setInput(e.target.value)} placeholder="Enter input for your code here..." /> )}
                  {activeTab === 'output' && ( <textarea className="io-textarea output-area" value={output} readOnly placeholder="Output will appear here..." /> )}
                </div>
              </div>
            </div>
          </main>
        </div>
      )}

      {isInviteModalOpen && (
        <div className="modal-overlay" onClick={() => setIsInviteModalOpen(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>Invite others</h2> <p>Share this Room ID with your collaborators.</p>
            <div className="modal-content">
              <input type="text" readOnly value={roomId} />
              <button className="btn btn-primary" onClick={copyRoomId}>{copySuccess || 'Copy ID'}</button>
            </div>
            <div className="modal-actions"><button className="btn btn-secondary" onClick={() => setIsInviteModalOpen(false)}>Close</button></div>
          </div>
        </div>
      )}
      
      {isAiReviewModalOpen && (
        <div className="modal-overlay" onClick={() => setIsAiReviewModalOpen(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>AI Code Review</h2>
            <div className="modal-content-scrollable"><Markdown>{aiReviewMessage}</Markdown></div>
            <div className="modal-actions"><button className="btn btn-secondary" onClick={() => setIsAiReviewModalOpen(false)}>Close</button></div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;

