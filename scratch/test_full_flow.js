
async function fullFlow() {
  try {
    // 1. Mock image (small base64)
    const mockImage = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==";

    console.log("Testing describe-photo...");
    const visionRes = await fetch('http://localhost:3000/api/describe-photo', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ image: mockImage })
    });
    console.log('Vision Status:', visionRes.status);
    const visionData = await visionRes.json();
    console.log('Vision Output:', visionData);

    if (visionData.error) throw new Error(visionData.error);

    console.log("\nTesting generate...");
    const genRes = await fetch('http://localhost:3000/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ topic: visionData.description, humorStyle: 'GenZ' })
    });
    console.log('Generate Status:', genRes.status);
    const genData = await genRes.json();
    console.log('Generate Output:', genData);

  } catch (e) {
    console.error('Flow failed:', e);
  }
}
fullFlow();
