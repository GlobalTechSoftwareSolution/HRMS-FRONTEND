import { NextRequest } from "next/server";

// Helper function to try LocationIQ first
async function getLocationIQAddress(lat: string, lon: string) {
  try {
    const API_KEY = process.env.LOCATIONIQ_API_KEY || 'pk.cb86e99650036bef1474ebdb7586f405';
    
    // Add timeout to prevent hanging requests
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
    
    const response = await fetch(
      `https://us1.locationiq.com/v1/reverse?key=${API_KEY}&lat=${lat}&lon=${lon}&format=json&addressdetails=1`,
      { 
        next: { revalidate: 3600 }, // Cache for 1 hour
        signal: controller.signal
      }
    );
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      console.error('LocationIQ API error:', response.status, response.statusText);
      return null;
    }
    
    const data = await response.json();
    return data.display_name ? data : null;
  } catch (error: unknown) {
    console.error('LocationIQ error:', error instanceof Error ? error.message : String(error));
    return null;
  }
}

// Helper function to try Google Maps as fallback
async function getGoogleMapsAddress(lat: string, lon: string) {
  try {
    const API_KEY = process.env.GOOGLE_MAPS_API_KEY;
    if (!API_KEY) {
      return null;
    }
    
    // Add timeout to prevent hanging requests
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
    
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lon}&key=${API_KEY}`,
      { signal: controller.signal }
    );
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      console.error('Google Maps API error:', response.status, response.statusText);
      return null;
    }
    
    const data = await response.json();
    if (data.results && data.results.length > 0) {
      return {
        display_name: data.results[0].formatted_address,
        lat,
        lon
      };
    }
    
    return null;
  } catch (error: unknown) {
    console.error('Google Maps error:', error instanceof Error ? error.message : String(error));
    return null;
  }
}

export async function GET(request: NextRequest) {
  console.log('Reverse geocoding API route called');
  const { searchParams } = new URL(request.url);
  const lat = searchParams.get("lat");
  const lon = searchParams.get("lon");

  console.log('Reverse geocoding request received:', { lat, lon });

  if (!lat || !lon) {
    console.error('Missing latitude or longitude parameters');
    return new Response(JSON.stringify({ error: "Latitude and longitude are required" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    // Try LocationIQ first
    console.log('Attempting LocationIQ geocoding for:', { lat, lon });
    let addressData = await getLocationIQAddress(lat, lon);
    
    // If LocationIQ fails, try Google Maps as fallback
    if (!addressData) {
      console.log('LocationIQ failed, attempting Google Maps geocoding for:', { lat, lon });
      addressData = await getGoogleMapsAddress(lat, lon);
    }
    
    // If both fail, return coordinates as fallback
    if (!addressData) {
      console.log('Both geocoding services failed, returning coordinates for:', { lat, lon });
      addressData = {
        lat,
        lon,
        display_name: `Latitude: ${lat}, Longitude: ${lon}`
      };
    }
    
    console.log('Successfully resolved address for:', { lat, lon, display_name: addressData.display_name });
    return new Response(JSON.stringify(addressData), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    console.error('Reverse geocoding error:', error instanceof Error ? error.message : String(error));
    // Return coordinates as final fallback when all APIs fail
    return new Response(JSON.stringify({ 
      lat,
      lon,
      display_name: `Latitude: ${lat}, Longitude: ${lon}`
    }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }
}