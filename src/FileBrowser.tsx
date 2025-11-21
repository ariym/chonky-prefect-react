import React, { useCallback, useMemo, useState } from 'react';
import { ChonkyIconFA } from 'chonky-icon-fontawesome';
import {
  ChonkyActions,
  FileBrowser,
  FileContextMenu,
  FileList,
  FileNavbar,
  FileToolbar,
  setChonkyDefaults,
  defineFileAction,
  ChonkyIconName,
} from 'chonky';
// import 'chonky/style/main.css';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import type { FileData } from 'chonky';
import type { FileMap } from 'chonky/dist/types/file.types';
import * as fileAPI from './api/files';

const DEFAULT_FILE_PATH = import.meta.env.VITE_DEFAULT_FILE_BROWSER_PATH

// Set Chonky icon pack
setChonkyDefaults({ iconComponent: ChonkyIconFA as any });

// Custom action for creating files
const CreateFileAction = defineFileAction({
  id: 'create_file',
  button: {
    name: 'Create file',
    toolbar: true,
    tooltip: 'Create a new file',
    icon: ChonkyIconName.file,
  },
} as const);

// Convert backend file item to Chonky file format
function convertToChonkyFile(file: fileAPI.FileItem, currentPath: string): FileData {
  const fullPath = currentPath === '/' ? `/${file.name}` : `${currentPath}/${file.name}`;
  
  return {
    id: fullPath,
    name: file.name,
    isDir: file.isDir,
    size: file.size,
    modDate: file.modDate ? new Date(file.modDate) : undefined,
  };
}

interface FileBrowserProps {
  initialPath?: string;
}

export default function FileBrowserComponent({ initialPath = DEFAULT_FILE_PATH }: FileBrowserProps) {
  const [currentPath, setCurrentPath] = useState(initialPath);
  const queryClient = useQueryClient();

  // Fetch files for current directory
  const { data: files, isLoading, error } = useQuery({
    queryKey: ['files', currentPath],
    queryFn: () => fileAPI.listFiles(currentPath === '/' ? undefined : currentPath),
    staleTime: 5000, // Consider data fresh for 5 seconds
  });

  // Convert files to Chonky format
  const fileMap: FileMap = useMemo(() => {
    if (!files) return {};
    
    const map: FileMap = {};
    files.forEach((file) => {
      const chonkyFile = convertToChonkyFile(file, currentPath);
      map[chonkyFile.id] = chonkyFile;
    });
    
    return map;
  }, [files, currentPath]);

  // Mutations
  const createFolderMutation = useMutation({
    mutationFn: (path: string) => fileAPI.createFile(path, true),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['files', currentPath] });
    },
  });

  const createFileMutation = useMutation({
    mutationFn: ({ path, content }: { path: string; content: string }) =>
      fileAPI.createFile(path, false, content),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['files', currentPath] });
    },
  });

  const deleteFileMutation = useMutation({
    mutationFn: (path: string) => fileAPI.deleteFile(path),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['files', currentPath] });
    },
  });

  // Generate folder chain for breadcrumbs
  const folderChain = useMemo(() => getFolderChain(currentPath), [currentPath]);

  // Handle file actions
  const handleFileAction = useCallback(
    async (action: any) => {
      try {
        switch (action.id) {
          case ChonkyActions.OpenFiles.id: {
            const file = action.payload?.targetFile || action.payload?.files?.[0];
            if (file?.isDir) {
              setCurrentPath(file.id);
            }
            break;
          }

          case ChonkyActions.OpenParentFolder.id: {
            // Navigate to parent directory
            if (currentPath === '/') break;
            
            // Use folderChain to get parent (second to last item, since last is current)
            if (folderChain.length > 1) {
              const parentFolder = folderChain[folderChain.length - 2];
              if (parentFolder?.id) {
                setCurrentPath(parentFolder.id);
                break;
              }
            }
            
            // Fallback: calculate parent path from currentPath
            const parts = currentPath.split('/').filter(Boolean);
            if (parts.length <= 1) {
              // If we're at a top-level directory like /Users, go to root
              setCurrentPath('/');
            } else {
              // Remove the last part to get parent
              parts.pop();
              const parentPath = '/' + parts.join('/');
              setCurrentPath(parentPath);
            }
            break;
          }

          case ChonkyActions.CreateFolder.id: {
          const folderName = action.payload?.fileName || prompt('Enter folder name:') || 'New Folder';
          if (!folderName) break;
          const newPath = currentPath === '/' 
            ? `/${folderName}` 
            : `${currentPath}/${folderName}`;
          
            createFolderMutation.mutate(newPath);
            break;
          }

          case CreateFileAction.id: {
          const fileName = action.payload?.fileName || prompt('Enter file name:') || 'New File';
          if (!fileName) break;
          const newPath = currentPath === '/' 
            ? `/${fileName}` 
            : `${currentPath}/${fileName}`;
          
            createFileMutation.mutate({ path: newPath, content: '' });
            break;
          }

          case ChonkyActions.DeleteFiles.id: {
          const filesToDelete = action.payload?.files || [];
          if (filesToDelete.length === 0) break;
            filesToDelete.forEach((f: FileData) => {
              deleteFileMutation.mutate(f.id);
            });
            break;
          }

          case ChonkyActions.MoveFiles.id: {
          // Handle file move/rename
          const destination = action.payload?.destination;
          if (destination) {
            // This would require a move/rename endpoint
              console.log('Move not implemented yet');
            }
            break;
          }

          default:
            break;
        }
      } catch (error) {
        console.error('Error handling file action:', error);
      }
    },
    [currentPath, folderChain, createFolderMutation, createFileMutation, deleteFileMutation]
  );

  if (error) {
    return (
      <div className="p-4 text-red-600">
        Error loading files: {error instanceof Error ? error.message : 'Unknown error'}
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="p-4 text-gray-600">
        Loading files...
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col">
      <FileBrowser
        files={Object.values(fileMap)}
        folderChain={folderChain}
        onFileAction={handleFileAction}
        defaultFileViewActionId={ChonkyActions.EnableListView.id}
        fileActions={[
          ChonkyActions.CreateFolder,
          CreateFileAction,
          ChonkyActions.DeleteFiles,
          ChonkyActions.OpenFiles,
          ChonkyActions.OpenParentFolder,
        ]}
      >
        <FileNavbar />
        <FileToolbar />
        <FileList />
        <FileContextMenu />
      </FileBrowser>
    </div>
  );
}

// Generate folder chain for breadcrumbs
function getFolderChain(path: string): FileData[] {
  if (path === '/') {
    return [{ id: '/', name: 'Root', isDir: true }];
  }

  const parts = path.split('/').filter(Boolean);
  const chain: FileData[] = [{ id: '/', name: 'Root', isDir: true }];

  let currentPath = '';
  parts.forEach((part) => {
    currentPath = currentPath === '' ? `/${part}` : `${currentPath}/${part}`;
    chain.push({
      id: currentPath,
      name: part,
      isDir: true,
    });
  });

  return chain;
}

