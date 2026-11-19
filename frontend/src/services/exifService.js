/**
 * CivicConnect EXIF Metadata Service
 * 
 * Why this is created in src/services/:
 * 1. Rule 3 (Folder Structure & Layered Architecture): Centralizes binary EXIF parsing
 *    away from React UI components.
 * 2. Edge Case Protection: When citizens upload photos taken on smartphones, this parses
 *    EXIF APP1 GPS tags to auto-locate the issue.
 * 3. Graceful Fallback: If an image lacks EXIF GPS tags (common in web downloads, screenshots,
 *    or privacy-stripped files), this gracefully returns { hasGps: false, lat: null, lng: null },
 *    enabling the UI to smoothly fall back to device GPS or municipal center without error.
 */

import { isValidCoordinate } from './mapUtils';

// Helper to read ArrayBuffer safely across browser and test environments
const readBlobAsArrayBuffer = async (blob) => {
  if (typeof blob.arrayBuffer === 'function') {
    try {
      return await blob.arrayBuffer();
    } catch (e) {
      // Fallback to FileReader
    }
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error('Failed to read image buffer'));
    reader.readAsArrayBuffer(blob);
  });
};

/**
 * Extracts GPS latitude and longitude from an uploaded image file (Blob/File).
 * 
 * Supports standard JPEG files containing EXIF APP1 headers.
 * For non-JPEG files or images without GPS tags, returns a clean fallback object.
 * 
 * @param {File|Blob} file - The uploaded image file
 * @returns {Promise<{ hasGps: boolean, lat: number|null, lng: number|null, message: string }>}
 */
export const extractExifGps = async (file) => {
  if (!file || !(file instanceof Blob)) {
    return {
      hasGps: false,
      lat: null,
      lng: null,
      message: 'No valid image file provided.'
    };
  }

  // Only JPEG files have APP1 EXIF segment
  const isJpeg = file.type === 'image/jpeg' || file.type === 'image/jpg' || file.name?.toLowerCase().endsWith('.jpg') || file.name?.toLowerCase().endsWith('.jpeg');
  if (!isJpeg) {
    return {
      hasGps: false,
      lat: null,
      lng: null,
      message: 'Non-JPEG image format; EXIF GPS not applicable.'
    };
  }

  try {
    // Read the first 128KB which contains the EXIF APP1 metadata headers
    const slice = file.slice(0, 131072);
    const buffer = await readBlobAsArrayBuffer(slice);
    const dataView = new DataView(buffer);

    // Verify JPEG Start of Image (SOI) marker: 0xFFD8
    if (dataView.byteLength < 4 || dataView.getUint16(0) !== 0xFFD8) {
      return {
        hasGps: false,
        lat: null,
        lng: null,
        message: 'Invalid JPEG file header.'
      };
    }

    let offset = 2;
    let exifOffset = -1;

    // Scan for APP1 marker (0xFFE1)
    while (offset < dataView.byteLength - 4) {
      const marker = dataView.getUint16(offset);
      offset += 2;

      if (marker === 0xFFE1) {
        exifOffset = offset + 2; // Skip 2-byte segment length
        break;
      } else if ((marker & 0xFF00) === 0xFF00 && marker !== 0xFF00) {
        // Skip current marker payload
        const length = dataView.getUint16(offset);
        offset += length;
      } else {
        break;
      }
    }

    if (exifOffset === -1 || exifOffset + 14 > dataView.byteLength) {
      return {
        hasGps: false,
        lat: null,
        lng: null,
        message: 'No EXIF metadata segment found in photo.'
      };
    }

    // Verify "Exif\0\0" header (0x45 0x78 0x69 0x66 0x00 0x00)
    const exifHeader = String.fromCharCode(
      dataView.getUint8(exifOffset),
      dataView.getUint8(exifOffset + 1),
      dataView.getUint8(exifOffset + 2),
      dataView.getUint8(exifOffset + 3)
    );

    if (exifHeader !== 'Exif') {
      return {
        hasGps: false,
        lat: null,
        lng: null,
        message: 'EXIF signature not present in photo.'
      };
    }

    // TIFF header starts 6 bytes after the start of EXIF marker
    const tiffOffset = exifOffset + 6;
    const byteOrder = dataView.getUint16(tiffOffset);
    const littleEndian = byteOrder === 0x4949; // "II" = Intel Little Endian, "MM" = Motorola Big Endian

    if (!littleEndian && byteOrder !== 0x4D4D) {
      return {
        hasGps: false,
        lat: null,
        lng: null,
        message: 'Unsupported TIFF byte ordering in photo.'
      };
    }

    // Read offset to 0th IFD (usually 8)
    const firstIfdOffset = dataView.getUint32(tiffOffset + 4, littleEndian);
    if (tiffOffset + firstIfdOffset + 2 > dataView.byteLength) {
      return {
        hasGps: false,
        lat: null,
        lng: null,
        message: 'Corrupted EXIF IFD directory offset.'
      };
    }

    let ifdPointer = tiffOffset + firstIfdOffset;
    const ifdEntries = dataView.getUint16(ifdPointer, littleEndian);
    ifdPointer += 2;

    let gpsIfdOffset = -1;
    for (let i = 0; i < ifdEntries; i++) {
      if (ifdPointer + 12 > dataView.byteLength) break;
      const tag = dataView.getUint16(ifdPointer, littleEndian);
      // Tag 0x8825 is the pointer to GPS IFD
      if (tag === 0x8825) {
        gpsIfdOffset = dataView.getUint32(ifdPointer + 8, littleEndian);
        break;
      }
      ifdPointer += 12;
    }

    if (gpsIfdOffset === -1) {
      return {
        hasGps: false,
        lat: null,
        lng: null,
        message: 'No GPS coordinates found in image EXIF data.'
      };
    }

    // Parse GPS IFD entries
    let gpsPointer = tiffOffset + gpsIfdOffset;
    if (gpsPointer + 2 > dataView.byteLength) {
      return {
        hasGps: false,
        lat: null,
        lng: null,
        message: 'Corrupt GPS directory pointer in photo.'
      };
    }

    const gpsEntries = dataView.getUint16(gpsPointer, littleEndian);
    gpsPointer += 2;

    let latRef = null;
    let latArray = null;
    let lngRef = null;
    let lngArray = null;

    // Helper to read 64-bit rational (numerator / denominator)
    const readRational = (rationalOffset) => {
      const num = dataView.getUint32(rationalOffset, littleEndian);
      const den = dataView.getUint32(rationalOffset + 4, littleEndian);
      return den === 0 ? 0 : num / den;
    };

    for (let i = 0; i < gpsEntries; i++) {
      if (gpsPointer + 12 > dataView.byteLength) break;
      const tag = dataView.getUint16(gpsPointer, littleEndian);
      const valueOffset = dataView.getUint32(gpsPointer + 8, littleEndian);

      if (tag === 0x0001) {
        // GPSLatitudeRef ('N' or 'S')
        latRef = String.fromCharCode(dataView.getUint8(gpsPointer + 8));
      } else if (tag === 0x0002) {
        // GPSLatitude (3 rationals: degrees, minutes, seconds)
        const absOffset = tiffOffset + valueOffset;
        if (absOffset + 24 <= dataView.byteLength) {
          latArray = [
            readRational(absOffset),
            readRational(absOffset + 8),
            readRational(absOffset + 16)
          ];
        }
      } else if (tag === 0x0003) {
        // GPSLongitudeRef ('E' or 'W')
        lngRef = String.fromCharCode(dataView.getUint8(gpsPointer + 8));
      } else if (tag === 0x0004) {
        // GPSLongitude (3 rationals: degrees, minutes, seconds)
        const absOffset = tiffOffset + valueOffset;
        if (absOffset + 24 <= dataView.byteLength) {
          lngArray = [
            readRational(absOffset),
            readRational(absOffset + 8),
            readRational(absOffset + 16)
          ];
        }
      }
      gpsPointer += 12;
    }

    if (latArray && lngArray) {
      let lat = latArray[0] + latArray[1] / 60 + latArray[2] / 3600;
      let lng = lngArray[0] + lngArray[1] / 60 + lngArray[2] / 3600;

      if (latRef === 'S') lat = -lat;
      if (lngRef === 'W') lng = -lng;

      if (isValidCoordinate(lat, lng)) {
        return {
          hasGps: true,
          lat: Number(lat.toFixed(5)),
          lng: Number(lng.toFixed(5)),
          message: 'GPS coordinates successfully extracted from photo.'
        };
      }
    }

    return {
      hasGps: false,
      lat: null,
      lng: null,
      message: 'Incomplete or unreadable GPS data in photo.'
    };
  } catch (err) {
    console.warn('[exifService] Non-critical error inspecting photo EXIF:', err.message);
    return {
      hasGps: false,
      lat: null,
      lng: null,
      message: 'Could not read image EXIF data.'
    };
  }
};
