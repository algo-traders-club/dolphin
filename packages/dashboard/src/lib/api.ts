// API utility functions for fetching data

export async function fetchPositionData() {
  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || '';
    const response = await fetch(`${apiUrl}/api/position`, {
      next: { revalidate: 60 }, // Revalidate data every 60 seconds
    });
    
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching position data:', error);
    // Return null to handle error in the component
    return null;
  }
}

export async function checkHealth() {
  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || '';
    const response = await fetch(`${apiUrl}/api/health`, {
      next: { revalidate: 30 }, // Revalidate every 30 seconds
    });
    
    if (!response.ok) {
      return { status: 'error', message: `API error: ${response.status}` };
    }
    
    return await response.json();
  } catch (error) {
    console.error('Health check error:', error);
    return { status: 'error', message: 'Could not connect to API' };
  }
}
