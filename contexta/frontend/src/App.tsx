import { useState, useEffect } from 'react';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Sidebar } from '@/components/Sidebar';
import { ChatPanel } from '@/components/ChatPanel';
import type { UploadedFile } from '@/types';
import { listDocuments } from '@/api';

function App() {
  const [files, setFiles] = useState<UploadedFile[]>([]);

  // Rehydrate the sidebar with documents that were indexed in previous sessions
  useEffect(() => {
    listDocuments().then((docs) => {
      if (docs.length === 0) return;
      const restored: UploadedFile[] = docs.map((doc) => ({
        // Stable ID derived from the filename so duplicates aren't added
        // if the user uploads the same file again later in the session.
        id: `persisted-${doc.name}`,
        name: doc.name,
        size: doc.size,
        uploadedAt: new Date(doc.uploadedAt * 1000), // convert unix seconds → Date
        status: 'ready',
        selected: false,
      }));
      setFiles(restored);
    });
  }, []);

  const handleFilesChange = (updater: UploadedFile[] | ((prev: UploadedFile[]) => UploadedFile[])) => {
    if (typeof updater === 'function') {
      setFiles(updater);
    } else {
      setFiles(updater);
    }
  };

  return (
    <TooltipProvider delayDuration={300}>
      {/* Background grid */}
      <div className="fixed inset-0 bg-grid pointer-events-none" />

      {/* Ambient glow blobs */}
      <div className="fixed top-[-10%] left-[20%] w-[500px] h-[400px] rounded-full blur-[120px] pointer-events-none"
        style={{ background: 'oklch(0.5 0.18 280 / 8%)' }} />
      <div className="fixed bottom-[-5%] right-[15%] w-[400px] h-[300px] rounded-full blur-[100px] pointer-events-none"
        style={{ background: 'oklch(0.5 0.22 300 / 6%)' }} />

      {/* Main layout */}
      <div className="relative flex h-full w-full overflow-hidden">
        <Sidebar files={files} onFilesChange={handleFilesChange} />
        <ChatPanel files={files} />
      </div>
    </TooltipProvider>
  );
}

export default App;
