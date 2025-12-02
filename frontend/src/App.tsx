import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ScrollToTop } from './components/common/ScrollToTop';
import NotFound from './pages/OtherPage/NotFound';
import AppRoutes from './App/Routes/AppRoutes';

export default function App() {
  return (
    <>
      <Router>
        <ScrollToTop />
        <Routes>
          {AppRoutes()} {/* ✅ Call it here */}
          <Route path='*' element={<NotFound />} />
        </Routes>
      </Router>
    </>
  );
}
