import { ref, uploadString, getDownloadURL } from 'firebase/storage';
import { storage } from '../firebase';
import { v4 as uuidv4 } from 'uuid';

/**
 * Uploads a base64 encoded image string to Firebase Storage
 * @param dataUrl - The base64 encoded image string (e.g., from canvas.toDataURL())
 * @param path - The folder path in storage (e.g., 'items' or 'locations')
 * @param userId - The ID of the user uploading the image
 * @returns The download URL of the uploaded image
 */
export async function uploadImage(dataUrl: string, path: string, userId: string): Promise<string> {
  // Extract base64 data if it has the data:image/jpeg;base64, prefix
  const isDataUrl = dataUrl.startsWith('data:');
  const filename = `${path}/${userId}/${uuidv4()}`;

  const storageRef = ref(storage, filename);
  
  if (isDataUrl) {
    await uploadString(storageRef, dataUrl, 'data_url');
  } else {
    // If it's already a regular URL (like mock data), just return it for now
    // In a real app we might fetch it and upload as blob, but for this prototype:
    if (dataUrl.startsWith('http')) {
      return dataUrl;
    }
    await uploadString(storageRef, dataUrl, 'base64');
  }
  
  const downloadUrl = await getDownloadURL(storageRef);
  return downloadUrl;
}
