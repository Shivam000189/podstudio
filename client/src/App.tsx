import './App.css'
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Login } from './pages/Login';
import Signup from './pages/Signup';
import { Dashboard } from './pages/Dashboard';
import { Home } from './pages/Home';
import { Rooms } from './pages/Room';


function App() {

  return (
    
      <BrowserRouter>
          <Routes>
              {/* <Route path='/login' element={<Login />} />
              <Route path='/register' element={<Signup />} />
              <Route path='/dashboard' element={<Dashboard />} /> */}

            <Route path='/home' element={<Home />} />
            <Route path="/rooms/:id" element={<Rooms/>} />
          </Routes>
      </BrowserRouter>
    
  )
}

export default App
