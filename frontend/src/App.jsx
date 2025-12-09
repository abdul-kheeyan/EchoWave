import { AuthProvider } from "./contexts/AuthContext.jsx";
import Authentication from './pages/authentication.jsx';
import LandingPage from './pages/landing.jsx';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import HomeComponent from "./pages/home.jsx";
import VideoMeetComponent from "./pages/VideoMeet.jsx";
import History from "./pages/history.jsx";


function App() {
  return (
    <Router>
      <AuthProvider>
      <Routes>
          <Route path='/' element={<LandingPage />} />
          <Route path='/auth' element={<Authentication />} />
          <Route path='/home' element={<HomeComponent />} />
          <Route path='/history' element={<History />} />
          <Route path='/:meetingCode' element={<VideoMeetComponent />} />
          <Route path='/:url' element={<VideoMeetComponent />} />
      </Routes>

      </AuthProvider>
    </Router>
  );
}

export default App;
