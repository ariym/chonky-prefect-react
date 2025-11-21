const API_BASE_URL = import.meta.env.VITE_BASE_API_URL

export interface FileItem {
  id: string;
  name: string;
  isDir: boolean;
  size?: number;
  modDate?: string;
}

export interface FileMetadata extends FileItem {
  content?: string;
}

// List directory contents
export async function listFiles(path?: string): Promise<FileItem[]> {
  const url = new URL(`${API_BASE_URL}/files`);
  if (path) {
    url.searchParams.set('path', path);
  }
  
  const response = await fetch(url.toString());
  if (!response.ok) {
    throw new Error(`Failed to list files: ${response.statusText}`);
  }
  
  return response.json();
}

// Get file metadata or contents
export async function getFile(path: string, includeContent = false): Promise<FileMetadata> {
  const url = new URL(`${API_BASE_URL}/file`);
  url.searchParams.set('path', path);
  if (includeContent) {
    url.searchParams.set('content', 'true');
  }
  
  const response = await fetch(url.toString());
  if (!response.ok) {
    throw new Error(`Failed to get file: ${response.statusText}`);
  }
  
  return response.json();
}

// Create new file or directory
export async function createFile(path: string, isDir = false, content?: string): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/files`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ path, isDir, content }),
  });
  
  if (!response.ok) {
    throw new Error(`Failed to create file: ${response.statusText}`);
  }
}

// Update file contents
export async function updateFile(path: string, content: string): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/file`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ path, content }),
  });
  
  if (!response.ok) {
    throw new Error(`Failed to update file: ${response.statusText}`);
  }
}

// Delete file or directory
export async function deleteFile(path: string): Promise<void> {
  const url = new URL(`${API_BASE_URL}/file`);
  url.searchParams.set('path', path);
  
  const response = await fetch(url.toString(), {
    method: 'DELETE',
  });
  
  if (!response.ok) {
    throw new Error(`Failed to delete file: ${response.statusText}`);
  }
}

