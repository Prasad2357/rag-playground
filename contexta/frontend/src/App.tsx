import { useState } from 'react';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Sidebar } from '@/components/Sidebar';
import { ChatPanel } from '@/components/ChatPanel';
import type { UploadedFile } from '@/types';

function App() {
  const [files, setFiles] = useState<UploadedFile[]>([]);

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
