import { Routes, Route } from 'react-router-dom';
import { UserProvider } from './contexts/UserContext';
import UserSelectionPage from './components/UserSelectionPage';
import DashboardPage from './components/DashboardPage';
import ChallengeSelectionPage from './components/ChallengeSelectionPage';
import ScoringPage from './components/ScoringPage';
import ResultPage from './components/ResultPage';
import RankingPage from './components/RankingPage';
import GrowthReportPage from './components/GrowthReportPage';
import AppLayout from './components/AppLayout';

function App() {
  return (
    <div className="App">
      <UserProvider>
        <Routes>
          {/* Routes without the sidebar */}
          <Route path='/' element = {<UserSelectionPage/>}/>
          <Route path='/scoring/:challengeId' element={<ScoringPage/>}/>
          <Route path="/result" element={<ResultPage />} />

          {/* Routes with the sidebar */}
          <Route element={<AppLayout />}>
            <Route path='/dashboard' element={<DashboardPage/>}/>
            <Route path='/challenges' element={<ChallengeSelectionPage/>}/>
            <Route path="/ranking" element={<RankingPage />} />
            <Route path="/report" element={<GrowthReportPage />} />
          </Route>
        </Routes>
      </UserProvider>
    </div>
  );
}

export default App;
