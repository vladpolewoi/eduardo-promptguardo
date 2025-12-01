import Logo from '@/assets/crx.svg';
import { useState, useEffect } from 'react';
import './App.css';

function App() {
  const [show, setShow] = useState(false);
  const toggle = () => setShow(!show);

  const [emails, setEmails] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Load detected emails from storage
    chrome.storage.local.get('detectedEmails', (result) => {
      const detectedEmails = result.detectedEmails || {};
      setEmails(Object.keys(detectedEmails));
      setLoading(false);
    });
  }, []);

  return (
    <div className="popup-container">
      {show && (
        <div className={`popup-content ${show ? 'opacity-100' : 'opacity-0'}`}>
          <h1>Boker Tov</h1>

          <div>
            {loading ? (
              <p>Loading...</p>
            ) : emails.length === 0 ? (
              <p>Empty</p>
            ) : (
              <ul>
                {emails.map((email) => (
                  <li key={email}>{email}</li>
                ))}
              </ul>
            )}

            <p>Total: {emails.length}</p>
          </div>
        </div>
      )}
      <button className="toggle-button" onClick={toggle}>
        <img src={Logo} alt="CRXJS logo" className="button-icon" />
      </button>
    </div>
  );
}

export default App;

