import CopyText from '@/components/CopyText';
import { useState, useEffect } from 'react';

export default function Home() {
  const [loading, setLoading] = useState(false);
  const [testing, setTesting] = useState(false);
  const [history, setHistory] = useState([]);
  const [histLoading, setHistLoading] = useState(true);
  const [histError, setHistError] = useState(null);

  const backendUrl = 'http://10.1.10.158:61002';

  // Fetch history from the db
  const fetchHistory = async () => {
    setHistLoading(true);
    setHistError(null);
    try {
      const res = await fetch(backendUrl + '/api/history');
      if (!res.ok) throw new Error(`Status ${res.status}`);
      const json = await res.json();
      setHistory(json.history || []);
    } catch (err) {
      console.error('History fetch error', err);
      setHistError('Failed to load history');
    } finally {
      setHistLoading(false);
    }
  };

  // On mount, load history
  useEffect(() => {
    fetchHistory();
  }, []);

  const releaseTreat = async () => {
    setLoading(true)
    try {
      const result = await fetch(backendUrl + '/api/servo', { method: 'GET' })
      const json = await result.json()
      if (json.success) {
        // Refresh history to include the new event
        await fetchHistory();
      } else {
        alert('Failed to release treat: ' + (json.message || 'Unknown error'));
        console.error('Error:', json)
      }
    } catch (error) {
      console.error(error)
      alert('An error occurred while releasing the treat:' + error)
    } finally {
      setLoading(false)
    }
  }

  const test = async () => {
    setTesting(true)
    try {
      const result = await fetch(backendUrl + '/api/test', { method: 'GET'})
      const json = await result.json()
      if (json.success) {
        alert('Test successful: ' + (json.message || 'Unknown success'));
      } else {
        alert('Test failed: ' + (json.message || 'Unknown error'));
        console.error('Error:', json);
      }
    } catch (errors) {
      console.error(error);
      alert('An error occured while testing: ' + error);
    } finally {
      setTesting(false)
    }
  }

  return (
    <div className="div-component">
      <div className="div-content">
        <div id="home-title">Leo's Treat Dispenser</div>
        <h1 id="home-description">Leo go brrrr</h1>
        <img src="pictures/leo.webp" alt="Leo" />
        <h2 id="status"></h2>
        <button
          onClick={releaseTreat}
          disabled={loading}
          className="treat-button"
        >
          {loading ? 'Releasing...' : ' Release Treat'}
        </button>

        <button
          onClick={test}
          disabled={testing}
          className="test-button"
        >
          {testing ? 'Testing...' : ' Test'}
        </button>


        <section style={{ marginTop: '2rem' }}>
          <h2>History</h2>

          {histLoading && <p>Loading history…</p>}
          {histError && <p style={{ color: 'red' }}>{histError}</p>}

          {!histLoading && !histError && history.length === 0 && (
            <p>No dispense events yet.</p>
          )}

          {!histLoading && !histError && history.length > 0 && (
            <ul
              style={{
                maxHeight: '200px',
                overflowY: 'auto',
                padding: 0,
                listStyle: 'none',
                border: '1px solid #ccc',
                borderRadius: '4px'
              }}
            >
              {history.map((evt) => (
                <li
                  key={evt.id}
                  style={{
                    padding: '0.5rem 1rem',
                    borderBottom: '1px solid #eee'
                  }}
                >
                  {new Date(evt.timestamp).toLocaleString()}
                </li>
              ))}
            </ul>
          )}
        </section>

      </div>
    </div>
  );
}
