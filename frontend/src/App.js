import { Routes, Route } from 'react-router-dom';
import { UserProvider } from './contexts/UserContext';
import UserSelectionPage from './components/UserSelectionPage';
import DashboardPage from './components/DashboardPage';
import ChallengeSelectionPage from './components/ChallengeSelectionPage';
import ScoringPage from './components/ScoringPage';
import ResultPage from './components/ResultPage';
import RankingPage from './components/RankingPage';
import GrowthReportPage from './components/GrowthReportPage';


function App() {
  return (
    <div className="App">
      <UserProvider>
        <Routes>
          <Route path='/' element = {<UserSelectionPage/>}/>
          <Route path='/dashboard' element={<DashboardPage/>}/>
          <Route path='/challenges' element={<ChallengeSelectionPage/>}/>
          <Route path='/scoring/:challengeId' element={<ScoringPage/>}/>
          <Route path="/result" element={<ResultPage />} />
          <Route path="/ranking" element={<RankingPage />} />
          <Route path="/report" element={<GrowthReportPage />} />
        </Routes>
      </UserProvider>
    </div>
  );
}

export default App;
