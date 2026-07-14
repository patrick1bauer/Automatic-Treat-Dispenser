import CopyText from '@/components/CopyText';
import { useState, useEffect } from 'react';

export default function Home() {
  const [releasingTreatState, setReleasingTreatState] = useState(false);

  const [testingState, setTestingState] = useState(false);

  const [historyLoadingState, setHistoryLoadingState] = useState(false);
  const [historyData, setHistoryData] = useState([]);
  const [historyErrorMessage, setHistoryErrorMessage] = useState(null);

  const [servoAngleOpenLoadingState, setServoAngleOpenLoadingState] = useState(false);
  const [servoAngleOpen, setServoAngleOpen] = useState(null);
  const [servoAngleOpenInput, setServoAngleOpenInput] = useState('');

  const [servoAngleClosedLoadingState, setServoAngleClosedLoadingState] = useState(false);
  const [servoAngleClosed, setServoAngleClosed] = useState(null);
  const [servoAngleClosedInput, setServoAngleClosedInput] = useState('');

  const [servoOpenDurationLoadingState, setServoOpenDurationLoadingState] = useState(false);
  const [servoOpenDuration, setServoOpenDuration] = useState(null);
  const [servoOpenDurationInput, setServoOpenDurationInput] = useState('');

  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || (typeof window !== 'undefined' ? `http://${window.location.hostname}:61002` : 'http://localhost:61002');
  const appVersion = process.env.NEXT_PUBLIC_APP_VERSION || 'dev';

  // GET request to fetch history from the backend
  const getHistory = async () => {
    setHistoryLoadingState(true);
    setHistoryErrorMessage(null);
    try {
      const res = await fetch(backendUrl + '/api/get/history');
      if (!res.ok) throw new Error(`Status ${res.status}`);
      const json = await res.json();
      setHistoryData(json.history || []);
    } catch (err) {
      console.error('History fetch error', err);
      setHistoryErrorMessage('Failed to load history');
    } finally {
      setHistoryLoadingState(false);
    }
  };

  // On mount, load history and the current servo angle value
  useEffect(() => {
    getHistory();
    getServoAngleOpen();
    getServoAngleClosed();
    getServoOpenDuration();
  }, []);

  const releaseTreat = async () => {
    setReleasingTreatState(true)
    try {
      const result = await fetch(backendUrl + '/api/post/releaseTreat', { method: 'GET' })
      const json = await result.json()
      if (json.success) {
        // Refresh history to include the new event
        await getHistory();
      } else {
        alert('Failed to release treat: ' + (json.message || 'Unknown error'));
        console.error('Error:', json)
      }
    } catch (error) {
      console.error(error)
      alert('An error occurred while releasing the treat:' + error)
    } finally {
      setReleasingTreatState(false)
    }
  }

  const getTest = async () => {
    setTestingState(true)
    try {
      const result = await fetch(backendUrl + '/api/get/test', { method: 'GET'})
      const json = await result.json()
      if (json.success) {
        alert('Test successful: ' + (json.message || 'Success! Front end and back end are communicating properly.'));
      } else {
        alert('Test failed: ' + (json.message || 'Error! Front end and back end are not communicating properly.'));
        console.error('Error:', json);
      }
    } catch (error) {
      console.error(error);
      alert('An error occurred while testing: ' + error);
    } finally {
      setTestingState(false)
    }
  }

  const getServoAngleOpen = async () => {
    setServoAngleOpenLoadingState(true);
    try {
      const result = await fetch(backendUrl + '/api/get/servoAngleOpen', { method: 'GET' });
      const json = await result.json();
      const servoAngleOpenValue = json.servoAngleOpen ?? null;

      if (servoAngleOpenValue !== null) {
        setServoAngleOpen(servoAngleOpenValue);
        setServoAngleOpenInput(String(servoAngleOpenValue));
      } else {
        alert('Failed to get servo angle open: ' + (json.message || 'Unknown error'));
        console.error('Error:', json);
      }
    } catch (error) {
      console.error(error);
      alert('An error occurred while fetching the servo angle open: ' + error);
    } finally {
      setServoAngleOpenLoadingState(false);
    }
  }

  const putServoAngleOpen = async () => {
    const servoAngleOpenValue = Number(servoAngleOpenInput);

    if (Number.isNaN(servoAngleOpenValue)) {
      alert('Please enter a valid number for servoAngleOpen');
      return;
    }

    setServoAngleOpenLoadingState(true);
    try {
      const result = await fetch(backendUrl + '/api/put/servoAngleOpen', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ servoAngleOpen: servoAngleOpenValue })
      });
      const json = await result.json();

      if (json.success) {
        await getServoAngleOpen();
      } else {
        alert('Failed to update servo angle open: ' + (json.error || 'Unknown error'));
        console.error('Error:', json);
      }
    } catch (error) {
      console.error(error);
      alert('An error occurred while updating the servo angle open: ' + error);
    } finally {
      setServoAngleOpenLoadingState(false);
    }
  };

  const getServoAngleClosed = async () => {
    setServoAngleClosedLoadingState(true);
    try {
      const result = await fetch(backendUrl + '/api/get/servoAngleClosed', { method: 'GET' });
      const json = await result.json();
      const servoAngleClosedValue = json.servoAngleClosed ?? null;

      if (servoAngleClosedValue !== null) {
        setServoAngleClosed(servoAngleClosedValue);
        setServoAngleClosedInput(String(servoAngleClosedValue));
      } else {
        alert('Failed to get servo angle closed: ' + (json.message || 'Unknown error'));
        console.error('Error:', json);
      }
    } catch (error) {
      console.error(error);
      alert('An error occurred while fetching the servo angle closed: ' + error);
    } finally {
      setServoAngleClosedLoadingState(false);
    }
  }

  const putServoAngleClosed = async () => {
    const servoAngleClosedValue = Number(servoAngleClosedInput);

    if (Number.isNaN(servoAngleClosedValue)) {
      alert('Please enter a valid number for servoAngleClosed');
      return;
    }

    setServoAngleClosedLoadingState(true);
    try {
      const result = await fetch(backendUrl + '/api/put/servoAngleClosed', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ servoAngleClosed: servoAngleClosedValue })
      });
      const json = await result.json();

      if (json.success) {
        await getServoAngleClosed();
      } else {
        alert('Failed to update servo angle closed: ' + (json.error || 'Unknown error'));
        console.error('Error:', json);
      }
    } catch (error) {
      console.error(error);
      alert('An error occurred while updating the servo angle closed: ' + error);
    } finally {
      setServoAngleClosedLoadingState(false);
    }
  };

  const getServoOpenDuration = async () => {
    setServoOpenDurationLoadingState(true);
    try {
      const result = await fetch(backendUrl + '/api/get/servoOpenDuration', { method: 'GET' });
      const json = await result.json();
      const servoOpenDurationValue = json.servoOpenDuration ?? null;

      if (servoOpenDurationValue !== null) {
        setServoOpenDuration(servoOpenDurationValue);
        setServoOpenDurationInput(String(servoOpenDurationValue));
      } else {
        alert('Failed to get servo open duration: ' + (json.message || 'Unknown error'));
        console.error('Error:', json);
      }
    } catch (error) {
      console.error(error);
      alert('An error occurred while fetching the servo open duration: ' + error);
    } finally {
      setServoOpenDurationLoadingState(false);
    }
  }

  const putServoOpenDuration = async () => {
    const servoOpenDurationValue = Number(servoOpenDurationInput);

    if (Number.isNaN(servoOpenDurationValue)) {
      alert('Please enter a valid number for servoOpenDuration');
      return;
    }

    setServoOpenDurationLoadingState(true);
    try {
      const result = await fetch(backendUrl + '/api/put/servoOpenDuration', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ servoOpenDuration: servoOpenDurationValue })
      });
      const json = await result.json();

      if (json.success) {
        await getServoOpenDuration();
      } else {
        alert('Failed to update servo open duration: ' + (json.error || 'Unknown error'));
        console.error('Error:', json);
      }
    } catch (error) {
      console.error(error);
      alert('An error occurred while updating the servo open duration: ' + error);
    } finally {
      setServoOpenDurationLoadingState(false);
    }
  };

  return (
    <div className="div-component">
      <div className="div-content">
        <div id="home-title">Leo's Treat Dispenser</div>
        <h1 id="home-description">Leo go brrrr</h1>
        <img src="pictures/leo.webp" alt="Leo" />
        <h2 id="status"></h2>
        <button
          onClick={releaseTreat}
          disabled={releasingTreatState}
          className="treat-button"
        >
          {releasingTreatState ? 'Releasing Treat...' : ' Release Treat'}
        </button>
{/* 
        <button
          onClick={getTest}
          disabled={testingState}
          className="test-button"
        >
          {testingState ? 'Testing...' : ' Test'}
        </button> */}

        <div
          className="servo-settings"
        >
          <span>Servo Angle Open:</span>
          <span>{servoAngleOpenLoadingState ? 'Loading...' : servoAngleOpen ?? '—'}</span>
          <input
            type="number"
            value={servoAngleOpenInput}
            onChange={(event) => setServoAngleOpenInput(event.target.value)}
            placeholder="New value"
            style={{ width: '90px' }}
          />
          <button onClick={putServoAngleOpen} disabled={servoAngleOpenLoadingState}>
            {servoAngleOpenLoadingState ? 'Updating...' : 'Update'}
          </button>
        </div>

        <div
          className="servo-settings"
        >
          <span>Servo Angle Closed:</span>
          <span>{servoAngleClosedLoadingState ? 'Loading...' : servoAngleClosed ?? '—'}</span>
          <input
            type="number"
            value={servoAngleClosedInput}
            onChange={(event) => setServoAngleClosedInput(event.target.value)}
            placeholder="New value"
            style={{ width: '90px' }}
          />
          <button onClick={putServoAngleClosed} disabled={servoAngleClosedLoadingState}>
            {servoAngleClosedLoadingState ? 'Updating...' : 'Update'}
          </button>
        </div>

        <div
          className="servo-settings"
        >
          <span>Servo Open Duration:</span>
          <span>{servoOpenDurationLoadingState ? 'Loading...' : servoOpenDuration ?? '—'}</span>
          <input
            type="number"
            value={servoOpenDurationInput}
            onChange={(event) => setServoOpenDurationInput(event.target.value)}
            placeholder="New value"
            style={{ width: '90px' }}
          />
          <button onClick={putServoOpenDuration} disabled={servoOpenDurationLoadingState}>
            {servoOpenDurationLoadingState ? 'Updating...' : 'Update'}
          </button>
        </div>

        <section className="history-panel">
          <h2>History</h2>

          {historyLoadingState && <p>Loading history…</p>}
          {historyErrorMessage && <p style={{ color: 'red' }}>{historyErrorMessage}</p>}

          {!historyLoadingState && !historyErrorMessage && historyData.length === 0 && (
            <p>No dispense events yet.</p>
          )}

          {!historyLoadingState && !historyErrorMessage && historyData.length > 0 && (
            <ul className="history-list">
              {historyData.map((evt) => (
                <li key={evt.id}>
                  {new Date(evt.timestamp).toLocaleString()}
                </li>
              ))}
            </ul>
          )}
        </section>

        <footer className="app-footer">
          <span>Version: {appVersion}</span>
        </footer>
      </div>
    </div>
  );
}
