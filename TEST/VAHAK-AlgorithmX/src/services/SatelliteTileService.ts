import * as THREE from 'three';

/**
 * Service to load and stitch real Google Maps / Esri Satellite XYZ tiles
 * for actual Indian rural villages into a high-resolution Three.js CanvasTexture.
 */

// GPS Center Coordinates for notable Indian Rural Villages
export const INDIAN_VILLAGE_COORDINATES = {
  dharnai: { name: 'Dharnai Village (Bihar)', lat: 24.981, lon: 85.002, zoom: 14 },
  koraput: { name: 'Koraput Outpost (Odisha)', lat: 18.813, lon: 82.711, zoom: 14 },
  majuli: { name: 'Majuli River Island (Assam)', lat: 26.953, lon: 94.202, zoom: 13 },
  chamoli: { name: 'Chamoli Valley (Uttarakhand)', lat: 30.412, lon: 79.332, zoom: 13 },
  bastar: { name: 'Bastar Forest (Chhattisgarh)', lat: 19.075, lon: 82.029, zoom: 13 },
  wayanad: { name: 'Wayanad High Range (Kerala)', lat: 11.685, lon: 76.132, zoom: 13 },
};

function latLonToTile(lat: number, lon: number, zoom: number) {
  const n = Math.pow(2, zoom);
  const x = Math.floor(((lon + 180) / 360) * n);
  const latRad = (lat * Math.PI) / 180;
  const y = Math.floor(((1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2) * n);
  return { x, y, z: zoom };
}

export function createGoogleSatelliteTexture(
  villageKey: keyof typeof INDIAN_VILLAGE_COORDINATES = 'dharnai',
  onLoaded?: (texture: THREE.CanvasTexture) => void
): THREE.CanvasTexture {
  const info = INDIAN_VILLAGE_COORDINATES[villageKey] || INDIAN_VILLAGE_COORDINATES.dharnai;
  const centerTile = latLonToTile(info.lat, info.lon, info.zoom);

  const canvas = document.createElement('canvas');
  const gridSize = 4; // 4x4 tiles = 1024x1024 px high res
  canvas.width = gridSize * 256;
  canvas.height = gridSize * 256;
  const ctx = canvas.getContext('2d');

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.ClampToEdgeWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  texture.generateMipmaps = true;
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  texture.magFilter = THREE.LinearFilter;

  if (!ctx) return texture;

  // Fill default dark topographic slate while tiles load
  ctx.fillStyle = '#1E293B';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  let loadedCount = 0;
  const totalTiles = gridSize * gridSize;
  const halfGrid = Math.floor(gridSize / 2);

  for (let gy = 0; gy < gridSize; gy++) {
    for (let gx = 0; gx < gridSize; gx++) {
      const tileX = centerTile.x + (gx - halfGrid);
      const tileY = centerTile.y + (gy - halfGrid);
      const z = centerTile.z;

      // Google Satellite Hybrid tile URL with fallback to Esri World Imagery
      const googleTileUrl = `https://mt1.google.com/vt/lyrs=y&x=${tileX}&y=${tileY}&z=${z}`;
      const esriTileUrl = `https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/${z}/${tileY}/${tileX}`;

      const img = new Image();
      img.crossOrigin = 'anonymous';

      const drawX = gx * 256;
      const drawY = gy * 256;

      img.onload = () => {
        ctx.drawImage(img, drawX, drawY, 256, 256);
        loadedCount++;
        if (loadedCount >= totalTiles) {
          // Add Google Maps overlay labels and coordinate watermark
          drawGoogleMapOverlay(ctx, canvas.width, canvas.height, info);
          texture.needsUpdate = true;
          if (onLoaded) onLoaded(texture);
        }
      };

      img.onerror = () => {
        // Fallback to Esri World Imagery if Google tile is blocked
        const fallbackImg = new Image();
        fallbackImg.crossOrigin = 'anonymous';
        fallbackImg.onload = () => {
          ctx.drawImage(fallbackImg, drawX, drawY, 256, 256);
          loadedCount++;
          if (loadedCount >= totalTiles) {
            drawGoogleMapOverlay(ctx, canvas.width, canvas.height, info);
            texture.needsUpdate = true;
            if (onLoaded) onLoaded(texture);
          }
        };
        fallbackImg.onerror = () => {
          loadedCount++;
          if (loadedCount >= totalTiles) {
            drawGoogleMapOverlay(ctx, canvas.width, canvas.height, info);
            texture.needsUpdate = true;
          }
        };
        fallbackImg.src = esriTileUrl;
      };

      img.src = googleTileUrl;
    }
  }

  return texture;
}

function drawGoogleMapOverlay(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  villageInfo: { name: string; lat: number; lon: number }
) {
  // Google Maps Style Bottom Bar Watermark
  ctx.save();
  ctx.fillStyle = 'rgba(15, 23, 42, 0.75)';
  ctx.fillRect(16, height - 52, 680, 36);
  ctx.strokeStyle = 'rgba(56, 189, 248, 0.5)';
  ctx.lineWidth = 1;
  ctx.strokeRect(16, height - 52, 680, 36);

  ctx.fillStyle = '#FFFFFF';
  ctx.font = 'bold 13px monospace';
  ctx.fillText(`GOOGLE MAPS SATELLITE • ${villageInfo.name.toUpperCase()}`, 28, height - 32);

  ctx.fillStyle = '#38BDF8';
  ctx.font = '11px monospace';
  ctx.fillText(`LAT: ${villageInfo.lat}°N  LON: ${villageInfo.lon}°E  •  3D DISPATCH MESH`, 28, height - 19);

  // Google Maps Style Top Right Compass
  ctx.beginPath();
  ctx.arc(width - 50, 50, 32, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(15, 23, 42, 0.8)';
  ctx.fill();
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
  ctx.stroke();

  ctx.fillStyle = '#EF4444';
  ctx.font = 'bold 14px monospace';
  ctx.fillText('N ▲', width - 64, 46);
  ctx.fillStyle = '#94A3B8';
  ctx.font = '10px monospace';
  ctx.fillText('MAPS', width - 62, 62);

  ctx.restore();
}
