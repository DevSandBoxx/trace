import { useState, useEffect } from 'react';
import './login.css'; // Make sure index.css is in the same directory
import { auth } from '../../../firebase';
import { useNavigate } from 'react-router-dom';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, onAuthStateChanged } from 'firebase/auth';

const Login = () => {

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      await signInWithEmailAndPassword(auth, email, password);
      // Redirect or show success message after login
      navigate("/home");
    } catch (error) {
      console.error('Login failed:', error);
      // Handle login error (e.g., show error message)
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    try {
      await createUserWithEmailAndPassword(auth, email, password);
      // Redirect or show success message after registering
      navigate("/home");
    } catch (error) {
      console.error('Registration failed:', error);
      // Handle registration error (e.g., show error message)
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        // User is signed in
        console.log("User is signed in:", user);
        navigate("/home");
      } else {
        // User is logged out
        console.log("User is logged out");
        navigate("/");
      }
    });

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, []);

  const handleBackToMainPage = () => {
    window.location.href = '/'; // Redirect to the main page
  };

  return (
    <div>
      <header>
        <h1>--- TRACE ---</h1>
      </header>
      <main style={{ width: '100%', marginTop: '5%', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <section>
          <div className="glass-square">
            <h1>Share Ur Creativity</h1>
            <form id="loginForm">
              <div className="input-container">
                <input
                  type="text"
                  placeholder="Enter your Email here..."
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
                <div className="underline"></div>
              </div>
              <br />
              <div className="input-container">
                <input
                  type="password"
                  placeholder="Enter your Password here..."
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <div className="underline"></div>
              </div>
              <br />
              <div>
                <button className="cool-button" type="submit" onClick={handleLogin}>Log in</button>
                <button className="cool-button" type="submit" onClick={handleRegister}>Register</button>
              </div>
              
            </form>
            <button className="cool-button" onClick={handleBackToMainPage}>Back to Main Page</button>
          </div>
        </section>
      </main>
      <footer>
        <p>&copy; TRACE</p>
        <p>Contributors - Basil Khwaja, Heet Shah, Arvind, Areeb Ehsan</p>
      </footer>
    </div>
  );
};

export default Login;
