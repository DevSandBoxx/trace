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

  return (
    <div>
      <header>
        <h1 className='login_title'>trace ai</h1>
      </header>
      <main style={{ width: '100%', marginTop: '5%', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <section>
          <div className="glass-square">
            <h1>share your <span className="creativity">creativity</span></h1>
            <form id="loginForm">
              <div className="input-container">
                <input
                  type="text"
                  placeholder="email here"
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
                  placeholder="password here"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <div className="underline"></div>
              </div>
              <br />
              <div>
                <button className="cool-button" type="submit" onClick={handleLogin}>log in</button>
                <button className="cool-button" type="submit" onClick={handleRegister}>register</button>
              </div>
              
            </form>
          </div>
        </section>
      </main>
      <footer>
        <p>&copy; trace ai</p>
        <p>contributors - basil khwaja, heet shah, arvind ganeshkumar, areeb ehsan</p>
      </footer>
    </div>
  );
};

export default Login;
