import Feed from './screens/FeedScreen/Feed';
import HomeScreen from './screens/HomeScreen/HomeScreen';
import Login from './screens/LoginScreen/Login';

import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';


const App = () => {
    return (
        <Router>
            <Routes>
                <Route path="/" element={<Login />} />
                <Route path="/home" element={<HomeScreen />} />
                <Route path="/feed" element={<Feed />} />
            </Routes>
        </Router>
    );
};

export default App;
