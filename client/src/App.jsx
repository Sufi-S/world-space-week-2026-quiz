import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Link, useLocation } from 'react-router-dom';
import Home from './pages/Home';
import Topics from './pages/Topics';
import TopicDetail from './pages/TopicDetail';
import Practice from './pages/Practice';
import ReviewMistakes from './pages/ReviewMistakes';
import Admin from './pages/Admin';
import AdminQuestion from './pages/AdminQuestion';
import './App.css';

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => { window.scrollTo(0, 0); }, [pathname]);
  return null;
}

function Nav() {
  const loc = useLocation();
  const isAdmin = loc.pathname.startsWith('/admin');
  return (
    <header className="app-header">
      <nav>
        <Link to="/" className="logo">
          <span className="logo-icon">&#x1F680;</span>
          <span className="logo-text">Space Quiz 2026</span>
        </Link>
        <div className="nav-links">
          <Link to="/" className={loc.pathname === '/' ? 'active' : ''}>Home</Link>
          <Link to="/topics" className={loc.pathname.startsWith('/topics') ? 'active' : ''}>Topics</Link>
          <Link to="/practice" className={loc.pathname.startsWith('/practice') ? 'active' : ''}>Practice</Link>
          <Link to="/review" className={loc.pathname === '/review' ? 'active' : ''}>Review</Link>
          <Link to="/admin" className={isAdmin ? 'active admin-link' : 'admin-link'}>Admin</Link>
        </div>
      </nav>
    </header>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <Nav />
      <main className="app-main">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/topics" element={<Topics />} />
          <Route path="/topics/:id" element={<TopicDetail />} />
          <Route path="/topics/:id/practice" element={<Practice />} />
          <Route path="/practice" element={<Practice />} />
          <Route path="/review" element={<ReviewMistakes />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="/admin/question/:id" element={<AdminQuestion />} />
        </Routes>
      </main>
    </BrowserRouter>
  );
}
