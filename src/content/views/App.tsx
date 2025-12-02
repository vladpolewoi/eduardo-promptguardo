import { useState, useEffect } from 'react';
import { useEmails } from '../context/EmailContext';
import { useTheme } from '../hooks/useTheme';
import { FloatingActionButton } from '../components/FloatingActionButton';
import { EmailModal } from '../components/EmailModal';
import { IssuesTab } from '../components/IssuesTab';
import { HistoryTab } from '../components/HistoryTab';
import './App.css';

function App() {
  const [show, setShow] = useState(false);
  const { emails, currentIssues, loading, dismissEmail, getDismissedUntil } = useEmails();

  useTheme();

  useEffect(() => {
    if (currentIssues.length > 0) {
      setShow(true);
    }
  }, [currentIssues]);

  const toggleModal = () => setShow((prev) => !prev);
  const closeModal = () => setShow(false);

  return (
    <>
      <FloatingActionButton onClick={toggleModal} />

      {show && (
        <EmailModal
          onClose={closeModal}
          issuesTab={
            <IssuesTab loading={loading} currentIssues={currentIssues} onDismiss={dismissEmail} />
          }
          historyTab={
            <HistoryTab loading={loading} emails={emails} getDismissedUntil={getDismissedUntil} />
          }
        />
      )}
    </>
  );
}

export default App;

