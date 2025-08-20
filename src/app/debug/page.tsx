'use client';

import { useEffect, useState } from 'react';

export default function DebugPage() {
  const [localStorageData, setLocalStorageData] = useState<{[key: string]: string}>({});

  useEffect(() => {
    // Получаем все данные из localStorage
    const data: {[key: string]: string} = {};
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key) {
        data[key] = localStorage.getItem(key) || '';
      }
    }
    setLocalStorageData(data);
  }, []);

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Debug Information</h1>
      
      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-2">LocalStorage Data:</h2>
        <pre className="bg-gray-100 p-4 rounded">
          {JSON.stringify(localStorageData, null, 2)}
        </pre>
      </div>

      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-2">User ID:</h2>
        <p className="bg-blue-100 p-2 rounded">
          {localStorageData.userId || 'Not found'}
        </p>
      </div>

      <div>
        <h2 className="text-xl font-semibold mb-2">Test API Calls:</h2>
        <div className="space-y-2">
          <button 
            onClick={() => {
              const userId = localStorage.getItem('userId');
              console.log('UserId:', userId);
              alert(`UserId: ${userId || 'Not found'}`);
            }}
            className="bg-blue-500 text-white px-4 py-2 rounded"
          >
            Check UserId
          </button>
          
          <button 
            onClick={() => {
              const userId = localStorage.getItem('userId');
              fetch('/api/projects', {
                headers: {
                  'X-User-ID': userId || '',
                },
              })
              .then(response => {
                console.log('Projects API status:', response.status);
                return response.json();
              })
              .then(data => {
                console.log('Projects API data:', data);
                alert(`Projects API: ${response.status} - ${data.projects?.length || 0} projects`);
              })
              .catch(error => {
                console.error('Projects API error:', error);
                alert('Projects API error');
              });
            }}
            className="bg-green-500 text-white px-4 py-2 rounded ml-2"
          >
            Test Projects API
          </button>

          <button 
            onClick={() => {
              const userId = localStorage.getItem('userId');
              fetch('/api/projects/demo-project-1', {
                headers: {
                  'X-User-ID': userId || '',
                },
              })
              .then(response => {
                console.log('Project API status:', response.status);
                return response.json();
              })
              .then(data => {
                console.log('Project API data:', data);
                alert(`Project API: ${response.status} - ${data.project ? 'Success' : 'Failed'}`);
              })
              .catch(error => {
                console.error('Project API error:', error);
                alert('Project API error');
              });
            }}
            className="bg-purple-500 text-white px-4 py-2 rounded ml-2"
          >
            Test Project API
          </button>
        </div>
      </div>
    </div>
  );
}